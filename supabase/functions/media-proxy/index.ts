import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { safeErrorResponse } from "../_shared/error-handler.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getAllowedHosts(): Set<string> {
  const allowed = new Set<string>([
    // External providers used by generated video outputs
    "atlas-media.oss-accelerate-overseas.aliyuncs.com",
    "d2p7pge43lyniu.cloudfront.net",
  ]);

  const backendUrl = Deno.env.get("SUPABASE_URL");
  if (backendUrl) {
    try {
      allowed.add(new URL(backendUrl).host);
    } catch {
      // ignore
    }
  }

  return allowed;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const rateLimit = checkRateLimit(`media_proxy_${userId}`, { maxRequests: 30, windowMs: 60000 });
    if (!rateLimit.allowed) {
      return rateLimitResponse(corsHeaders, rateLimit.resetIn);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = (body as { url?: unknown })?.url;
    if (typeof url !== "string" || url.trim().length < 10) {
      return new Response(JSON.stringify({ error: "Invalid url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: "Malformed url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return new Response(JSON.stringify({ error: "Invalid url protocol" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowedHosts = getAllowedHosts();
    if (!allowedHosts.has(parsed.host)) {
      return new Response(JSON.stringify({ error: "Host not allowed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("MEDIA-PROXY: fetching", { host: parsed.host, path: parsed.pathname, user: userId.slice(0, 8) });

    const upstream = await fetch(parsed.toString(), {
      headers: {
        "user-agent": "LovableMediaProxy/1.0",
        accept: "*/*",
      },
    });

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => "");
      throw new Error(`Upstream fetch failed: ${upstream.status} ${errText}`);
    }

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) {
      const size = Number(contentLength);
      // Prevent extremely large downloads (basic abuse protection)
      if (Number.isFinite(size) && size > 250 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: "File too large" }), {
          status: 413,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        // Force `supabase.functions.invoke` to parse as Blob
        "Content-Type": "application/octet-stream",
        ...(contentLength ? { "Content-Length": contentLength } : {}),
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    return safeErrorResponse(error, corsHeaders, "MEDIA-PROXY");
  }
});
