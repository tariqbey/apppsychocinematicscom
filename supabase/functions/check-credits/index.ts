import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-CREDITS] ${step}${detailsStr}`);
};

// Default monthly allowance limit in dollars
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
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

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
        monthlyAllowanceLimit: 9999,
        remainingMonthlyAllowance: 9999,
        purchasedBalance: 9999,
        totalRemaining: 9999,
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
          monthly_allowance_limit: MONTHLY_ALLOWANCE_LIMIT,
          monthly_allowance_used: 0
        })
        .select()
        .single();

      if (insertError) {
        logStep("Error creating credits", { error: insertError.message });
        throw new Error(`Failed to create credits: ${insertError.message}`);
      }
      creditsData = newCredits;
    }

    const monthlyAllowanceUsed = parseFloat(creditsData.monthly_allowance_used || 0);
    const monthlyAllowanceLimit = parseFloat(creditsData.monthly_allowance_limit || MONTHLY_ALLOWANCE_LIMIT);
    const purchasedBalance = parseFloat(creditsData.purchased_credits || 0);
    const remainingMonthlyAllowance = Math.max(0, monthlyAllowanceLimit - monthlyAllowanceUsed);
    const totalRemaining = remainingMonthlyAllowance + purchasedBalance;
    const usagePercentage = monthlyAllowanceLimit > 0 ? (monthlyAllowanceUsed / monthlyAllowanceLimit) * 100 : 0;

    logStep("Usage retrieved", { 
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
      canGenerate: totalRemaining > 0.01, // Need at least $0.01
      usagePercentage: Math.min(100, usagePercentage)
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
