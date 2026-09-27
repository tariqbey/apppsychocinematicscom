// Admin-only: embeds Law of Success text chunks and stores them in law_of_success_chunks,
// so analyze-character-progress and law-of-success-search can quote the real 1928 text.
// Called by scripts/ingest-law-of-success.mjs.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChunkInput {
  volume: number | null;
  lesson: number | null;
  lesson_name: string | null;
  chunk_index: number;
  content: string;
}

const MAX_CHUNKS_PER_CALL = 50;
const MAX_CHUNK_CHARS = 4000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "No authorization header" }, 401);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user }, error: authError } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) return json({ error: "Admins only" }, 403);

    const body = await req.json();
    const chunks: ChunkInput[] = Array.isArray(body?.chunks) ? body.chunks : [];
    const replace = body?.replace === true;

    if (replace) {
      const { error } = await admin.from("law_of_success_chunks").delete().not("id", "is", null);
      if (error) throw error;
      if (chunks.length === 0) return json({ success: true, deleted: true, inserted: 0 });
    }

    if (chunks.length === 0 || chunks.length > MAX_CHUNKS_PER_CALL) {
      return json({ error: `Send between 1 and ${MAX_CHUNKS_PER_CALL} chunks per call` }, 400);
    }
    for (const c of chunks) {
      if (typeof c.content !== "string" || !c.content.trim() || c.content.length > MAX_CHUNK_CHARS) {
        return json({ error: `Each chunk needs content of 1-${MAX_CHUNK_CHARS} characters` }, 400);
      }
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const embedRes = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai/text-embedding-3-small", input: chunks.map((c) => c.content) }),
    });
    if (!embedRes.ok) throw new Error(`Embedding error: ${embedRes.status}`);
    const embedJson = await embedRes.json();
    const embeddings: number[][] = (embedJson?.data ?? []).map((d: { embedding: number[] }) => d.embedding);
    if (embeddings.length !== chunks.length) throw new Error("Embedding count mismatch");

    const rows = chunks.map((c, i) => ({
      volume: c.volume,
      lesson: c.lesson,
      lesson_name: c.lesson_name,
      chunk_index: c.chunk_index,
      content: c.content,
      embedding: embeddings[i] as unknown as string,
    }));
    const { error: insertError } = await admin.from("law_of_success_chunks").insert(rows);
    if (insertError) throw insertError;

    return json({ success: true, inserted: rows.length });
  } catch (error: unknown) {
    console.error("ingest-law-of-success error:", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
