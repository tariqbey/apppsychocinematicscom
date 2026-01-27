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
//
// NOTE: Larger chunks reduce round-trip overhead, but overly large chunks can
// increase stall duration on slower mobile networks. 4MB is a safer balance
// for iOS Safari across a wider range of connections.
const MAX_CHUNK_BYTES = 4 * 1024 * 1024; // 4MB per request

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

    const getHead = async () => {
      const headResponse = await fetch(videoUrl, { method: "HEAD" });
      if (!headResponse.ok) {
        return {
          ok: false as const,
          status: headResponse.status,
          contentLength: 0,
          contentType: "video/mp4",
        };
      }
      return {
        ok: true as const,
        status: headResponse.status,
        contentLength: parseInt(headResponse.headers.get("Content-Length") || "0", 10),
        contentType: headResponse.headers.get("Content-Type") || "video/mp4",
      };
    };

    // Handle HEAD request
    if (req.method === "HEAD") {
      const head = await getHead();
      if (!head.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch video metadata" }),
          { status: head.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(null, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": head.contentType,
          "Content-Length": head.contentLength.toString(),
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
      const requestedEnd = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : NaN;

      // Cap chunk size (without needing a HEAD request). We'll trust the upstream
      // Content-Range response to tell us the actual end/total.
      let end = start + MAX_CHUNK_BYTES - 1;
      if (Number.isFinite(requestedEnd) && requestedEnd >= start) {
        end = Math.min(end, requestedEnd);
      }

      // Fetch the requested range
      const rangeResponse = await fetch(videoUrl, {
        headers: { Range: `bytes=${start}-${end}` },
      });

      // Upstream may return 416 if start is beyond file end.
      if (rangeResponse.status === 416) {
        const head = await getHead();
        const total = head.ok ? head.contentLength : 0;
        return new Response(null, {
          status: 416,
          headers: {
            ...corsHeaders,
            "Content-Range": total ? `bytes */${total}` : "bytes */*",
          },
        });
      }

      if (rangeResponse.status !== 206) {
        // If upstream ignores Range for some reason, fall back to a straight proxy response.
        return new Response(rangeResponse.body, {
          status: rangeResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": rangeResponse.headers.get("Content-Type") || "video/mp4",
            "Accept-Ranges": "bytes",
            "Cache-Control": "no-store",
          },
        });
      }

      const contentType = rangeResponse.headers.get("Content-Type") || "video/mp4";
      const contentRange = rangeResponse.headers.get("Content-Range") || `bytes ${start}-${end}/*`;
      const contentLengthHeader = rangeResponse.headers.get("Content-Length");

      return new Response(rangeResponse.body, {
        status: 206,
        headers: {
          ...corsHeaders,
          "Content-Type": contentType,
          ...(contentLengthHeader ? { "Content-Length": contentLengthHeader } : {}),
          "Content-Range": contentRange,
          "Accept-Ranges": "bytes",
          "Vary": "Range",
          // Avoid caching partial byte ranges on mobile Safari; caching can cause
          // mismatched chunks and audio/video weirdness.
          "Cache-Control": "no-store",
        },
      });
    }

    // Full file request (no Range header)
    const fullResponse = await fetch(videoUrl);
    return new Response(fullResponse.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": fullResponse.headers.get("Content-Type") || "video/mp4",
        ...(fullResponse.headers.get("Content-Length")
          ? { "Content-Length": fullResponse.headers.get("Content-Length") as string }
          : {}),
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
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
