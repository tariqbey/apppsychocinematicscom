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
  console.log(`[DEDUCT-CREDITS] ${step}${detailsStr}`);
};

// API costs in dollars - actual costs you pay per generation
const API_COSTS = {
  video: {
    perSecond: 0.10  // $0.10 per second
  },
  image: {
    "2k": 0.05,      // $0.05 per 2K image
    "4k": 0.08,      // $0.08 per 4K image
    default: 0.05
  },
  music: {
    default: 0.15    // $0.15 per song generation
  },
  tts: {
    default: 0.03    // $0.03 per TTS request
  },
  voiceChange: {
    default: 0.08    // $0.08 per voice change
  },
  ai: {
    default: 0.02    // $0.02 per AI chat/suggestion
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

    if (!mediaType) {
      return new Response(JSON.stringify({ error: "Media type is required", code: "E1004" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Rate limiting: 30 requests per minute for deductions (expensive operations)
    const rateLimit = checkRateLimit(user.id, { maxRequests: 30, windowMs: 60000 });
    if (!rateLimit.allowed) {
      logStep("Rate limit exceeded", { userId: user.id });
      return rateLimitResponse(corsHeaders, rateLimit.resetIn);
    }

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
    } else if (mediaType === "tts") {
      baseCostDollars = API_COSTS.tts.default;
    } else if (mediaType === "voiceChange") {
      baseCostDollars = API_COSTS.voiceChange.default;
    } else if (mediaType === "ai") {
      baseCostDollars = API_COSTS.ai.default;
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
      return new Response(JSON.stringify({ error: "No credits available. Please subscribe first.", code: "E1009" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
        error: "Insufficient credits",
        code: "E1009",
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
      logStep("Update error", { error: updateError.message });
      return new Response(JSON.stringify({ error: "Unable to process credit deduction", code: "E1003" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
    return safeErrorResponse(error, corsHeaders, "DEDUCT-CREDITS");
  }
});