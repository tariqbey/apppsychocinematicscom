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

// Credit pack configurations (must match purchase-credits)
const CREDIT_PACKS: Record<string, { credits: number; price: number }> = {
  "pack_20": { credits: 20, price: 12 },
  "pack_40": { credits: 40, price: 24 },
  "pack_60": { credits: 60, price: 36 },
  "pack_100": { credits: 100, price: 60 }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Session ID is required");
    logStep("Session ID received", { sessionId });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session retrieved", { 
      status: session.payment_status, 
      metadata: session.metadata 
    });

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({
        success: false,
        error: "Payment not completed"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const userId = session.metadata?.user_id;
    const packId = session.metadata?.pack_id;
    const creditsFromMetadata = session.metadata?.credits;

    if (!userId || !packId) {
      throw new Error("Missing user_id or pack_id in session metadata");
    }

    const pack = CREDIT_PACKS[packId];
    const creditsToAdd = pack?.credits || parseInt(creditsFromMetadata || "0");

    if (!creditsToAdd) {
      throw new Error("Invalid credit amount");
    }

    logStep("Adding credits", { userId, packId, credits: creditsToAdd });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if this session was already processed
    const { data: existingTx } = await supabaseClient
      .from("credit_transactions")
      .select("id")
      .eq("stripe_session_id", sessionId)
      .single();

    if (existingTx) {
      logStep("Session already processed", { transactionId: existingTx.id });
      return new Response(JSON.stringify({
        success: true,
        alreadyProcessed: true,
        creditsAdded: creditsToAdd
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get or create production credits record
    let { data: creditsData } = await supabaseClient
      .from("production_credits")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!creditsData) {
      // Create new record
      const { data: newCredits, error: insertError } = await supabaseClient
        .from("production_credits")
        .insert({
          user_id: userId,
          monthly_credits: 0,
          purchased_credits: creditsToAdd,
        })
        .select()
        .single();

      if (insertError) throw new Error(`Failed to create credits: ${insertError.message}`);
      creditsData = newCredits;
    } else {
      // Update existing record - add to purchased credits
      const newPurchasedCredits = parseFloat(creditsData.purchased_credits) + creditsToAdd;
      
      const { error: updateError } = await supabaseClient
        .from("production_credits")
        .update({ purchased_credits: newPurchasedCredits })
        .eq("user_id", userId);

      if (updateError) throw new Error(`Failed to update credits: ${updateError.message}`);
    }

    // Log the transaction
    await supabaseClient
      .from("credit_transactions")
      .insert({
        user_id: userId,
        amount: creditsToAdd,
        transaction_type: "purchase",
        description: `Purchased ${creditsToAdd} credits (${packId})`,
        stripe_session_id: sessionId
      });

    logStep("Credits added successfully", { creditsAdded: creditsToAdd });

    return new Response(JSON.stringify({
      success: true,
      creditsAdded: creditsToAdd
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
