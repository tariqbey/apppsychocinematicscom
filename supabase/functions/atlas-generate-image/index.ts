import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

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
      throw new Error("ATLASCLOUD_API_KEY is not configured");
    }

    const { prompt, aspect_ratio = "1:1", resolution = "2k", images, user_id } = await req.json();

    if (!prompt) {
      throw new Error("Prompt is required");
    }

    console.log("Starting image generation with prompt:", prompt);

    // Step 1: Start image generation
    const generateUrl = "https://api.atlascloud.ai/api/v1/model/generateImage";
    const generateBody: any = {
      model: "google/nano-banana-pro/edit",
      aspect_ratio,
      enable_base64_output: false,
      enable_sync_mode: false,
      output_format: "png",
      prompt,
      resolution,
    };

    // Process images - extract mimeType from data URLs
    if (images && images.length > 0) {
      generateBody.images = images.map((img: string) => {
        // Check if it's a data URL (base64)
        if (img.startsWith("data:")) {
          // Format: data:image/png;base64,ABC123...
          const matches = img.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            const mimeType = matches[1];
            const base64Data = matches[2];
            // Atlas forwards to Google using Gemini "inlineData" parts
            return {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            };
          }
        }

        // If it's a regular URL (or unrecognized format), pass through
        return img;
      });
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
        media_type: "image",
        model_used: "google/nano-banana-pro/edit",
        prompt,
        status: "processing",
        prediction_id: predictionId,
        metadata: { aspect_ratio, resolution },
      });
    }

    // Step 2: Poll for result
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

        // Update database with result
        if (user_id) {
          const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
          );

          await supabase
            .from("generated_media")
            .update({ status: "completed", media_url: imageUrl })
            .eq("prediction_id", predictionId);
        }

        return new Response(
          JSON.stringify({ success: true, imageUrl, predictionId }),
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
    console.error("atlas-generate-image error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
