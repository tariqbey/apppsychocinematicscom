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
    const KIE_API_KEY = Deno.env.get("KIA_API_KEY");
    if (!KIE_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: "Video service unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user?.id) {
      return new Response(JSON.stringify({ success: false, error: "Authentication failed" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { taskId } = await req.json();

    if (!taskId) {
      return new Response(JSON.stringify({ success: false, error: "Task ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check current status in database first
    const { data: existingRecord } = await supabase
      .from("generated_media")
      .select("*")
      .eq("prediction_id", taskId)
      .eq("user_id", userData.user.id)
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
          videoUrl: existingRecord.media_url,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (existingRecord.status === "failed") {
      return new Response(
        JSON.stringify({
          success: false,
          status: "failed",
          error: existingRecord.error_message || "Generation failed",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Poll Kie.ai for current status
    // Kie.ai uses GET /api/v1/jobs/getTaskDetail?taskId=xxx
    const pollUrl = `https://api.kie.ai/api/v1/jobs/getTaskDetail?taskId=${encodeURIComponent(taskId)}`;
    const pollResponse = await fetch(pollUrl, {
      headers: { Authorization: `Bearer ${KIE_API_KEY}` },
    });

    if (!pollResponse.ok) {
      console.error("Kie.ai poll error:", await pollResponse.text());
      return new Response(
        JSON.stringify({ success: true, status: "processing" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pollResult = await pollResponse.json();
    console.log(`Kie.ai status for ${taskId}:`, JSON.stringify(pollResult).substring(0, 300));

    // Kie.ai status values: pending, processing, completed, failed
    const rawStatus = String(pollResult.data?.status ?? "").toLowerCase();

    const isCompleted = ["completed", "succeeded", "success", "done"].includes(rawStatus);
    const isFailed = ["failed", "canceled", "cancelled", "error"].includes(rawStatus);

    // Kie.ai returns output URL in data.output or data.outputs
    const output = pollResult.data?.output || pollResult.data?.outputs;
    const videoUrl = Array.isArray(output) ? output[0] : output;

    if (isCompleted && videoUrl) {
      // Update database
      await supabase
        .from("generated_media")
        .update({ status: "completed", media_url: videoUrl })
        .eq("prediction_id", taskId);

      return new Response(
        JSON.stringify({ success: true, status: "completed", videoUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (isFailed) {
      const errorMessage = pollResult.data?.error || pollResult.data?.message || "Generation failed";

      await supabase
        .from("generated_media")
        .update({ status: "failed", error_message: errorMessage })
        .eq("prediction_id", taskId);

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
    return safeErrorResponse(error, corsHeaders, "CHECK-KIE-VIDEO-STATUS");
  }
});
