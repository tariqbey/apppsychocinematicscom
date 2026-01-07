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

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const body = await req.json();
    console.log("Vapi webhook received:", JSON.stringify(body, null, 2));

    const messageType = body.message?.type;

    if (messageType === "end-of-call-report") {
      const call = body.message?.call;
      const callId = call?.id;
      const userId = call?.metadata?.user_id;
      const summary = body.message?.summary;
      const transcript = body.message?.transcript;
      const durationSeconds = call?.endedAt && call?.startedAt
        ? Math.round((new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000)
        : null;

      console.log(`End of call report for call ${callId}, user ${userId}`);
      console.log(`Duration: ${durationSeconds}s`);
      console.log(`Summary: ${summary}`);

      if (callId) {
        // Update the call log with completion data
        const { error: updateError } = await supabase
          .from("coaching_call_logs")
          .update({
            call_status: "completed",
            duration_seconds: durationSeconds,
            conversation_summary: summary || transcript?.slice(0, 2000) || "Call completed",
            updated_at: new Date().toISOString(),
          })
          .eq("call_sid", callId);

        if (updateError) {
          console.error("Error updating call log:", updateError);
        } else {
          console.log(`Call log updated for call ${callId}`);
        }
      }
    } else if (messageType === "status-update") {
      const call = body.message?.call;
      const callId = call?.id;
      const status = body.message?.status;

      console.log(`Status update for call ${callId}: ${status}`);

      if (callId && status) {
        const { error: updateError } = await supabase
          .from("coaching_call_logs")
          .update({
            call_status: status,
            updated_at: new Date().toISOString(),
          })
          .eq("call_sid", callId);

        if (updateError) {
          console.error("Error updating call status:", updateError);
        }
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
