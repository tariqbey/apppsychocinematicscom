import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  userId: string;
  channel: "slack" | "telegram" | "all";
  type: "journal_reminder" | "morning_ritual" | "evening_scorecard" | "achievement" | "custom";
  title: string;
  message: string;
}

async function sendSlackNotification(botToken: string, channelId: string, title: string, message: string): Promise<boolean> {
  try {
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: channelId,
        text: `*${title}*\n${message}\n\n_Posted from Psycho-Cinematics™_`,
        mrkdwn: true,
      }),
    });

    const data = await response.json();
    console.log("Slack response:", data);
    return data.ok === true;
  } catch (error) {
    console.error("Slack notification error:", error);
    return false;
  }
}

async function sendTelegramNotification(botToken: string, chatId: string, title: string, message: string): Promise<boolean> {
  try {
    const text = `*${title}*\n\n${message}\n\n_Posted from Psycho-Cinematics™_`;
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown",
      }),
    });

    const data = await response.json();
    console.log("Telegram response:", data);
    return data.ok === true;
  } catch (error) {
    console.error("Telegram notification error:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { channel, type, title, message }: NotificationPayload = await req.json();

    // Get user's integration settings
    const { data: integrations, error: intError } = await supabaseClient
      .from("user_integrations")
      .select("*")
      .eq("user_id", user.id);

    if (intError) {
      throw new Error("Failed to fetch integrations");
    }

    const results: { slack?: boolean; telegram?: boolean } = {};

    // Send Slack notification
    if (channel === "slack" || channel === "all") {
      const slackIntegration = integrations?.find(i => i.service_name === "slack");
      if (slackIntegration?.api_key) {
        const settings = slackIntegration.settings as Record<string, string> | null;
        const channelId = settings?.channel_id || "";
        if (channelId) {
          results.slack = await sendSlackNotification(slackIntegration.api_key, channelId, title, message);
        } else {
          console.log("Slack channel_id not configured");
          results.slack = false;
        }
      }
    }

    // Send Telegram notification
    if (channel === "telegram" || channel === "all") {
      const telegramIntegration = integrations?.find(i => i.service_name === "telegram");
      if (telegramIntegration?.api_key) {
        const settings = telegramIntegration.settings as Record<string, string> | null;
        const chatId = settings?.chat_id || "";
        if (chatId) {
          results.telegram = await sendTelegramNotification(telegramIntegration.api_key, chatId, title, message);
        } else {
          console.log("Telegram chat_id not configured");
          results.telegram = false;
        }
      }
    }

    console.log("Notification results:", results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-notification error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
