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
  console.log(`[PURCHASE-CREDITS] ${step}${detailsStr}`);
};

// Credit pack configurations (1 credit = $0.01)
const CREDIT_PACKS = {
  "pack_5": {
    credits: 500,      // $5 = 500 credits
    priceId: "price_1SnPcbKb1BapFa4im2AI9BLW",
    price: 5
  },
  "pack_10": {
    credits: 1000,     // $10 = 1000 credits
    priceId: "price_1SnPdJKb1BapFa4iCo5KlNTO",
    price: 10
  },
  "pack_20": {
    credits: 2200,     // $20 = 2200 credits (10% bonus)
    priceId: "price_1SnPexKb1BapFa4iM8alKETd",
    price: 20
  },
  "pack_30": {
    credits: 3500,     // $30 = 3500 credits (~17% bonus)
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

    const pack = CREDIT_PACKS[packId as keyof typeof CREDIT_PACKS];
    if (!pack) {
      return new Response(JSON.stringify({ error: "Invalid credit pack selected", code: "E1004" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required", code: "E1001" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return new Response(JSON.stringify({ error: "Authentication failed", code: "E1001" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const user = userData.user;
    logStep("User authenticated", { userId: user.id.substring(0, 8) + "..." });

    // Rate limiting: 10 purchase attempts per minute
    const rateLimit = checkRateLimit(user.id, { maxRequests: 10, windowMs: 60000 });
    if (!rateLimit.allowed) {
      logStep("Rate limit exceeded", { userId: user.id.substring(0, 8) });
      return rateLimitResponse(corsHeaders, rateLimit.resetIn);
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

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer");
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
        credits: pack.credits.toString()
      }
    });

    logStep("Checkout session created");

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return safeErrorResponse(error, corsHeaders, "PURCHASE-CREDITS");
  }
});