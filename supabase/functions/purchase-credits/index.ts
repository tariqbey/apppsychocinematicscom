import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PURCHASE-CREDITS] ${step}${detailsStr}`);
};

// API Usage pack configurations - selling dollar amounts now
const USAGE_PACKS = {
  "pack_5": {
    dollarAmount: 5,
    priceId: "price_1SnPcbKb1BapFa4im2AI9BLW", // $5 = $5 API usage
    price: 5
  },
  "pack_10": {
    dollarAmount: 10,
    priceId: "price_1SnPdJKb1BapFa4iCo5KlNTO", // $10 = $10 API usage
    price: 10
  },
  "pack_20": {
    dollarAmount: 22, // Bonus: Pay $20, get $22 API usage (10% bonus)
    priceId: "price_1SnPexKb1BapFa4iM8alKETd",
    price: 20
  },
  "pack_30": {
    dollarAmount: 35, // Bonus: Pay $30, get $35 API usage (~17% bonus)
    priceId: "price_1SnPfBKb1BapFa4igfHVYycR",
    price: 30
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { packId } = await req.json();
    logStep("Requested pack", { packId });

    const pack = USAGE_PACKS[packId as keyof typeof USAGE_PACKS];
    if (!pack) {
      throw new Error(`Invalid pack ID: ${packId}`);
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    // Create checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: pack.priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/credits-success?session_id={CHECKOUT_SESSION_ID}&pack=${packId}`,
      cancel_url: `${req.headers.get("origin")}/studio`,
      metadata: {
        user_id: user.id,
        pack_id: packId,
        dollar_amount: pack.dollarAmount.toString()
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
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
