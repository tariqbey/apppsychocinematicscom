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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_BACKEND_MODEL = "gpt-5.6-terra";
const DEFAULT_VOICE = "cedar";
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
    };
    const name = ctx.displayName || "Director";
    const requestedVoice = clip(body?.voice, 20);
    const voice = ALLOWED_VOICES.has(requestedVoice)
      ? requestedVoice
      : (Deno.env.get("GPT_LIVE_VOICE") || DEFAULT_VOICE);
    const effort = body?.thinkingLevel === "medium" ? "medium" : "low";

    const session: Record<string, unknown> = {
      model: "gpt-live-1",
      instructions: buildVoiceInstructions(name),
      audio: { output: { voice } },
      delegation: {
        type: "responses",
        responses: {
          model: Deno.env.get("GPT_LIVE_BACKEND_MODEL") || DEFAULT_BACKEND_MODEL,
          instructions: buildBackendInstructions(name, ctx),
          reasoning: { effort },
          text: { verbosity: "low" },
          parallel_tool_calls: true,
          tools: [...COACH_FUNCTION_TOOLS, { type: "web_search" }],
        },
      },
    };

    const openingPrompt = clip(body?.openingPrompt, 2000);
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
    return json({ sessionId: data?.session?.id, sdp: data?.transport?.sdp, voice });
  } catch (e) {
    console.error("gpt-live-session error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
