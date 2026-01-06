import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { prompt, images, aspect_ratio, user_id } = await req.json();

    if (!prompt) {
      throw new Error("Prompt is required");
    }

    console.log("Image generation request:", { 
      prompt: prompt.substring(0, 100), 
      hasImages: !!images?.length,
      aspect_ratio,
      user_id 
    });

    const isEdit = images && images.length > 0;
    
    // Build the message content
    let messageContent: any[];
    
    if (isEdit) {
      // For image editing: include both text instruction and the image
      const imageUrl = images[0];
      console.log("Edit mode - image URL type:", imageUrl.startsWith("data:") ? "base64" : "url");
      
      messageContent = [
        { 
          type: "text", 
          text: `Edit this image according to these instructions: ${prompt}. Maintain the original composition and style as much as possible while applying the requested changes.` 
        },
        { 
          type: "image_url", 
          image_url: { url: imageUrl } 
        }
      ];
    } else {
      // For image creation: just the text prompt
      let enhancedPrompt = prompt;
      if (aspect_ratio) {
        enhancedPrompt = `${prompt}. Use a ${aspect_ratio} aspect ratio.`;
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
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      if (response.status === 402) {
        throw new Error("API credits exhausted. Please add credits to continue.");
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Lovable AI response received");

    // Extract the generated image from the response
    const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!generatedImage) {
      console.error("No image in response:", JSON.stringify(data));
      throw new Error("No image was generated. Please try a different prompt.");
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
          const fileName = `generated/${user_id || "anonymous"}/${Date.now()}.${ext}`;
          
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
              console.log("Image uploaded to storage:", finalImageUrl);
            }
          } else {
            console.error("Upload error:", uploadError);
          }
        }
      } catch (uploadErr) {
        console.error("Storage upload failed, returning base64:", uploadErr);
        // Fall back to base64 URL if upload fails
      }
    }

    // Save to generated_media table if we have user_id
    if (user_id && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabaseAdmin.from("generated_media").insert({
          user_id,
          media_type: "image",
          model_used: "google/gemini-2.5-flash-image-preview",
          prompt,
          media_url: finalImageUrl,
          status: "completed",
          metadata: { aspect_ratio, isEdit }
        });
      } catch (dbErr) {
        console.error("Failed to save to generated_media:", dbErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, imageUrl: finalImageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Image generation error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to generate image" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
