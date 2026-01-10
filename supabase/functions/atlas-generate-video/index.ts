import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { safeErrorResponse } from "../_shared/error-handler.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INPUT_BUCKET = "atlas-inputs";

type ParsedDataUrl = { mimeType: string; base64Data: string };

function parseDataUrl(dataUrl: string): ParsedDataUrl | null {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) return null;
  return { mimeType: matches[1], base64Data: matches[2] };
}

function mimeToExt(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "bin";
}

function base64ToUint8Array(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function ensurePublicBucket(supabaseAdmin: any) {
  const { data, error } = await supabaseAdmin.storage.getBucket(INPUT_BUCKET);
  if (data && !error) return;

  const { error: createError } = await supabaseAdmin.storage.createBucket(INPUT_BUCKET, { public: true });
  // If it already exists, ignore
  if (createError && !String(createError.message ?? "").toLowerCase().includes("already exists")) {
    throw createError;
  }
}

async function dataUrlToPublicUrl({
  supabaseAdmin,
  dataUrl,
  userId,
}: {
  supabaseAdmin: any;
  dataUrl: string;
  userId: string;
}): Promise<{ publicUrl: string; mimeType: string }> {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) throw new Error("Invalid data URL");

  await ensurePublicBucket(supabaseAdmin);

  const ext = mimeToExt(parsed.mimeType);
  const objectPath = `${userId}/${crypto.randomUUID()}.${ext}`;
  const bytes = base64ToUint8Array(parsed.base64Data);

  const { error: uploadError } = await supabaseAdmin.storage
    .from(INPUT_BUCKET)
    .upload(objectPath, bytes, { contentType: parsed.mimeType, upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabaseAdmin.storage.from(INPUT_BUCKET).getPublicUrl(objectPath);
  if (!data?.publicUrl) throw new Error("Failed to get public URL for uploaded image");

  return { publicUrl: data.publicUrl, mimeType: parsed.mimeType };
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
  "openai/sora-2/image-to-video": "openai/sora-2/image-to-video",
  "kling-ai/v1-5/pro/image-to-video": "kwaivgi/kling-v2.5-turbo-pro/image-to-video",
  "kling-ai/v1-5/pro/text-to-video": "kwaivgi/kling-v2.5-turbo-pro/text-to-video",
  "wan-ai/wan2.1-i2v-480p": "alibaba/wan-2.1/i2v-720p",
  "wan-ai/wan2.1-t2v-480p": "alibaba/wan-2.1/t2v-720p",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ATLASCLOUD_API_KEY = Deno.env.get("ATLASCLOUD_API_KEY");
    if (!ATLASCLOUD_API_KEY) {
      console.error("ATLASCLOUD_API_KEY not configured");
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

    // Rate limiting: 5 video generations per minute (expensive operation)
    const rateLimit = checkRateLimit(userId, { maxRequests: 5, windowMs: 60000 });
    if (!rateLimit.allowed) {
      console.log("Rate limit exceeded for video generation", { userId: userId.substring(0, 8) });
      return rateLimitResponse(corsHeaders, rateLimit.resetIn);
    }

    const {
      model = "openai/sora-2/text-to-video-developer",
      prompt,
      duration,
      resolution,
      aspect_ratio,
      image,
      cameo_id,
    } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ success: false, error: "Prompt is required", code: "E1004" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const modelConfig = MODEL_CONFIGS[model];
    if (!modelConfig) {
      return new Response(JSON.stringify({ success: false, error: "Invalid video model selected", code: "E1004" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map to Atlas Cloud API model name if different
    const apiModelName = MODEL_NAME_MAP[model] || model;
    
    console.log(`Starting video generation with model ${model}:`, prompt.substring(0, 100));

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

    // Sora 2 uses 'size' instead of 'resolution' and supports only specific durations/sizes.
    if (model === "openai/sora-2/text-to-video-developer") {
      // Supported durations: 4 | 8 | 12
      const requestedDuration = duration ?? 4;
      const soraDuration = requestedDuration <= 4 ? 4 : requestedDuration <= 8 ? 8 : 12;
      generateBody.duration = soraDuration;

      // Supported sizes (per Atlas docs): "720*1280" | "1280*720" | "1024*1792" | "1792*1024"
      // Map UI "720p" => smaller size, "1080p" => larger size.
      const requestedAspect = (aspect_ratio ?? generateBody.aspect_ratio ?? "16:9") as "16:9" | "9:16" | "1:1";
      const requestedRes = (resolution ?? "720p") as "720p" | "1080p";

      // Sora doesn't expose a true 1:1 size through Atlas; fall back to 16:9.
      const normalizedAspect: "16:9" | "9:16" = requestedAspect === "9:16" ? "9:16" : "16:9";
      generateBody.aspect_ratio = normalizedAspect;

      if (normalizedAspect === "16:9") {
        generateBody.size = requestedRes === "1080p" ? "1792*1024" : "1280*720";
      } else {
        generateBody.size = requestedRes === "1080p" ? "1024*1792" : "720*1280";
      }

      delete generateBody.resolution;
    }

    // Handle image input for image-to-video models
    const isImageToVideo = model === "openai/sora-2/image-to-video" || 
                           model === "wan-ai/wan2.1-i2v-480p" || 
                           model === "kling-ai/v1-5/pro/image-to-video";
    
    if (image && isImageToVideo) {
      if (typeof image !== "string") {
        return new Response(JSON.stringify({ success: false, error: "Invalid image input", code: "E1004" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (image.startsWith("data:")) {
        console.log("Received data URL image, uploading to storage first...");
        const { publicUrl } = await dataUrlToPublicUrl({ supabaseAdmin: supabase, dataUrl: image, userId });
        generateBody.image = publicUrl;
      } else {
        generateBody.image = image;
      }
    }

    // Wan 2.1 models use `size` (not `resolution`/`aspect_ratio`) and require a URL image.
    const isWan21 = model === "wan-ai/wan2.1-t2v-480p" || model === "wan-ai/wan2.1-i2v-480p";
    if (isWan21) {
      if (model === "wan-ai/wan2.1-i2v-480p" && !generateBody.image) {
        return new Response(JSON.stringify({ success: false, error: "Image is required for this model", code: "E1004" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const requestedAspect = (aspect_ratio ?? "16:9") as "16:9" | "9:16" | "1:1";
      const normalizedAspect: "16:9" | "9:16" = requestedAspect === "9:16" ? "9:16" : "16:9";
      generateBody.size = normalizedAspect === "9:16" ? "720*1280" : "1280*720";

      // Clamp to Atlas docs range for Wan 2.1 (5..10 seconds)
      const requestedDuration = Number(generateBody.duration ?? 5);
      generateBody.duration = Math.max(5, Math.min(10, requestedDuration));

      delete generateBody.resolution;
      delete generateBody.aspect_ratio;
    }

    // Retry logic for transient failures
    let generateResponse: Response | null = null;
    let lastError = "";
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        generateResponse = await fetch(modelConfig.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ATLASCLOUD_API_KEY}`,
          },
          body: JSON.stringify(generateBody),
        });

        if (generateResponse.ok) {
          break; // Success, exit retry loop
        }

        const errorText = await generateResponse.text();
        lastError = errorText.substring(0, 300);
        console.error(`Atlas Cloud attempt ${attempt}/${maxRetries} failed:`, lastError);

        // Check if it's a retryable error (500-level or specific codes)
        const isRetryable = generateResponse.status >= 500 || 
                           lastError.includes("Internal Server Error") ||
                           lastError.includes('"code":0');
        
        if (!isRetryable || attempt === maxRetries) {
          break;
        }

        // Wait before retry (exponential backoff: 1s, 2s, 4s)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      } catch (fetchError) {
        lastError = String(fetchError);
        console.error(`Atlas Cloud fetch attempt ${attempt}/${maxRetries} error:`, lastError);
        if (attempt === maxRetries) break;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }
    }

    if (!generateResponse || !generateResponse.ok) {
      console.error("Atlas Cloud all retries failed:", lastError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Video provider temporarily unavailable. Please try again in a few moments.", 
        code: "E1007",
        details: lastError.includes("Internal Server Error") ? "Provider experiencing issues" : undefined
      }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const generateResult = await generateResponse.json();
    const predictionId = generateResult.data?.id;

    if (!predictionId) {
      return new Response(JSON.stringify({ success: false, error: "Failed to start video generation", code: "E1007" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Generation started with prediction ID:", predictionId);

    // Insert record immediately with processing status
    await supabase.from("generated_media").insert({
      user_id: userId,
      media_type: "video",
      model_used: model,
      prompt,
      status: "processing",
      prediction_id: predictionId,
      metadata: { duration: generateBody.duration, resolution: generateBody.resolution, size: generateBody.size, aspect_ratio: generateBody.aspect_ratio },
    });

    // Return immediately with prediction ID - client will poll for status
    return new Response(
      JSON.stringify({ 
        success: true, 
        status: "processing",
        predictionId,
        message: "Video generation started. Poll for status updates."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return safeErrorResponse(error, corsHeaders, "ATLAS-GENERATE-VIDEO");
  }
});