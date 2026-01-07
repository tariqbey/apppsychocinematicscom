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
    const TELNYX_API_KEY = Deno.env.get("TELNYX_API_KEY");
    const TELNYX_PHONE_NUMBER = Deno.env.get("TELNYX_PHONE_NUMBER");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!TELNYX_API_KEY || !TELNYX_PHONE_NUMBER) {
      throw new Error("Missing Telnyx configuration");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { user_id } = await req.json();

    if (!user_id) {
      throw new Error("user_id is required");
    }

    console.log(`Initiating coaching call for user: ${user_id}`);

    // Fetch user profile with phone number
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (profileError || !profile) {
      throw new Error("User profile not found");
    }

    if (!profile.phone_number) {
      throw new Error("User has no phone number configured");
    }

    // Fetch today's tasks
    const today = new Date().toISOString().split("T")[0];
    const { data: tasks } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("user_id", user_id)
      .eq("task_date", today);

    // Build context for the call
    const callContext = {
      user_id,
      director_name: profile.director_character_name || profile.display_name || "Director",
      chief_aim: {
        what: profile.chief_aim_what,
        by_when: profile.chief_aim_by_when,
        exchange: profile.chief_aim_exchange,
        plan: profile.chief_aim_plan,
      },
      tasks: tasks || [],
      current_streak: profile.current_streak || 0,
      day_number: profile.day_number || 1,
    };

    // Get the webhook URL for the streaming bridge
    const webhookUrl = `${SUPABASE_URL}/functions/v1/coaching-call-bridge`;

    // Initiate call via Telnyx Call Control API
    const telnyxResponse = await fetch("https://api.telnyx.com/v2/calls", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TELNYX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        connection_id: "your-connection-id", // This needs to be set up in Telnyx portal
        to: profile.phone_number,
        from: TELNYX_PHONE_NUMBER,
        webhook_url: webhookUrl,
        webhook_url_method: "POST",
        stream_url: webhookUrl.replace("https://", "wss://"),
        stream_track: "both_tracks",
        client_state: btoa(JSON.stringify(callContext)),
        answering_machine_detection: "detect",
        record: "record-from-answer",
      }),
    });

    if (!telnyxResponse.ok) {
      const errorText = await telnyxResponse.text();
      console.error("Telnyx API error:", errorText);
      throw new Error(`Telnyx API error: ${telnyxResponse.status}`);
    }

    const telnyxData = await telnyxResponse.json();
    const callSid = telnyxData.data?.call_control_id;

    console.log(`Call initiated with SID: ${callSid}`);

    // Log the call attempt
    const { error: logError } = await supabase
      .from("coaching_call_logs")
      .insert({
        user_id,
        call_status: "initiated",
        call_sid: callSid,
        tasks_reviewed: tasks,
      });

    if (logError) {
      console.error("Error logging call:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        call_sid: callSid,
        message: "Coaching call initiated",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error initiating coaching call:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
