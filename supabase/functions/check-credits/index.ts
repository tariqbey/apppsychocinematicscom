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

    // Check if user is admin (unlimited credits)
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
        monthlyCredits: 9999,
        purchasedCredits: 9999,
        totalCredits: 9999,
        canGenerate: true
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
        })
        .select()
        .single();

      if (insertError) {
        logStep("Error creating credits", { error: insertError.message });
        throw new Error(`Failed to create credits: ${insertError.message}`);
      }
      creditsData = newCredits;
    }

    const totalCredits = parseFloat(creditsData.monthly_credits) + parseFloat(creditsData.purchased_credits);
    logStep("Credits retrieved", { 
      monthly: creditsData.monthly_credits, 
      purchased: creditsData.purchased_credits,
      total: totalCredits 
    });

    return new Response(JSON.stringify({
      isAdmin: false,
      monthlyCredits: parseFloat(creditsData.monthly_credits),
      purchasedCredits: parseFloat(creditsData.purchased_credits),
      totalCredits,
      monthlyCreditsResetAt: creditsData.monthly_credits_reset_at,
      canGenerate: totalCredits > 0
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
