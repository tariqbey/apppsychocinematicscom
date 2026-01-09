import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CONFIRM-CREDIT-PURCHASE] ${step}${detailsStr}`);
};

// Usage pack configurations - matches purchase-credits (dollar-based)
const USAGE_PACKS: Record<string, { dollarAmount: number; price: number }> = {
  "pack_5": { dollarAmount: 5, price: 5 },
  "pack_10": { dollarAmount: 10, price: 10 },
  "pack_20": { dollarAmount: 22, price: 20 },
  "pack_30": { dollarAmount: 35, price: 30 }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { sessionId } = await req.json();
    logStep("Session ID received", { sessionId });

    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Retrieve the session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session retrieved", { 
      status: session.payment_status,
      metadata: session.metadata 
    });

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    const userId = session.metadata?.user_id;
    const packId = session.metadata?.pack_id;
    
    if (!userId || !packId) {
      throw new Error("Missing user_id or pack_id in session metadata");
    }

    const pack = USAGE_PACKS[packId];
    if (!pack) {
      throw new Error(`Unknown pack: ${packId}`);
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if this session was already processed
    const { data: existingTransaction } = await supabaseClient
      .from("credit_transactions")
      .select("id")
      .eq("stripe_session_id", sessionId)
      .single();

    if (existingTransaction) {
      logStep("Session already processed", { sessionId });
      return new Response(JSON.stringify({
        success: true,
        alreadyProcessed: true,
        dollarAmount: pack.dollarAmount
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get current balance
    const { data: creditsData, error: creditsError } = await supabaseClient
      .from("production_credits")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (creditsError || !creditsData) {
      // Create new record if doesn't exist
      const { error: insertError } = await supabaseClient
        .from("production_credits")
        .insert({
          user_id: userId,
          monthly_credits: 0,
          purchased_credits: pack.dollarAmount,
          monthly_allowance_limit: 10,
          monthly_allowance_used: 0
        });

      if (insertError) throw new Error(`Failed to create credits: ${insertError.message}`);
    } else {
      // Add to purchased_credits (which is now dollar balance)
      const currentPurchased = parseFloat(creditsData.purchased_credits || 0);
      const newPurchased = currentPurchased + pack.dollarAmount;

      const { error: updateError } = await supabaseClient
        .from("production_credits")
        .update({
          purchased_credits: newPurchased
        })
        .eq("user_id", userId);

      if (updateError) throw new Error(`Failed to update credits: ${updateError.message}`);
    }

    // Log the transaction
    await supabaseClient
      .from("credit_transactions")
      .insert({
        user_id: userId,
        amount: pack.dollarAmount,
        api_cost_usd: 0,
        transaction_type: "purchase",
        description: `Purchased $${pack.dollarAmount} API usage (${packId})`,
        stripe_session_id: sessionId
      });

    logStep("Purchase confirmed", { 
      userId, 
      packId, 
      dollarAmount: pack.dollarAmount 
    });

    return new Response(JSON.stringify({
      success: true,
      dollarAmount: pack.dollarAmount,
      packId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
