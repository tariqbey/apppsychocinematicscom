import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const query = typeof body?.query === "string" ? body.query.trim().slice(0, 1000) : "";
    const matchCount = Math.min(Math.max(Number(body?.matchCount) || 5, 1), 10);
    if (!query) {
      return new Response(JSON.stringify({ error: "query required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const embedRes = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/text-embedding-3-small",
        input: query,
        dimensions: 1536,
      }),
    });

    if (!embedRes.ok) {
      const t = await embedRes.text();
      console.error("Embed error", embedRes.status, t);
      return new Response(JSON.stringify({ error: "Embedding failed" }), {
        status: embedRes.status === 429 ? 429 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data } = await embedRes.json();
    const queryEmbedding = data[0].embedding as number[];

    // Use service role to call RPC (sandboxed user may lack EXECUTE on function in some envs)
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: matches, error: rpcErr } = await adminClient.rpc("match_law_of_success", {
      query_embedding: queryEmbedding,
      match_count: matchCount,
    });

    if (rpcErr) {
      console.error("RPC error", rpcErr);
      return new Response(JSON.stringify({ error: "Search failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ matches: matches ?? [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("law-of-success-search error", e);
    return new Response(JSON.stringify({ error: "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
