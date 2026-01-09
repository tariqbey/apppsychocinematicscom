import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Trial credits: 250 (5 images at 15 credits + 2 videos at ~60 credits + 2 songs at 25 credits)
const TRIAL_CREDITS = 250;
// Full monthly credits for paid subscribers
const MONTHLY_CREDITS = 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleData) {
      logStep("Admin user detected");
      return new Response(JSON.stringify({
        subscribed: true,
        isAdmin: true,
        productId: null,
        subscriptionEnd: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active or trialing subscriptions
    const [activeSubscriptions, trialingSubscriptions] = await Promise.all([
      stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 }),
      stripe.subscriptions.list({ customer: customerId, status: "trialing", limit: 1 })
    ]);

    const subscription = activeSubscriptions.data[0] || trialingSubscriptions.data[0];
    const hasActiveSub = !!subscription;

    let productId = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      productId = subscription.items.data[0]?.price?.product;
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        status: subscription.status,
        endDate: subscriptionEnd 
      });

      // Determine if this is a trial or paid subscription
      const isTrialing = subscription.status === "trialing";
      const creditsToAllocate = isTrialing ? TRIAL_CREDITS : MONTHLY_CREDITS;
      const allocationType = isTrialing ? "trial_allocation" : "monthly_allocation";
      const allocationDescription = isTrialing 
        ? "Free trial credits (5 images + 2 videos)" 
        : "Monthly subscription credits";

      // Ensure user has production credits allocated
      const { data: creditsData } = await supabaseClient
        .from("production_credits")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!creditsData) {
        // First subscription - allocate credits based on trial vs paid
        await supabaseClient
          .from("production_credits")
          .insert({
            user_id: user.id,
            monthly_credits: 0,
            monthly_allowance_limit: creditsToAllocate,
            monthly_allowance_used: 0,
            purchased_credits: 0,
            monthly_credits_reset_at: subscriptionEnd
          });

        await supabaseClient
          .from("credit_transactions")
          .insert({
            user_id: user.id,
            amount: creditsToAllocate,
            transaction_type: allocationType,
            description: allocationDescription
          });

        logStep("Allocated initial credits", { credits: creditsToAllocate, isTrialing });
      } else if (!isTrialing && creditsData.monthly_allowance_limit === TRIAL_CREDITS) {
        // User just upgraded from trial to paid - upgrade their allowance
        await supabaseClient
          .from("production_credits")
          .update({
            monthly_allowance_limit: MONTHLY_CREDITS,
            monthly_allowance_used: 0,
            monthly_credits_reset_at: subscriptionEnd
          })
          .eq("user_id", user.id);

        await supabaseClient
          .from("credit_transactions")
          .insert({
            user_id: user.id,
            amount: MONTHLY_CREDITS,
            transaction_type: "monthly_allocation",
            description: "Upgraded to full subscription credits"
          });

        logStep("Upgraded trial to full subscription credits", { credits: MONTHLY_CREDITS });
      }
    } else {
      logStep("No active subscription found");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      isAdmin: false,
      productId,
      subscriptionEnd,
      status: subscription?.status
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
