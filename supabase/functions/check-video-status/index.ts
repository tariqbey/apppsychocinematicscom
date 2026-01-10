import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { safeErrorResponse } from "../_shared/error-handler.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ATLASCLOUD_API_KEY = Deno.env.get("ATLASCLOUD_API_KEY");
    if (!ATLASCLOUD_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: "Video service unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Authentication required" }), {
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
      return new Response(JSON.stringify({ success: false, error: "Authentication failed" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const { predictionId } = await req.json();

    if (!predictionId) {
      return new Response(JSON.stringify({ success: false, error: "Prediction ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check current status in database first
    const { data: existingRecord } = await supabase
      .from("generated_media")
      .select("*")
      .eq("prediction_id", predictionId)
      .eq("user_id", userId)
      .single();

    if (!existingRecord) {
      return new Response(JSON.stringify({ success: false, error: "Record not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If already completed or failed, return cached result
    if (existingRecord.status === "completed") {
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: "completed", 
          videoUrl: existingRecord.media_url 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (existingRecord.status === "failed") {
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: "failed", 
          error: existingRecord.error_message || "Generation failed" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Poll Atlas Cloud for current status
    const pollUrl = `https://api.atlascloud.ai/api/v1/model/prediction/${predictionId}`;
    const pollResponse = await fetch(pollUrl, {
      headers: { Authorization: `Bearer ${ATLASCLOUD_API_KEY}` },
    });

    if (!pollResponse.ok) {
      console.error("Poll error:", await pollResponse.text());
      return new Response(
        JSON.stringify({ success: true, status: "processing" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pollResult = await pollResponse.json();
    const rawStatus = String(pollResult.data?.status ?? "").toLowerCase();

    console.log(`Status check for ${predictionId}: ${rawStatus}`);

    const isCompleted = ["completed", "succeeded", "success", "done"].includes(rawStatus);
    const isFailed = ["failed", "canceled", "cancelled", "error"].includes(rawStatus);

    const outputs = pollResult.data?.outputs ?? pollResult.outputs ?? pollResult.data?.output;
    const videoUrl = Array.isArray(outputs) ? outputs[0] : outputs;

    if (isCompleted) {
      // Update database
      await supabase
        .from("generated_media")
        .update({ status: "completed", media_url: videoUrl ?? null })
        .eq("prediction_id", predictionId);

      return new Response(
        JSON.stringify({ success: true, status: "completed", videoUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (isFailed) {
      const errorMessage = pollResult.data?.error || "Generation failed";

      await supabase
        .from("generated_media")
        .update({ status: "failed", error_message: errorMessage })
        .eq("prediction_id", predictionId);

      return new Response(
        JSON.stringify({ success: false, status: "failed", error: errorMessage }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Still processing
    return new Response(
      JSON.stringify({ success: true, status: "processing" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return safeErrorResponse(error, corsHeaders, "CHECK-VIDEO-STATUS");
  }
});
