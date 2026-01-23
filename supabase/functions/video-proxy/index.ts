import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Video Proxy for iOS Safari Compatibility
 * 
 * iOS Safari requires proper HTTP Range (206 Partial Content) responses
 * for reliable video streaming. This proxy fetches from Supabase storage
 * and re-serves with correct range headers.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, range",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
};

// iOS Safari often requests `Range: bytes=0-` and expects the server to return a
// reasonably sized 206 chunk (not the entire remaining file). Returning huge
// bodies can cause stalls or abrupt stops on mobile.
const MAX_CHUNK_BYTES = 2 * 1024 * 1024; // 2MB per request

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const videoUrl = url.searchParams.get("url");

    if (!videoUrl) {
      return new Response(
        JSON.stringify({ error: "Missing 'url' parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL is from our storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!videoUrl.startsWith(supabaseUrl || "") && !videoUrl.includes("supabase.co/storage")) {
      return new Response(
        JSON.stringify({ error: "Only Supabase storage URLs are allowed" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rangeHeader = req.headers.get("Range");

    // First, get the content length with a HEAD request
    const headResponse = await fetch(videoUrl, { method: "HEAD" });
    if (!headResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch video metadata" }),
        { status: headResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contentLength = parseInt(headResponse.headers.get("Content-Length") || "0", 10);
    const contentType = headResponse.headers.get("Content-Type") || "video/mp4";

    // Handle HEAD request
    if (req.method === "HEAD") {
      return new Response(null, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": contentType,
          "Content-Length": contentLength.toString(),
          "Accept-Ranges": "bytes",
        },
      });
    }

    // Handle Range request for iOS Safari
    if (rangeHeader) {
      const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (!rangeMatch) {
        return new Response(
          JSON.stringify({ error: "Invalid Range header" }),
          { status: 416, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const start = parseInt(rangeMatch[1], 10);
      let end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : contentLength - 1;

      // Cap chunk size to keep mobile Safari stable
      if (!Number.isFinite(end) || end <= 0) {
        end = contentLength - 1;
      }
      end = Math.min(end, start + MAX_CHUNK_BYTES - 1, contentLength - 1);

      if (start >= contentLength || end >= contentLength) {
        return new Response(null, {
          status: 416,
          headers: {
            ...corsHeaders,
            "Content-Range": `bytes */${contentLength}`,
          },
        });
      }

      // Fetch the requested range
      const rangeResponse = await fetch(videoUrl, {
        headers: { Range: `bytes=${start}-${end}` },
      });

      const body = rangeResponse.body;
      const actualLength = end - start + 1;

      return new Response(body, {
        status: 206,
        headers: {
          ...corsHeaders,
          "Content-Type": contentType,
          "Content-Length": actualLength.toString(),
          "Content-Range": `bytes ${start}-${end}/${contentLength}`,
          "Accept-Ranges": "bytes",
          "Vary": "Range",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // Full file request (no Range header)
    const fullResponse = await fetch(videoUrl);
    return new Response(fullResponse.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Length": contentLength.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Video proxy error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Proxy error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
