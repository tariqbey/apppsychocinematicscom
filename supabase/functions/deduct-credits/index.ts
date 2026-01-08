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

// Credit costs based on the pricing model
const CREDIT_COSTS = {
  // Video: 10-second = 1 credit, 15-second = 1.5 credits
  video: {
    base: 1, // per 10 seconds
    perSecond: 0.1
  },
  // Images: 2K = 0.18, 4K = 0.24
  image: {
    "2k": 0.18,
    "4k": 0.24,
    default: 0.18
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { mediaType, duration, resolution, generationId } = await req.json();
    logStep("Request params", { mediaType, duration, resolution, generationId });

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
        remainingCredits: 9999
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Calculate credits to deduct
    let creditsToDeduct = 0;
    if (mediaType === "video") {
      // Video: 1 credit per 10 seconds
      const durationSeconds = duration || 10;
      creditsToDeduct = (durationSeconds / 10) * CREDIT_COSTS.video.base;
    } else if (mediaType === "image") {
      // Image: 0.18 for 2K, 0.24 for 4K
      const res = resolution?.toLowerCase() || "2k";
      creditsToDeduct = res.includes("4k") ? CREDIT_COSTS.image["4k"] : CREDIT_COSTS.image["2k"];
    }

    logStep("Credits to deduct", { creditsToDeduct });

    // Get current credits
    const { data: creditsData, error: creditsError } = await supabaseClient
      .from("production_credits")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!creditsData) {
      throw new Error("No credits record found. Please subscribe first.");
    }

    const monthlyCredits = parseFloat(creditsData.monthly_credits);
    const purchasedCredits = parseFloat(creditsData.purchased_credits);
    const totalCredits = monthlyCredits + purchasedCredits;

    if (totalCredits < creditsToDeduct) {
      logStep("Insufficient credits", { required: creditsToDeduct, available: totalCredits });
      return new Response(JSON.stringify({
        success: false,
        error: "Insufficient credits",
        creditsRequired: creditsToDeduct,
        creditsAvailable: totalCredits
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 402,
      });
    }

    // Deduct from monthly first, then purchased
    let newMonthlyCredits = monthlyCredits;
    let newPurchasedCredits = purchasedCredits;
    let remainingDeduction = creditsToDeduct;

    if (monthlyCredits >= remainingDeduction) {
      newMonthlyCredits = monthlyCredits - remainingDeduction;
      remainingDeduction = 0;
    } else {
      remainingDeduction -= monthlyCredits;
      newMonthlyCredits = 0;
      newPurchasedCredits = purchasedCredits - remainingDeduction;
    }

    // Update credits
    const { error: updateError } = await supabaseClient
      .from("production_credits")
      .update({
        monthly_credits: newMonthlyCredits,
        purchased_credits: newPurchasedCredits
      })
      .eq("user_id", user.id);

    if (updateError) {
      throw new Error(`Failed to update credits: ${updateError.message}`);
    }

    // Log the transaction
    await supabaseClient
      .from("credit_transactions")
      .insert({
        user_id: user.id,
        amount: -creditsToDeduct,
        transaction_type: "generation",
        description: `${mediaType} generation`,
        media_type: mediaType,
        generation_id: generationId
      });

    const remainingCredits = newMonthlyCredits + newPurchasedCredits;
    logStep("Credits deducted", { 
      deducted: creditsToDeduct, 
      remaining: remainingCredits 
    });

    return new Response(JSON.stringify({
      success: true,
      isAdmin: false,
      creditsDeducted: creditsToDeduct,
      remainingCredits,
      monthlyCredits: newMonthlyCredits,
      purchasedCredits: newPurchasedCredits
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
