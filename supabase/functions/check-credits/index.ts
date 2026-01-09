import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { safeErrorResponse } from "../_shared/error-handler.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-CREDITS] ${step}${detailsStr}`);
};

// Default monthly allowance limit in CREDITS (1 credit = $0.01, so 1000 = $10)
const MONTHLY_ALLOWANCE_LIMIT_CREDITS = 1000;

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
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required", code: "E1001" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.id) {
      return new Response(JSON.stringify({ error: "Authentication failed", code: "E1001" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Rate limiting: 60 requests per minute for credit checks
    const rateLimit = checkRateLimit(user.id, { maxRequests: 60, windowMs: 60000 });
    if (!rateLimit.allowed) {
      logStep("Rate limit exceeded", { userId: user.id });
      return rateLimitResponse(corsHeaders, rateLimit.resetIn);
    }

    // Check if user is admin (unlimited usage)
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    const isAdmin = !!roleData;
    logStep("Admin check", { isAdmin });

    if (isAdmin) {
      return new Response(JSON.stringify({
        isAdmin: true,
        monthlyAllowanceUsed: 0,
        monthlyAllowanceLimit: 999999,
        remainingMonthlyAllowance: 999999,
        purchasedBalance: 999999,
        totalRemaining: 999999,
        canGenerate: true,
        usagePercentage: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get or create production credits record
    let { data: creditsData, error: creditsError } = await supabaseClient
      .from("production_credits")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!creditsData) {
      logStep("Creating new credits record");
      const { data: newCredits, error: insertError } = await supabaseClient
        .from("production_credits")
        .insert({
          user_id: user.id,
          monthly_credits: 0,
          purchased_credits: 0,
          monthly_allowance_limit: MONTHLY_ALLOWANCE_LIMIT_CREDITS,
          monthly_allowance_used: 0
        })
        .select()
        .single();

      if (insertError) {
        logStep("Error creating credits", { error: insertError.message });
        return new Response(JSON.stringify({ error: "Unable to initialize credits", code: "E1003" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      creditsData = newCredits;
    }

    // All values are now in CREDITS (integers)
    const monthlyAllowanceUsed = Math.round(parseFloat(creditsData.monthly_allowance_used || 0));
    const monthlyAllowanceLimit = Math.round(parseFloat(creditsData.monthly_allowance_limit || MONTHLY_ALLOWANCE_LIMIT_CREDITS));
    const purchasedBalance = Math.round(parseFloat(creditsData.purchased_credits || 0));
    const remainingMonthlyAllowance = Math.max(0, monthlyAllowanceLimit - monthlyAllowanceUsed);
    const totalRemaining = remainingMonthlyAllowance + purchasedBalance;
    const usagePercentage = monthlyAllowanceLimit > 0 ? (monthlyAllowanceUsed / monthlyAllowanceLimit) * 100 : 0;

    logStep("Usage retrieved (credits)", { 
      monthlyAllowanceUsed,
      monthlyAllowanceLimit,
      remainingMonthlyAllowance,
      purchasedBalance,
      totalRemaining,
      usagePercentage: usagePercentage.toFixed(1)
    });

    return new Response(JSON.stringify({
      isAdmin: false,
      monthlyAllowanceUsed,
      monthlyAllowanceLimit,
      remainingMonthlyAllowance,
      purchasedBalance,
      totalRemaining,
      monthlyCreditsResetAt: creditsData.monthly_credits_reset_at,
      canGenerate: totalRemaining >= 1, // Need at least 1 credit
      usagePercentage: Math.min(100, usagePercentage)
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return safeErrorResponse(error, corsHeaders, "CHECK-CREDITS");
  }
});