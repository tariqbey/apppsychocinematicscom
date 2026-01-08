import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function dataUrlToInlineData(dataUrl: string) {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) return null;
  return {
    inlineData: {
      mimeType: matches[1],
      data: matches[2],
    },
  };
}

const MODEL_CONFIGS: Record<string, { endpoint: string; defaultParams: any }> = {
  "openai/sora-2/text-to-video-developer": {
    endpoint: "https://api.atlascloud.ai/api/v1/model/generateVideo",
    defaultParams: { duration: 4, resolution: "1080p", aspect_ratio: "16:9" },
  },
  "openai/sora-2/image-to-video": {
    endpoint: "https://api.atlascloud.ai/api/v1/model/generateVideo",
    defaultParams: { duration: 5, resolution: "1080p" },
  },
  "wan-ai/wan2.1-t2v-480p": {
    endpoint: "https://api.atlascloud.ai/api/v1/model/generateVideo",
    defaultParams: { duration: 5, resolution: "480p", aspect_ratio: "16:9" },
  },
  "wan-ai/wan2.1-i2v-480p": {
    endpoint: "https://api.atlascloud.ai/api/v1/model/generateVideo",
    defaultParams: { duration: 5, resolution: "480p" },
  },
  "kling-ai/v1-5/pro/text-to-video": {
    endpoint: "https://api.atlascloud.ai/api/v1/model/generateVideo",
    defaultParams: { duration: 5, resolution: "1080p", aspect_ratio: "16:9" },
  },
  "kling-ai/v1-5/pro/image-to-video": {
    endpoint: "https://api.atlascloud.ai/api/v1/model/generateVideo",
    defaultParams: { duration: 5, resolution: "1080p" },
  },
};

