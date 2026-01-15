import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { safeErrorResponse } from "../_shared/error-handler.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CONFIRM-CREDIT-PURCHASE] ${step}${detailsStr}`);
};

// Credit pack configurations (1 credit = $0.01)
const CREDIT_PACKS: Record<string, { credits: number; price: number }> = {
  "pack_5": { credits: 500, price: 5 },
  "pack_10": { credits: 1000, price: 10 },
  "pack_20": { credits: 2200, price: 20 },
  "pack_30": { credits: 3500, price: 30 }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { sessionId } = await req.json();
    logStep("Session ID received", { sessionId: sessionId?.substring(0, 20) + "..." });

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Session information required", code: "E1004" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("Configuration error - missing Stripe key");
      return new Response(JSON.stringify({ error: "Payment service unavailable", code: "E1002" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Retrieve and verify the session from Stripe (server-side verification)
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session retrieved", { 
      status: session.payment_status,
      hasMetadata: !!session.metadata 
    });

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Payment not completed", code: "E1006" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = session.metadata?.user_id;
    const packId = session.metadata?.pack_id;
    
    if (!userId || !packId) {
      logStep("Invalid session metadata");
      return new Response(JSON.stringify({ error: "Invalid payment session", code: "E1004" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit per user: 10 confirmations per minute (prevent replay attacks)
    const rateLimit = checkRateLimit(`confirm_${userId}`, { maxRequests: 10, windowMs: 60000 });
    if (!rateLimit.allowed) {
      logStep("Rate limit exceeded for confirmations", { userId });
      return rateLimitResponse(corsHeaders, rateLimit.resetIn);
    }

    const pack = CREDIT_PACKS[packId];
    if (!pack) {
      logStep("Unknown pack", { packId });
      return new Response(JSON.stringify({ error: "Invalid credit pack", code: "E1004" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Use atomic RPC function to prevent race conditions
    // The function handles duplicate detection via unique constraint on stripe_session_id
    const { data: result, error: rpcError } = await supabaseClient.rpc('allocate_credits_atomic', {
      p_user_id: userId,
      p_session_id: sessionId,
      p_credits: pack.credits,
      p_description: `Purchased ${pack.credits} credits`
    });

    if (rpcError) {
      logStep("Error in atomic credit allocation", { error: rpcError.message });
      return new Response(JSON.stringify({ error: "Unable to process credits", code: "E1003" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already processed (caught by unique constraint)
    if (result?.alreadyProcessed) {
      logStep("Session already processed (atomic)", { sessionId: sessionId?.substring(0, 20) });
      return new Response(JSON.stringify({
        success: true,
        alreadyProcessed: true,
        credits: pack.credits
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Purchase confirmed (atomic)", { 
      userId: userId.substring(0, 8) + "...", 
      credits: pack.credits 
    });

    return new Response(JSON.stringify({
      success: true,
      credits: pack.credits,
      packId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return safeErrorResponse(error, corsHeaders, "CONFIRM-CREDIT-PURCHASE");
  }
});