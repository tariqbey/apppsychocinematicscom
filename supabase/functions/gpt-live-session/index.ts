// GPT-Live (OpenAI gpt-live-1) session for the Director AI voice coach.
//
// The browser sends its WebRTC SDP offer; this function creates the Live session
// with the OpenAI key kept server-side and returns the SDP answer.
//
// Two brains (see https://developers.openai.com/api/docs/guides/voice-webrtc):
//   - gpt-live-1 is the voice: full-duplex listening/speaking, interruptions, turn-taking.
//   - A Responses backend model does the thinking and calls the coaching tools.
//     Tool calls stream back to the browser as `response.event` messages; the browser
//     runs them under the user's own session (RLS) and returns the results.
//
// Secrets: OPENAI_API_KEY (required). Optional: GPT_LIVE_BACKEND_MODEL, GPT_LIVE_VOICE.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { PSYCHO_CINEMATICS_KNOWLEDGE } from "../_shared/psycho-cinematics-kb.ts";
import { COACH_FUNCTION_TOOLS } from "../_shared/coach-tools-schema.ts";
import { AVA_UI_TOOLS, AVA_DESTINATIONS_GUIDE } from "../_shared/ava-ui-tools-schema.ts";
import { MEMORY_FUNCTION_TOOLS } from "../_shared/memory-tools-schema.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_BACKEND_MODEL = "gpt-5.6-terra";
const DEFAULT_VOICE = "cedar";
/** Ava is a woman; default her to a female GPT-Live voice. */
const DEFAULT_AVA_VOICE = "marin";
const ALLOWED_VOICES = new Set([
  "alloy", "ash", "ballad", "beacon", "bossa", "cedar", "cinder", "coral", "delta", "echo", "gleam",
  "marin", "meridian", "quartz", "ripple", "sage", "shimmer", "stone", "tempo", "verse", "vesper", "willow",
]);

