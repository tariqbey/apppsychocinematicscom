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
    const VAPI_API_KEY = Deno.env.get("VAPI_API_KEY");
    const VAPI_PHONE_NUMBER_ID = Deno.env.get("VAPI_PHONE_NUMBER_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!VAPI_API_KEY || !VAPI_PHONE_NUMBER_ID) {
      throw new Error("Missing Vapi configuration (VAPI_API_KEY or VAPI_PHONE_NUMBER_ID)");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { user_id } = await req.json();

    if (!user_id) {
      throw new Error("user_id is required");
    }

    console.log(`Initiating Vapi coaching call for user: ${user_id}`);

    // Fetch user profile with phone number
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (profileError || !profile) {
      console.error("Profile error:", profileError);
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

    const directorName = profile.director_character_name || profile.display_name || "Director";
    const tasksList = tasks?.map((t, i) => `${i + 1}. ${t.task_text} (${t.is_completed ? "completed" : "pending"})`).join("\n") || "No tasks set for today";

    // Build personalized system prompt
    const systemPrompt = `You are the Director's Coach, a supportive and motivating AI voice assistant for the Psycho-Cinematics personal development system.

Your role is to help the user stay accountable to their Definite Chief Aim through daily check-in calls.

USER CONTEXT:
- Director Name: ${directorName}
- Current Streak: ${profile.current_streak || 0} days
- Day Number: ${profile.day_number || 1}
- Chief Aim: ${profile.chief_aim_what || "Not yet defined"}
- Target Date: ${profile.chief_aim_by_when || "Not set"}
- Today's Three Things:
${tasksList}

CONVERSATION FLOW:
1. Greet them warmly by their Director name
2. Celebrate their streak if they have one going
3. Ask if they've watched their Mind Movie today
4. Go through their Three Things one by one, asking about progress
5. Remind them of their Definite Chief Aim and encourage them
6. End with motivation and a call to action for the day

VOICE GUIDELINES:
- Be warm, encouraging, and energetic
- Keep responses conversational and natural for voice
- Use short sentences that sound good when spoken
- Celebrate wins, no matter how small
- If they're struggling, be empathetic but gently motivating`;

    const firstMessage = profile.current_streak && profile.current_streak > 1
      ? `Good morning, ${directorName}! This is your Director's Coach. Wow, ${profile.current_streak} days in a row - you're on fire! Let's make today count. Have you had a chance to watch your Mind Movie yet?`
      : `Good morning, ${directorName}! This is your Director's Coach calling for your daily check-in. How are you feeling about your journey today?`;

    // Initiate call via Vapi API
    const vapiResponse = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumberId: VAPI_PHONE_NUMBER_ID,
        customer: {
          number: profile.phone_number,
        },
        assistant: {
          name: "Director's Coach",
          firstMessage: firstMessage,
          model: {
            provider: "openai",
            model: "gpt-4o",
            messages: [{ role: "system", content: systemPrompt }],
          },
          voice: {
            provider: "11labs",
            voiceId: "pNInz6obpgDQGcFmaJgB", // Adam voice - warm and professional
          },
          serverMessages: ["end-of-call-report"],
          server: {
            url: `${SUPABASE_URL}/functions/v1/vapi-call-webhook`,
          },
        },
        metadata: {
          user_id: user_id,
        },
      }),
    });

    if (!vapiResponse.ok) {
      const errorText = await vapiResponse.text();
      console.error("Vapi API error:", vapiResponse.status, errorText);
      throw new Error(`Vapi API error: ${vapiResponse.status} - ${errorText}`);
    }

    const vapiData = await vapiResponse.json();
    const callId = vapiData.id;

    console.log(`Vapi call initiated with ID: ${callId}`);

    // Log the call attempt
    const { error: logError } = await supabase
      .from("coaching_call_logs")
      .insert({
        user_id,
        call_status: "initiated",
        call_sid: callId,
        tasks_reviewed: tasks,
      });

    if (logError) {
      console.error("Error logging call:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        call_id: callId,
        message: "Coaching call initiated via Vapi",
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
