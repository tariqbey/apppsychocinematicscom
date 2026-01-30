import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALBUM_ART_CREDIT_COST = 13; // Same as image generation

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { trackTitle, artistName, albumName, style } = await req.json();

    if (!trackTitle) {
      return new Response(JSON.stringify({ error: "Track title is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check credits
    const { data: credits, error: creditsError } = await supabase
      .from("production_credits")
      .select("monthly_credits, purchased_credits, monthly_allowance_used, monthly_allowance_limit")
      .eq("user_id", user.id)
      .single();

    if (creditsError || !credits) {
      return new Response(JSON.stringify({ error: "Could not verify credits" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const monthlyAvailable = Math.max(0, credits.monthly_allowance_limit - credits.monthly_allowance_used);
    const totalAvailable = monthlyAvailable + Number(credits.purchased_credits);

    if (totalAvailable < ALBUM_ART_CREDIT_COST) {
      return new Response(JSON.stringify({ error: "Insufficient credits", required: ALBUM_ART_CREDIT_COST, available: totalAvailable }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate the album art prompt
    const artStyle = style || "cinematic, professional album artwork";
    const prompt = `Create a professional album cover art for a song titled "${trackTitle}"${artistName ? ` by ${artistName}` : ""}${albumName ? ` from the album "${albumName}"` : ""}. Style: ${artStyle}. The image should be square, visually striking, and suitable as album artwork. High quality, detailed, artistic composition.`;

    console.log("[generate-album-art] Generating with prompt:", prompt);

    // Call Lovable AI with Nano Banana Pro for high-quality image generation
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[generate-album-art] AI error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to generate album art" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      return new Response(JSON.stringify({ error: "No image generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload to storage
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const fileName = `${user.id}/album-art/${Date.now()}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("generated-media")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("[generate-album-art] Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to save album art" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { publicUrl } } = supabase.storage
      .from("generated-media")
      .getPublicUrl(fileName);

    // Deduct credits
    const fromMonthly = Math.min(monthlyAvailable, ALBUM_ART_CREDIT_COST);
    const fromPurchased = ALBUM_ART_CREDIT_COST - fromMonthly;

    await supabase
      .from("production_credits")
      .update({
        monthly_allowance_used: credits.monthly_allowance_used + fromMonthly,
        purchased_credits: Number(credits.purchased_credits) - fromPurchased,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    // Log transaction
    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: -ALBUM_ART_CREDIT_COST,
      transaction_type: "generation",
      description: `Album art for "${trackTitle}"`,
      media_type: "image",
      api_cost_usd: 0.03, // Nano Banana Pro cost
    });

    return new Response(JSON.stringify({ 
      success: true, 
      album_cover_url: publicUrl,
      credits_used: ALBUM_ART_CREDIT_COST,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[generate-album-art] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