// Map frontend model names to Atlas Cloud API model names
const MODEL_NAME_MAP: Record<string, string> = {
  "openai/sora-2/text-to-video-developer": "openai/sora-2/text-to-video-developer",
  "kling-ai/v1-5/pro/image-to-video": "kwaivgi/kling-v2.5-turbo-pro/image-to-video",
  "kling-ai/v1-5/pro/text-to-video": "kwaivgi/kling-v2.5-turbo-pro/text-to-video",
  "wan-ai/wan2.1-i2v-480p": "wanx-ai/wanx2.1-i2v-plus",
  "wan-ai/wan2.1-t2v-480p": "wanx-ai/wanx2.1-t2v-plus",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ATLASCLOUD_API_KEY = Deno.env.get("ATLASCLOUD_API_KEY");
    if (!ATLASCLOUD_API_KEY) {
      throw new Error("ATLASCLOUD_API_KEY is not configured");
    }

    const {
      model = "openai/sora-2/text-to-video-developer",
      prompt,
      duration,
      resolution,
      aspect_ratio,
      image,
      cameo_id,
      user_id,
    } = await req.json();

    if (!prompt) {
      throw new Error("Prompt is required");
    }

    const modelConfig = MODEL_CONFIGS[model];
    if (!modelConfig) {
      throw new Error(`Unsupported model: ${model}. Available: ${Object.keys(MODEL_CONFIGS).join(", ")}`);
    }

    // Map to Atlas Cloud API model name if different
    const apiModelName = MODEL_NAME_MAP[model] || model;
    
    console.log(`Starting video generation with model ${model} (API: ${apiModelName}):`, prompt);

    // Build request body
    const generateBody: any = {
      model: apiModelName,
      prompt,
      enable_base64_output: false,
      enable_sync_mode: false,
      duration: duration ?? modelConfig.defaultParams.duration,
      resolution: resolution ?? modelConfig.defaultParams.resolution,
    };

    if (aspect_ratio) {
      generateBody.aspect_ratio = aspect_ratio;
    } else if (modelConfig.defaultParams.aspect_ratio) {
      generateBody.aspect_ratio = modelConfig.defaultParams.aspect_ratio;
    }

    // For Sora 2 developer model, handle Cameo ID by including it in the prompt
    if (model === "openai/sora-2/text-to-video-developer" && cameo_id) {
      // Ensure the cameo_id starts with @ for proper reference
      const formattedCameoId = cameo_id.startsWith("@") ? cameo_id : `@${cameo_id}`;
      // Prepend the cameo reference to the prompt
      generateBody.prompt = `${formattedCameoId} ${generateBody.prompt}`;
      console.log(`Including Sora Cameo: ${formattedCameoId}`);
    }

    // Sora 2 developer uses 'size' instead of 'resolution' and different duration values
    if (model === "openai/sora-2/text-to-video-developer") {
      // Map duration to Sora 2 supported values (4, 8, 12 seconds)
      const soraDuration = duration <= 4 ? 4 : duration <= 8 ? 8 : 12;
      generateBody.duration = soraDuration;
      
      // Map resolution to size format
      if (aspect_ratio === "16:9" || generateBody.aspect_ratio === "16:9") {
        generateBody.size = resolution === "720p" ? "720*1280" : "1280*720";
      } else if (aspect_ratio === "9:16" || generateBody.aspect_ratio === "9:16") {
        generateBody.size = resolution === "720p" ? "1280*720" : "720*1280";
      }
      delete generateBody.resolution;
    }

    // Handle image input for image-to-video models
    const isImageToVideo = model === "openai/sora-2/image-to-video" || 
                           model === "wan-ai/wan2.1-i2v-480p" || 
                           model === "kling-ai/v1-5/pro/image-to-video";
    
    if (image && isImageToVideo) {
      if (typeof image === "string" && image.startsWith("data:")) {
        const inline = dataUrlToInlineData(image);
        generateBody.image = inline ?? image;
      } else {
        generateBody.image = image;
      }
    }
    const generateResponse = await fetch(modelConfig.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ATLASCLOUD_API_KEY}`,
      },
      body: JSON.stringify(generateBody),
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error("Atlas Cloud generate error:", errorText);
      throw new Error(`Failed to start generation: ${errorText}`);
    }

    const generateResult = await generateResponse.json();
    const predictionId = generateResult.data?.id;

    if (!predictionId) {
      throw new Error("No prediction ID returned from Atlas Cloud");
    }

    console.log("Generation started with prediction ID:", predictionId);

    // Update database with prediction ID if user_id provided
    if (user_id) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      await supabase.from("generated_media").insert({
        user_id,
        media_type: "video",
        model_used: model,
        prompt,
        status: "processing",
        prediction_id: predictionId,
        metadata: { duration: generateBody.duration, resolution: generateBody.resolution, aspect_ratio: generateBody.aspect_ratio },
      });
    }

    // Step 2: Poll for result (video takes longer)
    const pollUrl = `https://api.atlascloud.ai/api/v1/model/prediction/${predictionId}`;
    let attempts = 0;
    const maxAttempts = 180; // 6 minutes max for video

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const pollResponse = await fetch(pollUrl, {
        headers: { Authorization: `Bearer ${ATLASCLOUD_API_KEY}` },
      });

      if (!pollResponse.ok) {
        const errorText = await pollResponse.text();
        console.error("Poll error:", errorText);
        attempts++;
        continue;
      }

      const pollResult = await pollResponse.json();
      const status = pollResult.data?.status;

      console.log(`Poll attempt ${attempts + 1}: status = ${status}`);

      if (status === "completed") {
        const videoUrl = pollResult.data?.outputs?.[0];
        console.log("Video generated successfully:", videoUrl);

        // Update database with result
        if (user_id) {
          const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
          );

          await supabase
            .from("generated_media")
            .update({ status: "completed", media_url: videoUrl })
            .eq("prediction_id", predictionId);
        }

        return new Response(
          JSON.stringify({ success: true, videoUrl, predictionId }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else if (status === "failed") {
        const errorMessage = pollResult.data?.error || "Generation failed";

        if (user_id) {
          const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
          );

          await supabase
            .from("generated_media")
            .update({ status: "failed", error_message: errorMessage })
            .eq("prediction_id", predictionId);
        }

        throw new Error(errorMessage);
      }

      attempts++;
    }

    throw new Error("Generation timed out");
  } catch (error) {
    console.error("atlas-generate-video error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
