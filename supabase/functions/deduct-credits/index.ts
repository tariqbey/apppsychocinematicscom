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
    // Approximate cost per second of video generation
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
        costDeducted: 0,
        totalRemaining: 9999
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Calculate API cost to deduct (in dollars)
    let costToDeduct = 0;
    
    // If apiCost is provided directly, use it; otherwise calculate
    if (apiCost !== undefined && apiCost > 0) {
      costToDeduct = parseFloat(apiCost);
    } else if (mediaType === "video") {
      const durationSeconds = duration || 10;
      costToDeduct = durationSeconds * API_COSTS.video.perSecond;
    } else if (mediaType === "image") {
      const res = resolution?.toLowerCase() || "2k";
      costToDeduct = res.includes("4k") ? API_COSTS.image["4k"] : API_COSTS.image["2k"];
    } else if (mediaType === "music") {
      costToDeduct = API_COSTS.music.default;
    }

    // Round to 2 decimal places
    costToDeduct = Math.round(costToDeduct * 100) / 100;
    logStep("Cost to deduct", { costToDeduct, mediaType });

    // Get current usage/balance
    const { data: creditsData, error: creditsError } = await supabaseClient
      .from("production_credits")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!creditsData) {
      throw new Error("No credits record found. Please subscribe first.");
    }

    const monthlyAllowanceUsed = parseFloat(creditsData.monthly_allowance_used || 0);
    const monthlyAllowanceLimit = parseFloat(creditsData.monthly_allowance_limit || 10);
    const purchasedBalance = parseFloat(creditsData.purchased_credits || 0);
    
    const remainingMonthlyAllowance = Math.max(0, monthlyAllowanceLimit - monthlyAllowanceUsed);
    const totalRemaining = remainingMonthlyAllowance + purchasedBalance;

    if (totalRemaining < costToDeduct) {
      logStep("Insufficient balance", { required: costToDeduct, available: totalRemaining });
      return new Response(JSON.stringify({
        success: false,
        error: "limit_reached",
        message: "You've used your monthly allowance. Purchase more to continue generating.",
        costRequired: costToDeduct,
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

    if (remainingMonthlyAllowance >= costToDeduct) {
      // All from monthly
      deductFromMonthly = costToDeduct;
      newMonthlyAllowanceUsed = monthlyAllowanceUsed + costToDeduct;
    } else {
      // Use remaining monthly + some purchased
      deductFromMonthly = remainingMonthlyAllowance;
      deductFromPurchased = costToDeduct - remainingMonthlyAllowance;
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

    // Log the transaction
    await supabaseClient
      .from("credit_transactions")
      .insert({
        user_id: user.id,
        amount: -costToDeduct,
        api_cost_usd: costToDeduct,
        transaction_type: "generation",
        description: `${mediaType} generation`,
        media_type: mediaType,
        generation_id: generationId
      });

    const newRemainingMonthly = Math.max(0, monthlyAllowanceLimit - newMonthlyAllowanceUsed);
    const newTotalRemaining = newRemainingMonthly + newPurchasedBalance;
    const usagePercentage = (newMonthlyAllowanceUsed / monthlyAllowanceLimit) * 100;

    logStep("Usage deducted", { 
      costDeducted: costToDeduct,
      newMonthlyAllowanceUsed,
      newPurchasedBalance,
      newTotalRemaining,
      usagePercentage: usagePercentage.toFixed(1)
    });

    return new Response(JSON.stringify({
      success: true,
      isAdmin: false,
      costDeducted: costToDeduct,
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