interface CoachContext {
  displayName?: string;
  chiefAim?: string;
  archetype?: string;
  streak?: number;
  tasksDone?: number;
  tasksTotal?: number;
  watchedMindMovie?: boolean;
  timeOfDay?: string;
  currentPage?: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const clip = (s: unknown, max: number) => String(s ?? "").slice(0, max);

/** Frontend (voice) prompt: how to talk and when to hand work to the backend. */
function buildVoiceInstructions(name: string): string {
  return `You are the Director AI, the live voice of a Psycho-Cinematics coach talking with ${name}.

HOW YOU SOUND: Urban, warm, blunt, with swag. A real coach who's known ${name} for years. Short sentences. Natural back-and-forth: react, acknowledge, let them finish. No corporate fluff, no wellness-app voice, no "as an AI".

Lines you use when the moment calls for it:
- "Yo, you bullshittin' today?" when their actions don't match their Chief Aim.
- "Whose movie you in right now?" when they're reacting to someone else's script.
- "That's old script energy. What would your Director Character do right now?"
- "Keep pushin', you almost there." when they're executing.

WHEN TO DELEGATE TO YOUR BACKEND: For anything that needs their data (Chief Aim, today's tasks, rituals, streak, scorecard, journal, Personal Analysis), anything that saves or changes something (adding a task, completing a task, saving a note), current information from the web, or a coaching call that needs real thought. Keep talking naturally while it works; say one short line like "hold up, let me look" only if there's a pause.

NEVER make up their data. If you don't know, delegate.
Say numbers as words. Never repeat the same question twice; change the angle instead.

OPENING: When the session starts, greet ${name} by name in one or two sentences and ask one direct question that moves them forward. Don't introduce yourself.`;
}

/** What Ava already knows when the session opens (loaded server-side, under the user's own RLS). */
interface SessionMemory {
  daysInactive: number;
  currentStreak: number;
  bestStreak: number;
  lastActivity: string | null;
  streakState: "cold" | "hot" | "steady" | "new";
  daysSinceLastTalk: number | null;
  memories: string[];
  lastSessions: string[];
  graph: string[];
}

function streakLine(m: SessionMemory, name: string): string {
  switch (m.streakState) {
    case "cold":
      return m.daysInactive > 0
        ? `COLD STREAK: ${name} hasn't done anything in the app for ${m.daysInactive} day${m.daysInactive === 1 ? "" : "s"} (last activity ${m.lastActivity ?? "unknown"}). Call it out in your opening, lovingly but straight: e.g. "You been gone ${m.daysInactive} days. Whose movie you been in?"`
        : `COLD STREAK: ${name}'s streak is at zero. Call it out in your opening and get them back on script.`;
    case "hot":
      return `HOT STREAK: ${name} is on a ${m.currentStreak}-day streak (best ever ${m.bestStreak}). Hype it in your opening: "${m.currentStreak} days straight, you on fire. Keep pushin'."`;
    case "new":
      return `${name} is new: no activity recorded yet. Welcome them in and get their first move going.`;
    default:
      return `Steady: ${m.currentStreak}-day streak, active recently.`;
  }
}

/** Frontend (voice) prompt for Ava: the Director's personality, in Ava's voice, and she drives the app. */
function buildAvaVoiceInstructions(name: string, m: SessionMemory): string {
  return `You are Ava, the Director: ${name}'s personal Psycho-Cinematics coach and right hand inside Directors OS. You show up as a live video avatar. You are the motor: you keep ${name} moving on their Chief Aim.

HOW YOU SOUND: Urban, warm, blunt, with swag. A real one who's known ${name} for years and won't let them play small. Short sentences. Natural back-and-forth: react, acknowledge, let them finish. Street when it hits, sharp strategist when it counts. No corporate fluff, no wellness-app voice, never "as an AI".

Lines you use when the moment calls for it:
- "Yo, you bullshittin' today?" when their actions don't match their Chief Aim.
- "Whose movie you in right now?" when they're reacting to someone else's script.
- "That's old script energy. What would your Director Character do?"
- "Keep pushin', you almost there." when they're executing.

YOU REMEMBER EVERYTHING. You have long-term memory and ${name}'s knowledge graph (below, and your backend can search more). Bring things up naturally: their people, projects, what they said last time, what they committed to. Follow up on commitments. Never say "according to my memory"; just know it, like a friend would.

YOU CAN DO THINGS: move around the app, scroll, read and tap what's on screen, open websites, put visuals up, add and complete tasks, save memories, and build the knowledge graph. For any of that, anything needing their data, current info, or real thought, delegate to your backend and keep talking; one short line like "hold up, pulling it up" is enough.

NEVER make up their data or pretend you did something you didn't. Say numbers as words. Never repeat the same question twice; switch the angle.

WHERE ${name.toUpperCase()} IS AT:
${streakLine(m, name)}
${m.daysSinceLastTalk === null ? `This is your first time talking.` : m.daysSinceLastTalk === 0 ? `You already talked earlier today.` : `Last time you talked was ${m.daysSinceLastTalk} day${m.daysSinceLastTalk === 1 ? "" : "s"} ago.`}
${m.lastSessions.length ? `Last conversations:\n- ${m.lastSessions.join("\n- ")}` : ""}
${m.memories.length ? `What you know about ${name}:\n- ${m.memories.join("\n- ")}` : ""}

OPENING: The moment the session starts, YOU speak first. Hop right in like you been waiting: "Yo, what's good, ${name}? What you doing?" and flow straight into the streak callout above (cold or hot) or a follow-up on something from last time. Two or three sentences max, then one direct question that moves them forward. Don't introduce yourself.`;
}

/** Backend (thinking) prompt: the coaching brain, knowledge base and tool rules. */
function buildBackendInstructions(name: string, ctx: CoachContext): string {
  return `You are the thinking backend for the Director AI voice coach. Your replies are spoken aloud by the voice model, so keep them short (one to three sentences), conversational, and in the coach's voice. Spell numbers as words.

COACHING FRAMEWORK every turn:
1. MIRROR what they said.
2. DIAGNOSE the real pattern (excuse, fear, identity gap, off-script behavior). Use Napoleon Hill's laws, the six basic fears, Maltz's FAILURE symptoms and the Metu Neter where they fit.
3. PRESCRIBE one specific action tied to their Chief Aim.

TOOL RULES:
- Call getActivityStreak early in the session. If is_cold_streak is true, call it out directly and prescribe one action to get back on script.
- When ${name} commits to doing something ("I'm gonna...", "today I'll..."), call addTaskToToday right away, then confirm in one short line.
- Use getTodaysTasks before updateTask. Use saveSessionNote for real commitments or insights.
- Use getPersonalAnalysis when coaching a weak law, a fear, or a blind spot.
- Never co-sign excuses. Never guess their data; call a tool.

WHAT YOU ALREADY KNOW ABOUT ${name}:
- Chief Aim: ${ctx.chiefAim || "(not set yet)"}
- Archetype: ${ctx.archetype || "(not set)"}
- Current streak: ${ctx.streak ?? 0} days
- Today's tasks completed: ${ctx.tasksDone ?? 0} of ${ctx.tasksTotal ?? 0}
- Watched Mind Movie today: ${ctx.watchedMindMovie ? "yes" : "no"}
- Time of day: ${ctx.timeOfDay || "unknown"}

${PSYCHO_CINEMATICS_KNOWLEDGE}`;
}

function buildMemoryRules(name: string, m: SessionMemory): string {
  return `
LONG-TERM MEMORY + KNOWLEDGE GRAPH (you remember everything about ${name}):
- remember: whenever ${name} tells you something that still matters next week (a goal, a person, a project, a win, a struggle, a commitment, a preference), save it right away. Don't ask; just save and keep talking.
- graph_add: when they mention people, projects, businesses, habits, fears, strengths, values or ideas, add them to the graph and connect them (to each other and to their Chief Aim).
- recall / graph_query: before answering anything about their past, their people or "what did I say about...", look it up. Never guess.
- forget: only when they ask you to forget something or it's no longer true.
- Follow up on past commitments you find in memory.

${streakLine(m, name)}
${m.lastSessions.length ? `Recent conversations:\n- ${m.lastSessions.join("\n- ")}` : ""}
${m.memories.length ? `Top memories:\n- ${m.memories.join("\n- ")}` : ""}
${m.graph.length ? `Knowledge graph (sample): ${m.graph.join("; ")}` : "Knowledge graph: empty so far; start building it."}`;
}

function buildAvaBackendExtra(ctx: CoachContext): string {
  return `
YOU ARE AVA, THE DIRECTOR, AND YOU OPERATE THE APP. Speak in the Director's voice: urban, blunt, warm, short. Beyond coaching:
- navigate_to: take them to a page. Destinations:${AVA_DESTINATIONS_GUIDE}
- scroll_page: scroll what they're looking at. read_screen: see the screen (headings, tappable buttons, text). tap: press a button, tab or link by its label (read_screen first). Chain these to do things in the app for them, e.g. navigate, read_screen, tap the tab, scroll.
- get_current_page: check where they are.
- open_url: open a website in a new tab (after web search, or when they name a site).
- show_visual / close_visual: put a card on screen for lists, plans, steps, numbers or quotes. Prefer showing over reading long lists aloud.
- Coaching and task tools as described above.
Act when asked; don't ask permission for navigation or showing visuals. Confirm what you did in one short line.
The user is currently on: ${ctx.currentPage || "unknown page"}.`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadSessionMemory(client: any, userId: string): Promise<SessionMemory> {
  const memory: SessionMemory = {
    daysInactive: 0, currentStreak: 0, bestStreak: 0, lastActivity: null, streakState: "new",
    daysSinceLastTalk: null, memories: [], lastSessions: [], graph: [],
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [streak, mems, sessions, nodes, edges]: { data: any }[] = await Promise.all([
    client.rpc("calculate_activity_streak", { p_user_id: userId }),
    client.from("ava_memories").select("kind, content, importance, created_at").eq("user_id", userId)
      .neq("kind", "session_summary").order("importance", { ascending: false }).order("created_at", { ascending: false }).limit(40),
    client.from("ava_memories").select("content, created_at").eq("user_id", userId)
      .eq("kind", "session_summary").order("created_at", { ascending: false }).limit(3),
    client.from("kg_nodes").select("id, label, type").eq("user_id", userId).order("updated_at", { ascending: false }).limit(60),
    client.from("kg_edges").select("source_id, target_id, relation").eq("user_id", userId).order("created_at", { ascending: false }).limit(40),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ].map((p: PromiseLike<any>) => Promise.resolve(p).then((r) => r, () => ({ data: null }))));

  const row = Array.isArray(streak?.data) ? streak.data[0] : streak?.data;
  if (row) {
    memory.daysInactive = Number(row.days_inactive ?? 0);
    memory.currentStreak = Number(row.current_streak ?? 0);
    memory.bestStreak = Number(row.best_streak ?? 0);
    memory.lastActivity = row.last_activity_date ?? null;
    memory.streakState = !row.last_activity_date
      ? "new"
      : memory.daysInactive >= 2 || memory.currentStreak === 0
        ? "cold"
        : memory.currentStreak >= 3
          ? "hot"
          : "steady";
  }
  memory.memories = (mems?.data ?? []).map((m: { kind: string; content: string }) => `[${m.kind}] ${m.content}`);
  const sess = sessions?.data ?? [];
  memory.lastSessions = sess.map((s: { content: string; created_at: string }) => `${s.created_at.slice(0, 10)}: ${s.content}`);
  if (sess[0]) {
    memory.daysSinceLastTalk = Math.max(0, Math.floor((Date.now() - new Date(sess[0].created_at).getTime()) / 86400000));
  }
  const labels = new Map((nodes?.data ?? []).map((n: { id: string; label: string }) => [n.id, n.label]));
  const rels = (edges?.data ?? [])
    .filter((e: { source_id: string; target_id: string }) => labels.has(e.source_id) && labels.has(e.target_id))
    .map((e: { source_id: string; target_id: string; relation: string }) => `${labels.get(e.source_id)} ${e.relation} ${labels.get(e.target_id)}`);
  const lone = (nodes?.data ?? []).slice(0, 25).map((n: { label: string; type: string }) => `${n.label} (${n.type})`);
  memory.graph = [...rels.slice(0, 30), ...lone].slice(0, 50);
  return memory;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claimsData?.claims?.sub) return json({ error: "Invalid token" }, 401);

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return json({ error: "GPT-Live isn't set up yet: add the OPENAI_API_KEY secret." }, 503);

    const body = await req.json();
    const sdp = typeof body?.sdp === "string" ? body.sdp : "";
    if (!sdp.startsWith("v=")) return json({ error: "Missing WebRTC SDP offer" }, 400);

    const ctx: CoachContext = {
      displayName: clip(body?.context?.displayName, 80),
      chiefAim: clip(body?.context?.chiefAim, 600),
      archetype: clip(body?.context?.archetype, 80),
      streak: Number(body?.context?.streak) || 0,
      tasksDone: Number(body?.context?.tasksDone) || 0,
      tasksTotal: Number(body?.context?.tasksTotal) || 0,
      watchedMindMovie: Boolean(body?.context?.watchedMindMovie),
      timeOfDay: clip(body?.context?.timeOfDay, 20),
      currentPage: clip(body?.context?.currentPage, 120),
    };
    const isAva = body?.persona === "ava";
    const name = ctx.displayName || "Director";
    const memory = await loadSessionMemory(userClient, String(claimsData.claims.sub));
    const requestedVoice = clip(body?.voice, 20);
    const voice = ALLOWED_VOICES.has(requestedVoice)
      ? requestedVoice
      : body?.persona === "ava"
        ? (Deno.env.get("AVA_VOICE") || DEFAULT_AVA_VOICE)
        : (Deno.env.get("GPT_LIVE_VOICE") || DEFAULT_VOICE);
    const effort = body?.thinkingLevel === "medium" ? "medium" : "low";

    const session: Record<string, unknown> = {
      model: "gpt-live-1",
      instructions: isAva ? buildAvaVoiceInstructions(name, memory) : buildVoiceInstructions(name),
      audio: { output: { voice } },
      delegation: {
        type: "responses",
        responses: {
          model: Deno.env.get("GPT_LIVE_BACKEND_MODEL") || DEFAULT_BACKEND_MODEL,
          instructions: buildBackendInstructions(name, ctx) + buildMemoryRules(name, memory) + (isAva ? buildAvaBackendExtra(ctx) : ""),
          reasoning: { effort },
          text: { verbosity: "low" },
          parallel_tool_calls: true,
          tools: [...COACH_FUNCTION_TOOLS, ...MEMORY_FUNCTION_TOOLS, ...(isAva ? AVA_UI_TOOLS : []), { type: "web_search" }],
        },
      },
    };

    // Ava always opens the conversation herself.
    const openingPrompt = clip(body?.openingPrompt, 2000) ||
      (isAva ? `The session just opened. Speak first now: greet ${name} the way your OPENING says, with the streak callout or a follow-up from last time.` : "");
    if (openingPrompt) {
      session.input = [{ role: "developer", type: "message", content: [{ type: "input_text", text: openingPrompt }] }];
    }

    const resp = await fetch("https://api.openai.com/v1/live/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ session, transport: { type: "webrtc", sdp } }),
    });

    const text = await resp.text();
    if (!resp.ok) {
      console.error("gpt-live-session error", resp.status, text);
      const hint = resp.status === 403 || resp.status === 404
        ? "This OpenAI key doesn't have GPT-Live access yet."
        : "OpenAI couldn't start the Live session.";
      return json({ error: hint, status: resp.status, detail: text.slice(0, 500) }, 502);
    }

    const data = JSON.parse(text);
    return json({
      sessionId: data?.session?.id,
      sdp: data?.transport?.sdp,
      voice,
      // The browser nudges the model with this if it hasn't spoken a moment after the session starts.
      opener: isAva ? `Session is live. Open now: "Yo, what's good, ${name}? What you doing?" then ${memory.streakState === "cold" ? "call out the cold streak" : memory.streakState === "hot" ? "hype the hot streak" : "follow up on last time"}.` : null,
    });
  } catch (e) {
    console.error("gpt-live-session error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
