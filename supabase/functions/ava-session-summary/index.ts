// After a voice session with Ava (or the Director AI), turn the conversation into
// long-term memory: a short session summary, durable memories, and knowledge graph
// nodes/edges. Writes under the user's own session, so RLS applies.
//
// Secrets: LOVABLE_API_KEY (Lovable AI gateway; built in).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { MEMORY_KINDS, NODE_TYPES } from "../_shared/memory-tools-schema.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

const clean = (s: unknown, max: number) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);

const EXTRACT_TOOL = {
  type: "function",
  function: {
    name: "save_session",
    description: "Save what should be remembered from this coaching conversation.",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string", description: "One or two sentences: what was discussed, decided and committed to." },
        memories: {
          type: "array",
          description: "Durable facts worth knowing next week or later. Skip small talk and anything already in EXISTING MEMORIES.",
          items: {
            type: "object",
            properties: {
              content: { type: "string", description: "Short third-person sentence." },
              kind: { type: "string", enum: MEMORY_KINDS.filter((k) => k !== "session_summary") },
              importance: { type: "number", description: "1-5" },
            },
            required: ["content", "kind", "importance"],
          },
        },
        nodes: {
          type: "array",
          description: "People, goals, projects, businesses, habits, fears, strengths, values, beliefs, ideas mentioned that matter to the user.",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              type: { type: "string", enum: NODE_TYPES },
              description: { type: "string" },
            },
            required: ["label", "type"],
          },
        },
        edges: {
          type: "array",
          items: {
            type: "object",
            properties: {
              from: { type: "string" },
              to: { type: "string" },
              relation: { type: "string", description: "Short verb phrase" },
            },
            required: ["from", "to", "relation"],
          },
        },
      },
      required: ["summary", "memories", "nodes", "edges"],
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const client = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsError } = await client.auth.getClaims(authHeader.replace("Bearer ", ""));
    const userId = claims?.claims?.sub;
    if (claimsError || !userId) return json({ error: "Invalid token" }, 401);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "LOVABLE_API_KEY is not configured" }, 503);

    const body = await req.json();
    const lines = Array.isArray(body?.transcript) ? body.transcript : [];
    const name = clean(body?.name, 60) || "the user";
    const transcript = lines
      .slice(-120)
      .map((l: { role?: string; text?: string }) => `${l.role === "user" ? name : "Coach"}: ${clean(l.text, 1200)}`)
      .join("\n")
      .slice(-24000);
    const userWords = lines.filter((l: { role?: string }) => l.role === "user").map((l: { text?: string }) => String(l.text ?? "")).join(" ");
    if (userWords.trim().split(/\s+/).length < 6) return json({ skipped: "Too short to remember." });

    const [{ data: existing }, { data: existingNodes }] = await Promise.all([
      client.from("ava_memories").select("content").eq("user_id", userId).neq("kind", "session_summary").order("created_at", { ascending: false }).limit(60),
      client.from("kg_nodes").select("id, label, description").eq("user_id", userId),
    ]);

    const system = `You maintain the long-term memory and personal knowledge graph for a Psycho-Cinematics coaching app. From the conversation, extract only what matters about ${name}: their goals and Chief Aim, projects and businesses, the people in their life, wins, struggles, fears, habits, commitments with dates, and preferences. Write memories as short third-person sentences ("${name} ..."). Don't invent anything that wasn't said. Don't repeat EXISTING MEMORIES. Reuse EXISTING GRAPH labels exactly when the same thing comes up.

EXISTING MEMORIES:
${(existing ?? []).map((m: { content: string }) => `- ${m.content}`).join("\n") || "(none)"}

EXISTING GRAPH LABELS: ${(existingNodes ?? []).map((n: { label: string }) => n.label).join(", ") || "(none)"}`;

    const ai = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: `CONVERSATION:\n${transcript}` },
        ],
        tools: [EXTRACT_TOOL],
        tool_choice: { type: "function", function: { name: "save_session" } },
      }),
    });
    if (!ai.ok) {
      console.error("ava-session-summary AI error", ai.status, await ai.text());
      return json({ error: "Couldn't summarize the session." }, 502);
    }
    const result = await ai.json();
    const args = result.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return json({ error: "No summary returned." }, 502);
    const out = JSON.parse(args);

    // 1) Session summary + memories
    const memRows = [
      { user_id: userId, kind: "session_summary", content: clean(out.summary, 600), importance: 3, source: "session" },
      ...(Array.isArray(out.memories) ? out.memories : []).slice(0, 12).map((m: { content: string; kind: string; importance: number }) => ({
        user_id: userId,
        kind: MEMORY_KINDS.includes(m.kind) ? m.kind : "fact",
        content: clean(m.content, 600),
        importance: Math.min(5, Math.max(1, Math.round(Number(m.importance) || 3))),
        source: "session",
      })),
    ].filter((r) => r.content);
    if (memRows.length) await client.from("ava_memories").insert(memRows);

    // 2) Graph nodes (matched by label, case-insensitive) + edges
    const ids = new Map<string, string>((existingNodes ?? []).map((n: { id: string; label: string }) => [n.label.toLowerCase(), n.id]));
    const nodes = (Array.isArray(out.nodes) ? out.nodes : []).slice(0, 25);
    const edges = (Array.isArray(out.edges) ? out.edges : []).slice(0, 40);
    for (const e of edges) {
      for (const label of [e.from, e.to]) {
        if (label && !nodes.some((n: { label: string }) => clean(n.label, 120).toLowerCase() === clean(label, 120).toLowerCase())) {
          nodes.push({ label, type: "idea" });
        }
      }
    }
    let added = 0;
    for (const n of nodes) {
      const label = clean(n.label, 120);
      if (!label || ids.has(label.toLowerCase())) continue;
      const { data } = await client
        .from("kg_nodes")
        .insert({ user_id: userId, label, type: NODE_TYPES.includes(n.type) ? n.type : "idea", description: n.description ? clean(n.description, 500) : null })
        .select("id")
        .single();
      if (data) {
        ids.set(label.toLowerCase(), data.id);
        added++;
      }
    }
    let linked = 0;
    for (const e of edges) {
      const s = ids.get(clean(e.from, 120).toLowerCase());
      const t = ids.get(clean(e.to, 120).toLowerCase());
      const relation = clean(e.relation, 60);
      if (!s || !t || s === t || !relation) continue;
      const { error } = await client.from("kg_edges").insert({ user_id: userId, source_id: s, target_id: t, relation });
      if (!error) linked++;
    }

    return json({ saved: memRows.length, nodes: added, edges: linked });
  } catch (e) {
    console.error("ava-session-summary error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
