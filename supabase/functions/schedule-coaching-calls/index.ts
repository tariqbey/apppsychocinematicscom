import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("Checking for users due for coaching calls...");

    // Get current time
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();

    // Fetch all users with coaching calls enabled
    const { data: users, error: usersError } = await supabase
      .from("user_profiles")
      .select("user_id, phone_number, coaching_call_time, coaching_call_timezone, display_name")
      .eq("coaching_call_enabled", true)
      .not("phone_number", "is", null);

    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }

    console.log(`Found ${users?.length || 0} users with coaching calls enabled`);

    const callsInitiated: string[] = [];
    const errors: string[] = [];

    for (const user of users || []) {
      try {
        // Parse the user's preferred call time
        const [preferredHour, preferredMinute] = (user.coaching_call_time || "08:00")
          .split(":")
          .map(Number);

        // Convert user's preferred time to UTC based on their timezone
        // This is a simplified check - in production you'd want proper timezone handling
        const userTime = new Date();
        
        // For now, do a simple hour/minute check
        // In production, use a proper timezone library
        if (currentHour === preferredHour && Math.abs(currentMinute - preferredMinute) <= 5) {
          console.log(`Initiating call for user: ${user.user_id}`);

          // Check if we already called today
          const today = new Date().toISOString().split("T")[0];
          const { data: existingCall } = await supabase
            .from("coaching_call_logs")
            .select("id")
            .eq("user_id", user.user_id)
            .eq("call_date", today)
            .single();

          if (existingCall) {
            console.log(`Already called user ${user.user_id} today, skipping`);
            continue;
          }

          // Initiate the call
          const initiateResponse = await fetch(
            `${SUPABASE_URL}/functions/v1/initiate-coaching-call`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({ user_id: user.user_id }),
            }
          );

          if (initiateResponse.ok) {
            callsInitiated.push(user.user_id);
          } else {
            const errorText = await initiateResponse.text();
            errors.push(`User ${user.user_id}: ${errorText}`);
          }
        }
      } catch (userError) {
        console.error(`Error processing user ${user.user_id}:`, userError);
        errors.push(`User ${user.user_id}: ${userError instanceof Error ? userError.message : "Unknown error"}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        calls_initiated: callsInitiated.length,
        user_ids: callsInitiated,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in schedule-coaching-calls:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
