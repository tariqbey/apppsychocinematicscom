import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";
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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ success: false, error: "AI service unavailable", code: "E1002" }), {
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

    // Rate limiting: 20 image generations per minute
    const rateLimit = checkRateLimit(userId, { maxRequests: 20, windowMs: 60000 });
    if (!rateLimit.allowed) {
      console.log("Rate limit exceeded for image generation", { userId: userId.substring(0, 8) });
      return rateLimitResponse(corsHeaders, rateLimit.resetIn);
    }

    const { prompt, images, aspect_ratio } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ success: false, error: "Prompt is required", code: "E1004" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Image generation request:", { 
      prompt: prompt.substring(0, 100), 
      hasImages: !!images?.length,
      aspect_ratio,
      userId: userId.substring(0, 8) 
    });

    const hasReferencePhoto = images && images.length > 0;
    
    // Check if user has an approved style sheet to include as additional reference
    let styleSheetUrl: string | null = null;
    let characterDesc = "";
    
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: profile } = await supabaseAdmin
          .from("user_profiles")
          .select("character_style_sheet_url, style_sheet_approved, character_height, character_weight, character_build, character_features")
          .eq("user_id", userId)
          .maybeSingle();
        
        if (profile?.style_sheet_approved && profile?.character_style_sheet_url) {
          styleSheetUrl = profile.character_style_sheet_url as string;
          console.log("Using approved style sheet for consistency");
        }
        
        // Build character description from profile
        const descParts: string[] = [];
        if (profile?.character_height) descParts.push(`${profile.character_height} tall`);
        if (profile?.character_build) descParts.push(`${profile.character_build} build`);
        if (profile?.character_weight) descParts.push(`${profile.character_weight}`);
        if (profile?.character_features) descParts.push(profile.character_features as string);
        characterDesc = descParts.join(", ");
      } catch (err) {
        console.error("Failed to fetch style sheet:", err);
      }
    }
    
    // Build the message content
    let messageContent: any[];
    
    if (hasReferencePhoto) {
      // Reference photo mode: Generate a NEW scene featuring the person from the reference photo
      const imageUrl = images[0];
      console.log("Reference photo mode - image URL:", imageUrl.substring(0, 50));
      
      // Create a comprehensive cinematic prompt with detailed camera specifications
      // Build aspect ratio instruction
      // Build explicit dimension requirements
      const dimensionMap: Record<string, string> = {
        "16:9": "1920x1080 pixels (WIDE LANDSCAPE)",
        "9:16": "1080x1920 pixels (TALL PORTRAIT)", 
        "4:3": "1440x1080 pixels (STANDARD)",
        "1:1": "1024x1024 pixels (SQUARE)"
      };
      const targetDimension = aspect_ratio ? dimensionMap[aspect_ratio] : dimensionMap["16:9"];
      
      let enhancedPrompt = `Generate a completely new CINEMATIC IMAGE.

**MANDATORY ASPECT RATIO: ${aspect_ratio || "16:9"}**
**TARGET DIMENSIONS: ${targetDimension}**
The output image MUST be ${aspect_ratio === "16:9" || aspect_ratio === "4:3" ? "WIDER than it is tall (landscape orientation)" : aspect_ratio === "9:16" ? "TALLER than it is wide (portrait orientation)" : "a perfect square"}.

CRITICAL REQUIREMENTS:
1. The main character MUST look exactly like the person in the reference photo(s) - same face, same features, same identity
2. The image dimensions MUST match the specified aspect ratio
${characterDesc ? `3. Character physical traits: ${characterDesc}` : ""}

SCENE TO GENERATE:
${prompt}

PRODUCTION QUALITY:
- Professional cinematography, volumetric lighting
- Shallow depth of field with creamy bokeh
- Natural film grain, professional color grading`;
      
      // Build message content with reference photo and optionally style sheet
      messageContent = [
        { 
          type: "text", 
          text: enhancedPrompt
        },
        { 
          type: "image_url", 
          image_url: { url: imageUrl } 
        }
      ];
      
      // Add style sheet as second reference if available and approved
      if (styleSheetUrl) {
        messageContent.push({
          type: "image_url",
          image_url: { url: styleSheetUrl }
        });
        console.log("Added approved style sheet as additional reference");
      }
    } else {
      // Build explicit dimension requirements for create mode
      const dimensionMapCreate: Record<string, string> = {
        "16:9": "1920x1080 pixels (WIDE LANDSCAPE)",
        "9:16": "1080x1920 pixels (TALL PORTRAIT)", 
        "4:3": "1440x1080 pixels (STANDARD)",
        "1:1": "1024x1024 pixels (SQUARE)"
      };
      const targetDimensionCreate = aspect_ratio ? dimensionMapCreate[aspect_ratio] : dimensionMapCreate["16:9"];
      
      // For image creation without reference: comprehensive cinematic prompt
      let enhancedPrompt = `Generate a CINEMATIC IMAGE with the following specifications:

**MANDATORY ASPECT RATIO: ${aspect_ratio || "16:9"}**
**TARGET DIMENSIONS: ${targetDimensionCreate}**
The output image MUST be ${aspect_ratio === "16:9" || aspect_ratio === "4:3" ? "WIDER than it is tall (landscape orientation)" : aspect_ratio === "9:16" ? "TALLER than it is wide (portrait orientation)" : "a perfect square"}.

SCENE DESCRIPTION:
${prompt}

REQUIREMENTS:
- The image dimensions MUST strictly match ${aspect_ratio || "16:9"} aspect ratio
- Professional cinematography with volumetric lighting
- Shallow depth of field, creamy bokeh
- Natural film grain, Hollywood-grade color grading`;
      messageContent = [{ type: "text", text: enhancedPrompt }];
    }

    // Map aspect ratio to pixel dimensions for stricter enforcement
    const getAspectDimensions = (ratio: string | undefined): { width: number; height: number } | null => {
      switch (ratio) {
        case "16:9": return { width: 1920, height: 1080 };
        case "9:16": return { width: 1080, height: 1920 };
        case "4:3": return { width: 1440, height: 1080 };
        case "1:1": return { width: 1024, height: 1024 };
        default: return null;
      }
    };

    const dimensions = getAspectDimensions(aspect_ratio);
    const dimensionInstruction = dimensions 
      ? `OUTPUT DIMENSIONS: Generate the image at exactly ${dimensions.width}x${dimensions.height} pixels (${aspect_ratio} aspect ratio). This is a strict requirement.`
      : "";

    // Helper to make the API call
    const callImageAPI = async (content: any[], enforceAspect = true) => {
      // Prepend dimension instruction to the first text block if aspect ratio specified
      let finalContent = content;
      if (enforceAspect && dimensions && content.length > 0 && content[0].type === "text") {
        finalContent = [
          { type: "text", text: `${dimensionInstruction}\n\n${content[0].text}` },
          ...content.slice(1)
        ];
      }
      
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [{ role: "user", content: finalContent }],
          modalities: ["image", "text"]
        }),
      });
      return res;
    };

    console.log("Calling Lovable AI Gateway for image generation...");
    let response = await callImageAPI(messageContent);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again in a moment.", code: "E1005" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ success: false, error: "Insufficient credits. Please purchase more.", code: "E1009" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: false, error: "AI service temporarily unavailable", code: "E1007" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let data = await response.json();
    console.log("Lovable AI response received, checking for image...");

    // Extract the generated image from the response
    let generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    // If no image, retry once with a simplified prompt
    if (!generatedImage) {
      console.log("No image in first attempt, retrying with simplified prompt...");
      const retryContent = [{ type: "text", text: `Generate an image: ${prompt}. High quality, photorealistic.` }];
      response = await callImageAPI(retryContent);
      
      if (response.ok) {
        data = await response.json();
        generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      }
    }
    
    if (!generatedImage) {
      const textResponse = data.choices?.[0]?.message?.content || "No content";
      console.error("No image after retry. Text response:", textResponse.substring(0, 300));
      return new Response(JSON.stringify({ 
        success: false, 
        error: "The AI couldn't generate this image. Try a simpler description.", 
        code: "E1007" 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let finalImageUrl = generatedImage;

    // If we have Supabase configured and the image is base64, upload it for a persistent URL
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && generatedImage.startsWith("data:")) {
      try {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        // Parse the base64 data
        const matches = generatedImage.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const ext = mimeType.split("/")[1] || "png";
          const fileName = `generated/${userId}/${Date.now()}.${ext}`;
          
          // Convert base64 to Uint8Array
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // Ensure bucket exists
          const { data: buckets } = await supabaseAdmin.storage.listBuckets();
          const bucketExists = buckets?.some((b: any) => b.name === "generated-images");
          
          if (!bucketExists) {
            await supabaseAdmin.storage.createBucket("generated-images", { public: true });
          }

          // Upload the image
          const { error: uploadError } = await supabaseAdmin.storage
            .from("generated-images")
            .upload(fileName, bytes, { contentType: mimeType, upsert: true });

          if (!uploadError) {
            const { data: publicUrlData } = supabaseAdmin.storage
              .from("generated-images")
              .getPublicUrl(fileName);
            
            if (publicUrlData?.publicUrl) {
              finalImageUrl = publicUrlData.publicUrl;
              console.log("Image uploaded to storage");
            }
          } else {
            console.error("Upload error:", uploadError.message);
          }
        }
      } catch (uploadErr) {
        console.error("Storage upload failed, returning base64");
        // Fall back to base64 URL if upload fails
      }
    }

    // Save to generated_media table
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabaseAdmin.from("generated_media").insert({
          user_id: userId,
          media_type: "image",
          model_used: "google/gemini-2.5-flash-image-preview",
          prompt,
          media_url: finalImageUrl,
          status: "completed",
          metadata: { aspect_ratio, hasReferencePhoto }
        });
      } catch (dbErr) {
        console.error("Failed to save to generated_media");
      }
    }

    return new Response(
      JSON.stringify({ success: true, imageUrl: finalImageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return safeErrorResponse(error, corsHeaders, "LOVABLE-GENERATE-IMAGE");
  }
});