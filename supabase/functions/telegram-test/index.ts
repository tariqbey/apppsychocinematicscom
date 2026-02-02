import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendTelegramMessage(botToken: string, chatId: string, text: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });
    
    const data = await response.json();
    
    if (!data.ok) {
      return { success: false, error: data.description || "Failed to send message" };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Telegram send error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
}

async function setWebhook(botToken: string, userId: string): Promise<{ success: boolean; error?: string; webhookUrl?: string }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const webhookUrl = `${supabaseUrl}/functions/v1/telegram-webhook/${userId}`;
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message"],
      }),
    });
    
    const data = await response.json();
    
    if (!data.ok) {
      return { success: false, error: data.description || "Failed to set webhook" };
    }
    
    return { success: true, webhookUrl };
  } catch (error) {
    console.error("Webhook setup error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
}

async function getWebhookInfo(botToken: string): Promise<{ url?: string; pending_update_count?: number }> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const data = await response.json();
    return data.ok ? data.result : {};
  } catch {
    return {};
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

    const { action } = await req.json();

    // Get user's Telegram integration
    const { data: integration, error: intError } = await supabaseClient
      .from("user_integrations")
      .select("*")
      .eq("user_id", user.id)
      .eq("service_name", "telegram")
      .single();

    if (intError || !integration?.api_key) {
      return new Response(
        JSON.stringify({ success: false, error: "Telegram not configured. Please add your bot token first." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const settings = integration.settings as Record<string, string> | null;
    const chatId = settings?.chat_id;

    if (!chatId) {
      return new Response(
        JSON.stringify({ success: false, error: "Chat ID not configured. Please add your Telegram chat ID." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    switch (action) {
      case "test": {
        // Send test message
        const result = await sendTelegramMessage(
          integration.api_key,
          chatId,
          `🎬 *Connection Test Successful!*\n\nHey Director! Your Telegram is connected to Psycho-Cinematics™.\n\nI'll send you:\n• Daily motivation\n• Task reminders\n• Progress updates\n• Responses when you message me\n\nType /help to see available commands!`
        );

        if (result.success) {
          return new Response(
            JSON.stringify({ success: true, message: "Test message sent! Check your Telegram." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          return new Response(
            JSON.stringify({ success: false, error: result.error }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      case "setup_webhook": {
        // Set up webhook for two-way communication
        const result = await setWebhook(integration.api_key, user.id);
        
        if (result.success) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: "Two-way communication enabled! You can now chat with Director AI via Telegram.",
              webhookUrl: result.webhookUrl
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          return new Response(
            JSON.stringify({ success: false, error: result.error }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      case "status": {
        // Check webhook status
        const webhookInfo = await getWebhookInfo(integration.api_key);
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const expectedUrl = `${supabaseUrl}/functions/v1/telegram-webhook/${user.id}`;
        const isConfigured = webhookInfo.url === expectedUrl;
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            configured: isConfigured,
            webhookUrl: webhookInfo.url || null,
            pendingUpdates: webhookInfo.pending_update_count || 0,
            expectedUrl
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Telegram test error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
