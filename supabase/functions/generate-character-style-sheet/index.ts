import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { safeErrorResponse } from "../_shared/error-handler.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Generate a professional character reference style sheet from a user's reference photo.
 * 
 * This creates a multi-view turnaround sheet that serves as the "identity anchor" for
 * all subsequent AI image generations, ensuring consistent character appearance.
 */

const STYLE_SHEET_PROMPT = `Create a professional character reference sheet based strictly on the uploaded reference image.

Use a clean, neutral plain background and present the sheet as a technical model turnaround while matching the exact visual style of the reference (same realism level, rendering approach, texture, color treatment, and overall aesthetic).

Arrange the composition into two horizontal rows:

TOP ROW: Four full-body standing views placed side-by-side in this order:
- Front view
- Left profile view (facing left)
- Right profile view (facing right)  
- Back view

BOTTOM ROW: Three highly detailed close-up portraits aligned beneath the full-body row in this order:
- Front portrait
- Left profile portrait (facing left)
- Right profile portrait (facing right)

CRITICAL REQUIREMENTS:
- Maintain PERFECT IDENTITY CONSISTENCY across every panel - this must be the EXACT SAME PERSON
- Keep the subject in a relaxed A-pose with consistent scale and alignment between views
- Accurate anatomy and clear silhouette
- Ensure even spacing and clean panel separation
- Uniform framing and consistent head height across the full-body lineup
- Consistent facial scale across the portraits
- Lighting should be consistent across all panels (same direction, intensity, and softness)
- Natural, controlled shadows that preserve detail without dramatic mood shifts
- Output a crisp, print-ready reference sheet look with sharp details

This is a TECHNICAL CHARACTER REFERENCE SHEET for production use.`;

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
      return new Response(JSON.stringify({ success: false, error: "AI service unavailable" }), {
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

    // Rate limiting: 5 style sheet generations per minute (these are expensive)
    const rateLimit = checkRateLimit(userId, { maxRequests: 5, windowMs: 60000 });
    if (!rateLimit.allowed) {
      return rateLimitResponse(corsHeaders, rateLimit.resetIn);
    }

    const { referencePhotoUrl, characterDescription } = await req.json();

    if (!referencePhotoUrl) {
      return new Response(JSON.stringify({ success: false, error: "Reference photo URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Generating character style sheet for user:", userId.substring(0, 8));

    // Build the prompt with character description if provided
    let enhancedPrompt = STYLE_SHEET_PROMPT;
    if (characterDescription) {
      const { height, weight, build, features } = characterDescription;
      const descParts: string[] = [];
      if (height) descParts.push(`Height: ${height}`);
      if (weight) descParts.push(`Weight/Size: ${weight}`);
      if (build) descParts.push(`Build: ${build}`);
      if (features) descParts.push(`Additional features: ${features}`);
      
      if (descParts.length > 0) {
        enhancedPrompt += `\n\nCHARACTER SPECIFICATIONS (incorporate these into the style sheet):\n${descParts.join("\n")}`;
      }
    }

    // Call Lovable AI Gateway with the reference photo
    const messageContent = [
      { type: "text", text: enhancedPrompt },
      { type: "image_url", image_url: { url: referencePhotoUrl } }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [{ role: "user", content: messageContent }],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ success: false, error: "Insufficient credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: false, error: "AI service temporarily unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImage) {
      console.error("No image generated for style sheet");
      return new Response(JSON.stringify({ success: false, error: "Failed to generate style sheet. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let finalStyleSheetUrl = generatedImage;

    // Upload to Supabase storage for persistence
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && generatedImage.startsWith("data:")) {
      try {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        const matches = generatedImage.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const ext = mimeType.split("/")[1] || "png";
          const fileName = `${userId}/style-sheet-${Date.now()}.${ext}`;
          
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const { error: uploadError } = await supabaseAdmin.storage
            .from("generated-media")
            .upload(fileName, bytes, { contentType: mimeType, upsert: true });

          if (!uploadError) {
            const { data: publicUrlData } = supabaseAdmin.storage
              .from("generated-media")
              .getPublicUrl(fileName);
            
            if (publicUrlData?.publicUrl) {
              finalStyleSheetUrl = publicUrlData.publicUrl;
              console.log("Style sheet uploaded to storage");
            }
          } else {
            console.error("Upload error:", uploadError.message);
          }
        }
      } catch (uploadErr) {
        console.error("Storage upload failed, returning base64");
      }
    }

    // Save the style sheet URL to user profile
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        const updateData: Record<string, unknown> = {
          character_style_sheet_url: finalStyleSheetUrl,
          style_sheet_approved: false,
          updated_at: new Date().toISOString(),
        };

        // Also save character description if provided
        if (characterDescription) {
          if (characterDescription.height) updateData.character_height = characterDescription.height;
          if (characterDescription.weight) updateData.character_weight = characterDescription.weight;
          if (characterDescription.build) updateData.character_build = characterDescription.build;
          if (characterDescription.features) updateData.character_features = characterDescription.features;
        }

        await supabaseAdmin
          .from("user_profiles")
          .update(updateData)
          .eq("user_id", userId);

        console.log("Style sheet saved to user profile");
      } catch (dbErr) {
        console.error("Failed to save style sheet to profile:", dbErr);
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
          prompt: "Character Style Sheet Generation",
          media_url: finalStyleSheetUrl,
          status: "completed",
          metadata: { type: "style_sheet", characterDescription }
        });
      } catch (dbErr) {
        console.error("Failed to save to generated_media");
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        styleSheetUrl: finalStyleSheetUrl,
        message: "Style sheet generated successfully. Please review and approve to use for all future generations."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return safeErrorResponse(error, corsHeaders, "GENERATE-STYLE-SHEET");
  }
});
