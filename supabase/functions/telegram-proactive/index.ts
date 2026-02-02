import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProactiveMessage {
  type: "motivation" | "reminder" | "celebration" | "check_in" | "announcement";
  title: string;
  message: string;
}

async function sendTelegramMessage(botToken: string, chatId: string, text: string): Promise<boolean> {
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
    return data.ok === true;
  } catch (error) {
    console.error("Telegram send error:", error);
    return false;
  }
}

async function generateProactiveMessage(
  messageType: string,
  userContext: any
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    // Fallback messages if AI unavailable
    const fallbacks: Record<string, string> = {
      motivation: "🎬 Hey Director! Remember - you're the star of your own movie. Make today count!",
      reminder: "📋 Time to check in on your Three Things. How's the production going?",
      celebration: "🏆 You're making progress! Keep that momentum going, Director!",
      check_in: "👋 Haven't heard from you in a while. How's your movie coming along?",
      announcement: "📢 New updates in Psycho-Cinematics™! Check the app for details.",
    };
    return fallbacks[messageType] || fallbacks.motivation;
  }

  try {
    const prompts: Record<string, string> = {
      motivation: `Generate a short, punchy motivational message (2-3 sentences) for a Director who's ${userContext.daysInactive > 0 ? `been inactive for ${userContext.daysInactive} days` : 'actively working on their goals'}. 
Use film/cinema metaphors. Be encouraging but real. Current streak: ${userContext.streak} days.`,
      
      reminder: `Generate a friendly task reminder (2-3 sentences) for a Director. 
They have ${userContext.tasksPending || 0} tasks pending today. 
Use film metaphors. Be encouraging, not nagging. Make them want to take action.`,
      
      celebration: `Generate a celebration message (2-3 sentences) for a Director who just hit ${userContext.milestone || 'a milestone'}. 
Current streak: ${userContext.streak} days. Be genuinely proud but push them to keep going.`,
      
      check_in: `Generate a check-in message (2-3 sentences) for a Director who's been inactive for ${userContext.daysInactive || 'several'} days. 
Be warm and inviting, not guilt-tripping. Remind them their story isn't over.`,
      
      announcement: `Generate a brief announcement teaser (1-2 sentences) about: ${userContext.announcement || 'new features in the app'}. 
Keep it exciting but concise.`,
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are Director AI from Psycho-Cinematics™. Generate SHORT, punchy Telegram messages. No emojis spam. Use film metaphors. 2-3 sentences MAX.",
          },
          { role: "user", content: prompts[messageType] || prompts.motivation },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("AI request failed");
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "🎬 Keep directing your story, Director!";
  } catch (error) {
    console.error("AI generation error:", error);
    return "🎬 Hey Director! Your story awaits. Let's make today count!";
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

    const { userId, messageType, customMessage, announcement } = await req.json();

    // If userId provided, send to specific user; otherwise, can be used for broadcasts
    if (userId) {
      // Get user's Telegram integration
      const { data: integration, error: intError } = await supabaseClient
        .from("user_integrations")
        .select("*")
        .eq("user_id", userId)
        .eq("service_name", "telegram")
        .single();

      if (intError || !integration?.api_key) {
        return new Response(
          JSON.stringify({ success: false, error: "User has no Telegram integration" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const settings = integration.settings as Record<string, string> | null;
      const chatId = settings?.chat_id;

      if (!chatId) {
        return new Response(
          JSON.stringify({ success: false, error: "No chat ID configured" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user context for personalized messages
      const { data: profile } = await supabaseClient
        .from("user_profiles")
        .select("current_streak, last_viewing_date, day_number")
        .eq("user_id", userId)
        .single();

      const { data: tasks } = await supabaseClient
        .from("daily_tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("task_date", new Date().toISOString().split("T")[0]);

      const lastActive = profile?.last_viewing_date ? new Date(profile.last_viewing_date) : null;
      const daysInactive = lastActive 
        ? Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const userContext = {
        streak: profile?.current_streak || 0,
        daysInactive,
        tasksPending: tasks?.filter((t: any) => !t.is_completed).length || 0,
        announcement,
      };

      // Generate or use custom message
      const message = customMessage || await generateProactiveMessage(messageType || "motivation", userContext);

      const success = await sendTelegramMessage(integration.api_key, chatId, message);

      return new Response(
        JSON.stringify({ success, message: success ? "Message sent" : "Failed to send" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Broadcast mode - send to all users with Telegram configured
      // This could be used for announcements like "Director of the Month"
      const { data: integrations } = await supabaseClient
        .from("user_integrations")
        .select("*")
        .eq("service_name", "telegram")
        .not("api_key", "is", null);

      if (!integrations || integrations.length === 0) {
        return new Response(
          JSON.stringify({ success: true, sent: 0, message: "No users with Telegram configured" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let successCount = 0;
      const message = customMessage || await generateProactiveMessage(messageType || "announcement", { announcement });

      for (const integration of integrations) {
        const settings = integration.settings as Record<string, string> | null;
        const chatId = settings?.chat_id;

        if (chatId && integration.api_key) {
          const sent = await sendTelegramMessage(integration.api_key, chatId, message);
          if (sent) successCount++;
        }
      }

      return new Response(
        JSON.stringify({ success: true, sent: successCount, total: integrations.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Proactive message error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
