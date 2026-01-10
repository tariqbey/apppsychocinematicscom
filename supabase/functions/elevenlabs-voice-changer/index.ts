import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cost constants
const VOICE_CHANGE_COST_DOLLARS = 0.08; // $0.08 per voice change
const MARKUP_DOLLARS = 0.10;             // $0.10 markup
const dollarsToCredits = (dollars: number): number => Math.round(dollars * 100);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Check if user is admin (skip credit deduction)
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();

    const isAdmin = !!roleData;

    // Check and deduct credits (unless admin)
    if (!isAdmin) {
      const { data: creditsData } = await supabaseClient
        .from("production_credits")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!creditsData) {
        return new Response(
          JSON.stringify({ error: "No credits available. Please subscribe first." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const creditsToDeduct = dollarsToCredits(VOICE_CHANGE_COST_DOLLARS + MARKUP_DOLLARS);
      const monthlyAllowanceUsed = Math.round(parseFloat(creditsData.monthly_allowance_used || 0));
      const monthlyAllowanceLimit = Math.round(parseFloat(creditsData.monthly_allowance_limit || 1000));
      const purchasedBalance = Math.round(parseFloat(creditsData.purchased_credits || 0));
      const remainingMonthlyAllowance = Math.max(0, monthlyAllowanceLimit - monthlyAllowanceUsed);
      const totalRemaining = remainingMonthlyAllowance + purchasedBalance;

      if (totalRemaining < creditsToDeduct) {
        return new Response(
          JSON.stringify({ error: "Insufficient credits", creditsRequired: creditsToDeduct, totalRemaining }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Deduct credits
      let newMonthlyAllowanceUsed = monthlyAllowanceUsed;
      let newPurchasedBalance = purchasedBalance;

      if (remainingMonthlyAllowance >= creditsToDeduct) {
        newMonthlyAllowanceUsed = monthlyAllowanceUsed + creditsToDeduct;
      } else {
        const deductFromPurchased = creditsToDeduct - remainingMonthlyAllowance;
        newMonthlyAllowanceUsed = monthlyAllowanceLimit;
        newPurchasedBalance = purchasedBalance - deductFromPurchased;
      }

      await supabaseClient
        .from("production_credits")
        .update({
          monthly_allowance_used: newMonthlyAllowanceUsed,
          purchased_credits: newPurchasedBalance
        })
        .eq("user_id", userId);

      // Log transaction
      await supabaseClient
        .from("credit_transactions")
        .insert({
          user_id: userId,
          amount: -creditsToDeduct,
          api_cost_usd: VOICE_CHANGE_COST_DOLLARS + MARKUP_DOLLARS,
          transaction_type: "generation",
          description: `Voice change - ${creditsToDeduct} credits`,
          media_type: "voiceChange"
        });
    }

    const { audioUrl, voiceId } = await req.json();
    
    // Check for user's personal ElevenLabs API key first
    const { data: userIntegration } = await supabaseClient
      .from("user_integrations")
      .select("api_key")
      .eq("user_id", userId)
      .eq("service_name", "elevenlabs")
      .single();

    // Use user's key if available, otherwise fall back to system key
    const ELEVENLABS_API_KEY = userIntegration?.api_key || Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY not configured. Please add your API key in Settings → Integrations.");
    }

    if (!audioUrl) {
      throw new Error("Audio URL is required");
    }

    if (!voiceId) {
      throw new Error("Voice ID is required");
    }

    const usingPersonalKey = !!userIntegration?.api_key;
    console.log(`Processing voice change for user ${userId} (using ${usingPersonalKey ? "personal" : "system"} API key)`);
    console.log(`Audio URL: ${audioUrl}`);
    console.log(`Target Voice ID: ${voiceId}`);

    // Fetch the audio from the URL
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio: ${audioResponse.status}`);
    }

    const audioBlob = await audioResponse.blob();
    console.log(`Fetched audio: ${audioBlob.size} bytes, type: ${audioBlob.type}`);

    // Create form data for ElevenLabs API
    const formData = new FormData();
    formData.append("audio", audioBlob, "input.mp3");
    formData.append("model_id", "eleven_multilingual_sts_v2");
    // Voice settings for natural sound
    formData.append("voice_settings", JSON.stringify({
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.3,
      use_speaker_boost: true,
    }));

    // Call ElevenLabs Speech-to-Speech API
    const stsResponse = await fetch(
      `https://api.elevenlabs.io/v1/speech-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: formData,
      }
    );

    if (!stsResponse.ok) {
      const errorText = await stsResponse.text();
      console.error("ElevenLabs STS API error:", errorText);
      throw new Error(`ElevenLabs API error: ${stsResponse.status} - ${errorText}`);
    }

    const changedAudioBuffer = await stsResponse.arrayBuffer();
    console.log(`Voice changed audio: ${changedAudioBuffer.byteLength} bytes`);

    // Upload the changed audio to Supabase Storage
    const fileName = `voice-changed/${userId}/${Date.now()}.mp3`;
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from("generated-media")
      .upload(fileName, changedAudioBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload changed audio: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabaseClient.storage
      .from("generated-media")
      .getPublicUrl(fileName);

    console.log(`Voice changed audio uploaded: ${publicUrlData.publicUrl}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        audioUrl: publicUrlData.publicUrl 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Voice changer error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
