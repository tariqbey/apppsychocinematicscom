import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { safeErrorResponse } from "../_shared/error-handler.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REMOVE-SORA-WATERMARK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    const KIE_API_KEY = Deno.env.get("KIA_API_KEY");
    if (!KIE_API_KEY) {
      logStep("KIA_API_KEY not configured");
      return new Response(JSON.stringify({ success: false, error: "Watermark removal service unavailable", code: "E1002" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Authentication required", code: "E1001" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Use getClaims for ES256-signed JWTs (Lovable Cloud)
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);

    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ success: false, error: "Authentication failed", code: "E1001" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    logStep("User authenticated", { userId: userId.substring(0, 8) });

    // Rate limiting: 5 watermark removals per minute
    const rateLimit = checkRateLimit(userId, { maxRequests: 5, windowMs: 60000 });
    if (!rateLimit.allowed) {
      logStep("Rate limit exceeded", { userId: userId.substring(0, 8) });
      return rateLimitResponse(corsHeaders, rateLimit.resetIn);
    }

    const { videoUrl, originalMediaId } = await req.json();

    if (!videoUrl) {
      return new Response(JSON.stringify({ success: false, error: "Video URL is required", code: "E1004" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Starting watermark removal", { 
      videoUrl: videoUrl.substring(0, 50) + "...",
      originalMediaId 
    });

    // Call Kie.ai Sora Watermark Remover API
    const requestBody = {
      model: "sora-watermark-remover",
      input: {
        video_url: videoUrl,
      },
    };

    const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KIE_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep("Kie.ai watermark removal error", { error: errorText.substring(0, 300) });
      return new Response(JSON.stringify({ success: false, error: "Watermark removal service unavailable", code: "E1007" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    logStep("Kie.ai response", { data: JSON.stringify(result).substring(0, 200) });

    const taskId = result.data?.taskId;

    if (!taskId) {
      logStep("No taskId in response", { result });
      return new Response(JSON.stringify({ success: false, error: "Failed to start watermark removal", code: "E1007" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Watermark removal started", { taskId });

    // Insert record with processing status
    const { data: insertData, error: insertError } = await supabase.from("generated_media").insert({
      user_id: userId,
      media_type: "video",
      model_used: "kie/sora-watermark-remover",
      prompt: `Watermark removal from video`,
      status: "processing",
      prediction_id: taskId,
      metadata: {
        provider: "kie.ai",
        operation: "watermark_removal",
        original_media_id: originalMediaId || null,
        original_video_url: videoUrl,
      },
    }).select().single();

    if (insertError) {
      logStep("Insert error", { error: insertError.message });
    }

    // Return immediately - client will poll for status
    return new Response(
      JSON.stringify({
        success: true,
        status: "processing",
        predictionId: taskId,
        mediaId: insertData?.id,
        provider: "kie",
        message: "Watermark removal started. Poll for status updates.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return safeErrorResponse(error, corsHeaders, "REMOVE-SORA-WATERMARK");
  }
});
