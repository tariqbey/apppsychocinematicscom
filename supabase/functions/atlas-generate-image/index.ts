import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

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
  userId?: string;
}): Promise<{ publicUrl: string; mimeType: string }> {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) throw new Error("Invalid data URL");

  await ensurePublicBucket(supabaseAdmin);

  const ext = mimeToExt(parsed.mimeType);
  const objectPath = `${userId ?? "anon"}/${crypto.randomUUID()}.${ext}`;
  const bytes = base64ToUint8Array(parsed.base64Data);

  const { error: uploadError } = await supabaseAdmin.storage
    .from(INPUT_BUCKET)
    .upload(objectPath, bytes, { contentType: parsed.mimeType, upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabaseAdmin.storage.from(INPUT_BUCKET).getPublicUrl(objectPath);
  if (!data?.publicUrl) throw new Error("Failed to get public URL for uploaded image");

  return { publicUrl: data.publicUrl, mimeType: parsed.mimeType };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ATLASCLOUD_API_KEY = Deno.env.get("ATLASCLOUD_API_KEY");
    if (!ATLASCLOUD_API_KEY) throw new Error("ATLASCLOUD_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");

    const { prompt, aspect_ratio = "1:1", resolution = "2k", images, user_id } = await req.json();

    if (!prompt) throw new Error("Prompt is required");

    const isEdit = Array.isArray(images) && images.length > 0;
    const model = isEdit ? "google/nano-banana-pro/edit" : "google/nano-banana-pro/text-to-image";

    console.log("Starting Nano Banana Pro image generation:", { 
      prompt: prompt.substring(0, 100),
      isEdit,
      imageCount: images?.length || 0,
      model 
    });

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Build Atlas request
    const generateUrl = "https://api.atlascloud.ai/api/v1/model/generateImage";
    
    // Enhanced prompt for reference photo likeness retention
    let enhancedPrompt = prompt;
    if (isEdit) {
      enhancedPrompt = `CRITICAL INSTRUCTION: The generated image MUST feature the EXACT same person from the reference image(s). Preserve their facial structure, skin tone, hair, and all distinguishing features with photorealistic accuracy.

${prompt}

TECHNICAL REQUIREMENTS:
- Maintain 100% facial likeness to reference photo(s)
- Professional cinematic lighting (ARRI Alexa style)
- Ultra high resolution photorealistic quality
- Natural skin tones and textures`;
    }
    
    const generateBody: any = {
      model,
      enable_base64_output: false,
      enable_sync_mode: false,
      output_format: "png",
      prompt: enhancedPrompt,
      aspect_ratio,
      resolution,
    };

    if (isEdit) {
      // Atlas docs for many edit models use `image` (singular). We pass a hosted URL.
      const first = images[0];
      if (typeof first !== "string") throw new Error("Invalid image input");

      if (first.startsWith("data:")) {
        console.log("Edit mode: received data URL, uploading to storage first...");
        const { publicUrl } = await dataUrlToPublicUrl({ supabaseAdmin, dataUrl: first, userId: user_id });
        generateBody.image = publicUrl;
        console.log("Uploaded reference image for Nano Banana:", publicUrl);
      } else {
        console.log("Edit mode: using provided image URL:", first.substring(0, 50));
        generateBody.image = first;
      }
    }

    const generateResponse = await fetch(generateUrl, {
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
    if (!predictionId) throw new Error("No prediction ID returned from Atlas Cloud");

    console.log("Generation started with prediction ID:", predictionId);

    if (user_id) {
      await supabaseAdmin.from("generated_media").insert({
        user_id,
        media_type: "image",
        model_used: model,
        prompt,
        status: "processing",
        prediction_id: predictionId,
        metadata: { aspect_ratio, resolution, mode: isEdit ? "edit" : "create" },
      });
    }

    // Poll for result
    const pollUrl = `https://api.atlascloud.ai/api/v1/model/prediction/${predictionId}`;
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes max

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
        const imageUrl = pollResult.data?.outputs?.[0];
        console.log("Image generated successfully:", imageUrl);

        if (user_id) {
          await supabaseAdmin
            .from("generated_media")
            .update({ status: "completed", media_url: imageUrl })
            .eq("prediction_id", predictionId);
        }

        return new Response(JSON.stringify({ success: true, imageUrl, predictionId }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (status === "failed") {
        const errorMessage = pollResult.data?.error || "Generation failed";

        if (user_id) {
          await supabaseAdmin
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
    console.error("atlas-generate-image error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
