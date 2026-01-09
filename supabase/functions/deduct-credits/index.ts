import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DEDUCT-CREDITS] ${step}${detailsStr}`);
};

// API costs in dollars - these are the actual costs you pay per generation
const API_COSTS = {
  video: {
    perSecond: 0.10  // $0.10 per second = $1.00 for 10-second video
  },
  image: {
    "2k": 0.05,      // $0.05 per 2K image
    "4k": 0.08,      // $0.08 per 4K image
    default: 0.05
  },
  music: {
    default: 0.15    // $0.15 per song generation
  }
};

// Markup added to each generation (in dollars)
const MARKUP_DOLLARS = 0.10; // $0.10 markup per generation

// Convert dollars to credits (1 credit = $0.01)
const dollarsToCredits = (dollars: number): number => Math.round(dollars * 100);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { mediaType, duration, resolution, generationId, apiCost } = await req.json();
    logStep("Request params", { mediaType, duration, resolution, generationId, apiCost });

    if (!mediaType) throw new Error("mediaType is required");

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

    // Check if user is admin (skip deduction)
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleData) {
      logStep("Admin user - skipping deduction");
      return new Response(JSON.stringify({
        success: true,
        isAdmin: true,
        creditsDeducted: 0,
        totalRemaining: 999999
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Calculate API cost (in dollars)
    let baseCostDollars = 0;
    
    if (apiCost !== undefined && apiCost > 0) {
      baseCostDollars = parseFloat(apiCost);
    } else if (mediaType === "video") {
      const durationSeconds = duration || 10;
      baseCostDollars = durationSeconds * API_COSTS.video.perSecond;
    } else if (mediaType === "image") {
      const res = resolution?.toLowerCase() || "2k";
      baseCostDollars = res.includes("4k") ? API_COSTS.image["4k"] : API_COSTS.image["2k"];
    } else if (mediaType === "music") {
      baseCostDollars = API_COSTS.music.default;
    }

    // Add markup to get total cost in dollars
    const totalCostDollars = baseCostDollars + MARKUP_DOLLARS;
    
    // Convert to credits (1 credit = $0.01)
    const creditsToDeduct = dollarsToCredits(totalCostDollars);
    
    logStep("Cost calculation", { 
      baseCostDollars, 
      markup: MARKUP_DOLLARS,
      totalCostDollars,
      creditsToDeduct, 
      mediaType 
    });

    // Get current usage/balance
    const { data: creditsData, error: creditsError } = await supabaseClient
      .from("production_credits")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!creditsData) {
      throw new Error("No credits record found. Please subscribe first.");
    }

    // All values in CREDITS
    const monthlyAllowanceUsed = Math.round(parseFloat(creditsData.monthly_allowance_used || 0));
    const monthlyAllowanceLimit = Math.round(parseFloat(creditsData.monthly_allowance_limit || 1000));
    const purchasedBalance = Math.round(parseFloat(creditsData.purchased_credits || 0));
    
    const remainingMonthlyAllowance = Math.max(0, monthlyAllowanceLimit - monthlyAllowanceUsed);
    const totalRemaining = remainingMonthlyAllowance + purchasedBalance;

    if (totalRemaining < creditsToDeduct) {
      logStep("Insufficient credits", { required: creditsToDeduct, available: totalRemaining });
      return new Response(JSON.stringify({
        success: false,
        error: "limit_reached",
        message: "You don't have enough credits. Purchase more to continue generating.",
        creditsRequired: creditsToDeduct,
        totalRemaining,
        remainingMonthlyAllowance,
        purchasedBalance,
        usagePercentage: 100
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 402,
      });
    }

    // Deduct from monthly allowance first, then purchased balance
    let newMonthlyAllowanceUsed = monthlyAllowanceUsed;
    let newPurchasedBalance = purchasedBalance;
    let deductFromMonthly = 0;
    let deductFromPurchased = 0;

    if (remainingMonthlyAllowance >= creditsToDeduct) {
      // All from monthly
      deductFromMonthly = creditsToDeduct;
      newMonthlyAllowanceUsed = monthlyAllowanceUsed + creditsToDeduct;
    } else {
      // Use remaining monthly + some purchased
      deductFromMonthly = remainingMonthlyAllowance;
      deductFromPurchased = creditsToDeduct - remainingMonthlyAllowance;
      newMonthlyAllowanceUsed = monthlyAllowanceLimit; // Fully used
      newPurchasedBalance = purchasedBalance - deductFromPurchased;
    }

    // Update the record
    const { error: updateError } = await supabaseClient
      .from("production_credits")
      .update({
        monthly_allowance_used: newMonthlyAllowanceUsed,
        purchased_credits: newPurchasedBalance
      })
      .eq("user_id", user.id);

    if (updateError) {
      throw new Error(`Failed to update usage: ${updateError.message}`);
    }

    // Log the transaction (store both credits and dollar amounts for reference)
    await supabaseClient
      .from("credit_transactions")
      .insert({
        user_id: user.id,
        amount: -creditsToDeduct, // Negative for deductions, in credits
        api_cost_usd: totalCostDollars, // Total cost including markup
        transaction_type: "generation",
        description: `${mediaType} generation - ${creditsToDeduct} credits`,
        media_type: mediaType,
        generation_id: generationId
      });

    const newRemainingMonthly = Math.max(0, monthlyAllowanceLimit - newMonthlyAllowanceUsed);
    const newTotalRemaining = newRemainingMonthly + newPurchasedBalance;
    const usagePercentage = (newMonthlyAllowanceUsed / monthlyAllowanceLimit) * 100;

    logStep("Credits deducted", { 
      creditsDeducted: creditsToDeduct,
      newMonthlyAllowanceUsed,
      newPurchasedBalance,
      newTotalRemaining,
      usagePercentage: usagePercentage.toFixed(1)
    });

    return new Response(JSON.stringify({
      success: true,
      isAdmin: false,
      creditsDeducted: creditsToDeduct,
      monthlyAllowanceUsed: newMonthlyAllowanceUsed,
      monthlyAllowanceLimit,
      remainingMonthlyAllowance: newRemainingMonthly,
      purchasedBalance: newPurchasedBalance,
      totalRemaining: newTotalRemaining,
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
