import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cost constants
const TTS_COST_DOLLARS = 0.03; // $0.03 per TTS request
const MARKUP_DOLLARS = 0.10;   // $0.10 markup
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

      const creditsToDeduct = dollarsToCredits(TTS_COST_DOLLARS + MARKUP_DOLLARS);
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
          api_cost_usd: TTS_COST_DOLLARS + MARKUP_DOLLARS,
          transaction_type: "generation",
          description: `TTS generation - ${creditsToDeduct} credits`,
          media_type: "tts"
        });
    }

    const { text, voiceId } = await req.json();
    
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

    if (!text) {
      throw new Error("Text is required");
    }

    // Input validation - limit text length to prevent abuse
    if (text.length > 5000) {
      throw new Error("Text must be 5000 characters or less");
    }

    // Use "George" voice by default - authoritative and warm, perfect for a director/coach
    const selectedVoiceId = voiceId || "JBFqnCBsd6RMkjVDRZzb";
    
    const usingPersonalKey = !!userIntegration?.api_key;
    console.log(`TTS for user ${userId} (using ${usingPersonalKey ? "personal" : "system"} API key)`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.75,
            style: 0.4,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
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
