/**
 * Ava's long-term memory and the user's knowledge graph, executed in the browser
 * under the user's session (RLS: users only ever touch their own rows).
 * Schemas: supabase/functions/_shared/memory-tools-schema.ts.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Json = Record<string, unknown>;

// These tables are newer than the generated types; use an untyped client for them.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as SupabaseClient<any>;

export const MEMORY_TOOL_NAMES = new Set(["remember", "recall", "forget", "graph_add", "graph_query"]);

export interface KgNode {
  id: string;
  label: string;
  type: string;
  description: string | null;
}
export interface KgEdge {
  id: string;
  source_id: string;
  target_id: string;
  relation: string;
}

const clean = (s: unknown, max = 500) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);

function keywords(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .filter((w) => w.length > 2)
    .slice(0, 6);
}

/** Finds or creates nodes by label (case-insensitive). Returns label(lowercase) -> id. */
async function upsertNodes(userId: string, nodes: { label: string; type?: string; description?: string }[]) {
  const ids = new Map<string, string>();
  const wanted = nodes.map((n) => ({ ...n, label: clean(n.label, 120) })).filter((n) => n.label);
  if (!wanted.length) return ids;

  const { data: existing } = await db.from("kg_nodes").select("id, label, description").eq("user_id", userId);
  const byLabel = new Map((existing ?? []).map((n: { id: string; label: string; description: string | null }) => [n.label.toLowerCase(), n]));

  for (const n of wanted) {
    const key = n.label.toLowerCase();
    const found = byLabel.get(key);
    if (found) {
      ids.set(key, found.id);
      if (n.description && !found.description) {
        await db.from("kg_nodes").update({ description: clean(n.description), updated_at: new Date().toISOString() }).eq("id", found.id);
      }
      continue;
    }
    const { data, error } = await db
      .from("kg_nodes")
      .insert({ user_id: userId, label: n.label, type: clean(n.type || "idea", 30), description: n.description ? clean(n.description) : null })
      .select("id")
      .single();
    if (!error && data) {
      ids.set(key, data.id);
      byLabel.set(key, { id: data.id, label: n.label, description: n.description ?? null });
    }
  }
  return ids;
}

