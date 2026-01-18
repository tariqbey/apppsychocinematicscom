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
    
    // Build the message content
    let messageContent: any[];
    
    if (hasReferencePhoto) {
      // Reference photo mode: Generate a NEW scene featuring the person from the reference photo
      const imageUrl = images[0];
      console.log("Reference photo mode - image URL:", imageUrl.substring(0, 50));
      
      // Create a comprehensive cinematic prompt with detailed camera specifications
      let enhancedPrompt = `Generate a completely new CINEMATIC IMAGE for the following scene. 

CRITICAL REQUIREMENTS:
1. The main character MUST look exactly like the person in the reference photo - same face, same features, same identity
2. Use PROFESSIONAL CINEMATOGRAPHY techniques throughout

TECHNICAL CAMERA SPECIFICATIONS:
- Camera: ARRI Alexa 65 or RED V-Raptor 8K with large format sensor
- Lens: Zeiss Master Prime T1.3 or Cooke Anamorphic for wide shots
- Color Science: ARRI/RED cinematic color grading with natural skin tones
- Dynamic Range: 14+ stops for rich shadow and highlight detail

SCENE TO GENERATE:
${prompt}

MANDATORY PRODUCTION QUALITY:
- Ultra high resolution 8K quality
- Volumetric lighting with atmospheric depth
- Shallow depth of field with creamy bokeh separation
- Natural film grain texture
- Professional color grading
- Cinematic 16:9 aspect ratio composition`;
      
      if (aspect_ratio) {
        enhancedPrompt += `\n- Use a ${aspect_ratio} aspect ratio.`;
      }
      
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
    } else {
      // For image creation without reference: comprehensive cinematic prompt
      let enhancedPrompt = `Generate a CINEMATIC IMAGE with the following specifications:

TECHNICAL CAMERA SETUP:
- Camera: ARRI Alexa 65, large format cinematic sensor, ARRI color science
- Lens: Zeiss Master Prime T1.3 or Cooke Anamorphic for epic wide shots  
- Settings: Shallow depth of field, 180° shutter angle, optimal ISO for scene
- Dynamic Range: 14+ stops, rich shadows and highlights

SCENE DESCRIPTION:
${prompt}

MANDATORY PRODUCTION QUALITY:
- Ultra high resolution 8K quality photorealistic image
- Volumetric lighting with atmospheric depth and god rays where appropriate
- Creamy bokeh separation on subject from background
- Natural film grain texture for organic feel
- Professional Hollywood-grade color grading
- Cinematic 16:9 aspect ratio composition
- Award-winning photography aesthetic`;

      if (aspect_ratio) {
        enhancedPrompt += `\n- Use a ${aspect_ratio} aspect ratio.`;
      }
      messageContent = [{ type: "text", text: enhancedPrompt }];
    }

    console.log("Calling Lovable AI Gateway for image generation...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: messageContent
          }
        ],
        modalities: ["image", "text"]
      }),
    });

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

    const data = await response.json();
    console.log("Lovable AI response received");

    // Extract the generated image from the response
    const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!generatedImage) {
      console.error("No image in response:", JSON.stringify(data).substring(0, 200));
      return new Response(JSON.stringify({ success: false, error: "No image was generated. Please try a different prompt.", code: "E1007" }), {
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