import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ALLOCATE-MONTHLY-CREDITS] ${step}${detailsStr}`);
};

// Monthly allowance in dollars for subscribers
const MONTHLY_ALLOWANCE_LIMIT = 10.00;

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
      logStep("Admin user - unlimited usage");
      return new Response(JSON.stringify({
        success: true,
        isAdmin: true,
        monthlyAllowanceLimit: 9999
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if user has active subscription in Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({
        success: false,
        subscribed: false,
        error: "No active subscription"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    // Also check for trialing subscriptions
    const trialingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "trialing",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0 || trialingSubscriptions.data.length > 0;
    
    if (!hasActiveSub) {
      logStep("No active subscription");
      return new Response(JSON.stringify({
        success: false,
        subscribed: false,
        error: "No active subscription"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscription = subscriptions.data[0] || trialingSubscriptions.data[0];
    const periodEnd = new Date(subscription.current_period_end * 1000);
    logStep("Active subscription found", { 
      subscriptionId: subscription.id, 
      periodEnd: periodEnd.toISOString() 
    });

    // Get or create production credits
    let { data: creditsData } = await supabaseClient
      .from("production_credits")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const now = new Date();

    if (!creditsData) {
      // First time - create with $10 monthly allowance, usage starts at 0
      const { data: newCredits, error: insertError } = await supabaseClient
        .from("production_credits")
        .insert({
          user_id: user.id,
          monthly_credits: 0, // Legacy field
          purchased_credits: 0,
          monthly_allowance_limit: MONTHLY_ALLOWANCE_LIMIT,
          monthly_allowance_used: 0,
          monthly_credits_reset_at: periodEnd.toISOString()
        })
        .select()
        .single();

      if (insertError) throw new Error(`Failed to create credits: ${insertError.message}`);
      
      // Log the allocation
      await supabaseClient
        .from("credit_transactions")
        .insert({
          user_id: user.id,
          amount: MONTHLY_ALLOWANCE_LIMIT,
          api_cost_usd: 0,
          transaction_type: "monthly_allocation",
          description: `Monthly $${MONTHLY_ALLOWANCE_LIMIT} API allowance activated`
        });

      logStep("Created new credits with monthly allowance", { limit: MONTHLY_ALLOWANCE_LIMIT });

      return new Response(JSON.stringify({
        success: true,
        subscribed: true,
        monthlyAllowanceLimit: MONTHLY_ALLOWANCE_LIMIT,
        monthlyAllowanceUsed: 0,
        allocated: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if we need to reset monthly usage (new billing period)
    const resetAt = creditsData.monthly_credits_reset_at 
      ? new Date(creditsData.monthly_credits_reset_at) 
      : null;

    if (!resetAt || now >= resetAt) {
      // Time to reset - set usage back to 0
      const { error: updateError } = await supabaseClient
        .from("production_credits")
        .update({
          monthly_allowance_used: 0,
          monthly_allowance_limit: MONTHLY_ALLOWANCE_LIMIT,
          monthly_credits_reset_at: periodEnd.toISOString()
        })
        .eq("user_id", user.id);

      if (updateError) throw new Error(`Failed to reset usage: ${updateError.message}`);

      // Log the reset
      await supabaseClient
        .from("credit_transactions")
        .insert({
          user_id: user.id,
          amount: MONTHLY_ALLOWANCE_LIMIT,
          api_cost_usd: 0,
          transaction_type: "monthly_reset",
          description: `Monthly $${MONTHLY_ALLOWANCE_LIMIT} API allowance reset`
        });

      logStep("Reset monthly usage", { nextReset: periodEnd });

      return new Response(JSON.stringify({
        success: true,
        subscribed: true,
        monthlyAllowanceLimit: MONTHLY_ALLOWANCE_LIMIT,
        monthlyAllowanceUsed: 0,
        allocated: true,
        nextReset: periodEnd.toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const monthlyAllowanceUsed = parseFloat(creditsData.monthly_allowance_used || 0);
    const monthlyAllowanceLimit = parseFloat(creditsData.monthly_allowance_limit || MONTHLY_ALLOWANCE_LIMIT);

    logStep("No reset needed", { 
      monthlyAllowanceUsed, 
      monthlyAllowanceLimit,
      resetAt: resetAt?.toISOString() 
    });

    return new Response(JSON.stringify({
      success: true,
      subscribed: true,
      monthlyAllowanceLimit,
      monthlyAllowanceUsed,
      allocated: false,
      nextReset: resetAt?.toISOString()
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