export async function runMemoryTool(userId: string, name: string, args: Json): Promise<Json> {
  try {
    switch (name) {
      case "remember": {
        const content = clean(args.content, 600);
        if (!content) return { error: "Nothing to remember" };
        const importance = Math.min(5, Math.max(1, Math.round(Number(args.importance) || 3)));
        const { data, error } = await db
          .from("ava_memories")
          .insert({ user_id: userId, content, kind: clean(args.kind || "fact", 30), importance })
          .select("id")
          .single();
        if (error) return { error: error.message };
        window.dispatchEvent(new CustomEvent("ava:memory-changed"));
        return { saved: true, id: data.id };
      }
      case "recall": {
        const words = keywords(String(args.query ?? ""));
        let memQ = db.from("ava_memories").select("id, kind, content, importance, created_at").eq("user_id", userId);
        let nodeQ = db.from("kg_nodes").select("id, label, type, description").eq("user_id", userId);
        if (words.length) {
          memQ = memQ.or(words.map((w) => `content.ilike.%${w}%`).join(","));
          nodeQ = nodeQ.or(words.flatMap((w) => [`label.ilike.%${w}%`, `description.ilike.%${w}%`]).join(","));
        }
        const [{ data: memories }, { data: nodes }] = await Promise.all([
          memQ.order("importance", { ascending: false }).order("created_at", { ascending: false }).limit(15),
          nodeQ.limit(10),
        ]);
        return { memories: memories ?? [], graph_nodes: nodes ?? [] };
      }
      case "forget": {
        const id = String(args.memory_id ?? "");
        if (!id) return { error: "memory_id required" };
        const { error } = await db.from("ava_memories").delete().eq("id", id).eq("user_id", userId);
        if (error) return { error: error.message };
        window.dispatchEvent(new CustomEvent("ava:memory-changed"));
        return { forgotten: true };
      }
      case "graph_add": {
        const nodes = Array.isArray(args.nodes) ? (args.nodes as { label: string; type?: string; description?: string }[]) : [];
        const edges = Array.isArray(args.edges) ? (args.edges as { from: string; to: string; relation: string }[]) : [];
        // Edge endpoints that weren't declared as nodes get created as ideas.
        const all = [...nodes];
        for (const e of edges) {
          for (const label of [e.from, e.to]) {
            if (label && !all.some((n) => clean(n.label, 120).toLowerCase() === clean(label, 120).toLowerCase())) all.push({ label, type: "idea" });
          }
        }
        const ids = await upsertNodes(userId, all);
        let linked = 0;
        for (const e of edges) {
          const s = ids.get(clean(e.from, 120).toLowerCase());
          const t = ids.get(clean(e.to, 120).toLowerCase());
          const relation = clean(e.relation, 60);
          if (!s || !t || !relation || s === t) continue;
          const { error } = await db.from("kg_edges").insert({ user_id: userId, source_id: s, target_id: t, relation });
          if (!error || error.code === "23505") linked++;
        }
        window.dispatchEvent(new CustomEvent("ava:graph-changed"));
        return { nodes: ids.size, edges: linked };
      }
      case "graph_query": {
        const label = clean(args.label, 120);
        if (!label) {
          const [{ data: nodes }, { count }] = await Promise.all([
            db.from("kg_nodes").select("label, type").eq("user_id", userId).order("updated_at", { ascending: false }).limit(40),
            db.from("kg_edges").select("id", { count: "exact", head: true }).eq("user_id", userId),
          ]);
          return { node_count: nodes?.length ?? 0, edge_count: count ?? 0, nodes: nodes ?? [] };
        }
        const { data: node } = await db
          .from("kg_nodes")
          .select("id, label, type, description")
          .eq("user_id", userId)
          .ilike("label", `%${label}%`)
          .limit(1)
          .maybeSingle();
        if (!node) return { error: `Nothing in the graph called "${label}" yet.` };
        const { data: edges } = await db
          .from("kg_edges")
          .select("relation, source_id, target_id")
          .eq("user_id", userId)
          .or(`source_id.eq.${node.id},target_id.eq.${node.id}`)
          .limit(40);
        const rows = (edges ?? []) as { relation: string; source_id: string; target_id: string }[];
        const otherIds = Array.from(new Set(rows.map((e) => (e.source_id === node.id ? e.target_id : e.source_id))));
        const { data: others } = otherIds.length
          ? await db.from("kg_nodes").select("id, label").in("id", otherIds)
          : { data: [] };
        const labelById = new Map(((others ?? []) as { id: string; label: string }[]).map((n) => [n.id, n.label]));
        const connections = rows.map((e) =>
          e.source_id === node.id
            ? `${node.label} ${e.relation} ${labelById.get(e.target_id) ?? "?"}`
            : `${labelById.get(e.source_id) ?? "?"} ${e.relation} ${node.label}`,
        );
        return { node, connections };
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Memory tool failed" };
  }
}

/** Loads the whole graph for the Knowledge Graph page. */
export async function loadGraph(userId: string): Promise<{ nodes: KgNode[]; edges: KgEdge[] }> {
  const [{ data: nodes }, { data: edges }] = await Promise.all([
    db.from("kg_nodes").select("id, label, type, description").eq("user_id", userId).limit(500),
    db.from("kg_edges").select("id, source_id, target_id, relation").eq("user_id", userId).limit(1500),
  ]);
  return { nodes: (nodes ?? []) as KgNode[], edges: (edges ?? []) as KgEdge[] };
}

export async function loadMemories(userId: string) {
  const { data } = await db
    .from("ava_memories")
    .select("id, kind, content, importance, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []) as { id: string; kind: string; content: string; importance: number; created_at: string }[];
}

export async function deleteMemory(userId: string, id: string) {
  await db.from("ava_memories").delete().eq("id", id).eq("user_id", userId);
}

export async function deleteNode(userId: string, id: string) {
  await db.from("kg_nodes").delete().eq("id", id).eq("user_id", userId);
}
