import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { safeErrorResponse } from "../_shared/error-handler.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Kie.ai API models
const KIE_MODELS = {
  // Text-to-video (standard Sora 2)
  "sora-2-t2v": {
    model: "sora-2",
    endpoint: "https://api.kie.ai/api/v1/jobs/createTask",
  },
  // Text-to-video with character (Cameo)
  "sora-2-characters": {
    model: "sora-2-characters",
    endpoint: "https://api.kie.ai/api/v1/jobs/createTask",
  },
  // Pro versions
  "sora-2-pro-t2v": {
    model: "sora-2-pro",
    endpoint: "https://api.kie.ai/api/v1/jobs/createTask",
  },
  // Image-to-video
  "sora-2-i2v": {
    model: "sora-2-image-to-video",
    endpoint: "https://api.kie.ai/api/v1/jobs/createTask",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const KIE_API_KEY = Deno.env.get("KIA_API_KEY");
    if (!KIE_API_KEY) {
      console.error("KIA_API_KEY not configured");
      return new Response(JSON.stringify({ success: false, error: "Video service unavailable", code: "E1002" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Authentication required", code: "E1001" }), {
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
      return new Response(JSON.stringify({ success: false, error: "Authentication failed", code: "E1001" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    // Rate limiting: 5 video generations per minute
    const rateLimit = checkRateLimit(userId, { maxRequests: 5, windowMs: 60000 });
    if (!rateLimit.allowed) {
      console.log("Rate limit exceeded for video generation", { userId: userId.substring(0, 8) });
      return rateLimitResponse(corsHeaders, rateLimit.resetIn);
    }

    const {
      prompt,
      duration = 5,
      resolution = "720p",
      aspect_ratio = "16:9",
      image,
      cameo_video_url, // URL of the 1-4 second character video
      cameo_prompt,    // Character description for Cameo
    } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ success: false, error: "Prompt is required", code: "E1004" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine which Kie.ai model to use
    let modelKey: keyof typeof KIE_MODELS;
    if (cameo_video_url) {
      modelKey = "sora-2-characters";
    } else if (image) {
      modelKey = "sora-2-i2v";
    } else {
      modelKey = "sora-2-t2v";
    }

    const modelConfig = KIE_MODELS[modelKey];
    console.log(`Using Kie.ai model: ${modelConfig.model} for user ${userId.substring(0, 8)}`);

    // Build the request body based on model type
    let requestBody: Record<string, unknown>;

    if (modelKey === "sora-2-characters") {
      // Sora 2 Characters API for Cameo
      requestBody = {
        model: modelConfig.model,
        input: {
          character_file_url: [cameo_video_url],
          character_prompt: cameo_prompt || prompt,
          prompt: prompt,
          duration: String(duration),
          aspect_ratio: aspect_ratio.replace(":", "*"), // Convert 16:9 to 16*9
        },
      };
      console.log(`Cameo video generation with character URL: ${cameo_video_url}`);
    } else if (modelKey === "sora-2-i2v") {
      // Image-to-video
      requestBody = {
        model: modelConfig.model,
        input: {
          prompt: prompt,
          image_url: image,
          duration: String(duration),
          aspect_ratio: aspect_ratio.replace(":", "*"),
        },
      };
    } else {
      // Standard text-to-video
      // Map resolution to Kie.ai size format
      const sizeMap: Record<string, Record<string, string>> = {
        "16:9": { "720p": "1280*720", "1080p": "1920*1080" },
        "9:16": { "720p": "720*1280", "1080p": "1080*1920" },
        "1:1": { "720p": "720*720", "1080p": "1080*1080" },
      };
      const size = sizeMap[aspect_ratio]?.[resolution] || "1280*720";

      requestBody = {
        model: modelConfig.model,
        input: {
          prompt: prompt,
          duration: String(duration),
          size: size,
        },
      };
    }

    console.log(`Starting Kie.ai video generation:`, JSON.stringify(requestBody).substring(0, 200));

    const generateResponse = await fetch(modelConfig.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KIE_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error("Kie.ai generate error:", errorText.substring(0, 300));
      return new Response(JSON.stringify({ success: false, error: "Video generation service unavailable", code: "E1007" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const generateResult = await generateResponse.json();
    console.log("Kie.ai response:", JSON.stringify(generateResult).substring(0, 200));

    // Kie.ai returns taskId in data.taskId
    const taskId = generateResult.data?.taskId;

    if (!taskId) {
      console.error("No taskId in Kie.ai response:", generateResult);
      return new Response(JSON.stringify({ success: false, error: "Failed to start video generation", code: "E1007" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Kie.ai generation started with task ID:", taskId);

    // Insert record with processing status
    await supabase.from("generated_media").insert({
      user_id: userId,
      media_type: "video",
      model_used: `kie/${modelConfig.model}`,
      prompt,
      status: "processing",
      prediction_id: taskId,
      metadata: {
        provider: "kie.ai",
        duration,
        resolution,
        aspect_ratio,
        has_cameo: !!cameo_video_url,
      },
    });

    // Return immediately - client will poll for status
    return new Response(
      JSON.stringify({
        success: true,
        status: "processing",
        predictionId: taskId,
        provider: "kie",
        message: "Video generation started. Poll for status updates.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return safeErrorResponse(error, corsHeaders, "KIE-GENERATE-VIDEO");
  }
});
