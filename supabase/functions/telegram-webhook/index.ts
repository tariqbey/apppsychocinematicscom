import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
  };
}

async function sendTelegramMessage(botToken: string, chatId: string, text: string, parseMode = "Markdown"): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    });
    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    return false;
  }
}

async function getDirectorAIResponse(
  supabaseClient: any,
  userId: string,
  userMessage: string
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    return "The Director AI is currently unavailable. Please try again later.";
  }

  try {
    // Fetch user's chief aim and context
    const { data: profile } = await supabaseClient
      .from("user_profiles")
      .select("display_name, director_character_name, current_streak, best_streak, day_number")
      .eq("user_id", userId)
      .single();

    const { data: chiefAim } = await supabaseClient
      .from("mind_movie_scripts")
      .select("chief_aim_snapshot")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    const { data: tasks } = await supabaseClient
      .from("daily_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("task_date", new Date().toISOString().split("T")[0]);

    // Build context for Director AI
    const userContext = {
      timeOfDay: getTimeOfDay(),
      dayNumber: profile?.day_number || 1,
      currentStreak: profile?.current_streak || 0,
      bestStreak: profile?.best_streak || 0,
      directorCharacterName: profile?.director_character_name,
      tasksSetForToday: tasks && tasks.length > 0,
      todaysTasks: tasks || [],
      completedTasksCount: tasks?.filter((t: any) => t.is_completed).length || 0,
      allTasksCompleted: tasks?.every((t: any) => t.is_completed) || false,
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
            content: `You are "The Director AI" - a Psycho-Cinematics™ coach responding via Telegram. Keep responses SHORT (2-3 sentences max) and punchy for mobile reading.

User Context:
- Day ${userContext.dayNumber} of their journey
- Streak: ${userContext.currentStreak} days
- Tasks today: ${userContext.completedTasksCount}/${userContext.todaysTasks?.length || 0} completed
${chiefAim?.chief_aim_snapshot ? `- Chief Aim: ${JSON.stringify(chiefAim.chief_aim_snapshot)}` : "- No Chief Aim set yet"}

Be encouraging but real. Use film metaphors. End with action or question. No emojis spam.`,
          },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "I'm here, Director. What's on your mind?";
  } catch (error) {
    console.error("Director AI error:", error);
    return "Experiencing technical difficulties, Director. The show must go on - I'll be back shortly.";
  }
}

function getTimeOfDay(): string {
  const hour = new Date().getUTCHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export async function deriveWebhookSecret(userId: string): Promise<string> {
  const seed = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const data = new TextEncoder().encode(`telegram-webhook:${seed}:${userId}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function safeEqual(a: string | null, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    
    // Extract user_id from path: /telegram-webhook/{user_id}
    // The path after the function name
    const userId = pathParts[pathParts.length - 1];
    
    if (!userId || userId === "telegram-webhook") {
      return new Response(
        JSON.stringify({ error: "User ID required in webhook path" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify request is actually from Telegram via the secret_token registered with setWebhook.
    // This prevents user enumeration and unauthenticated webhook injection.
    const expectedSecret = await deriveWebhookSecret(userId);
    const providedSecret = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (!safeEqual(providedSecret, expectedSecret)) {
      console.warn("Telegram webhook secret mismatch", { userId, hasHeader: !!providedSecret });
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const update: TelegramUpdate = await req.json();
    console.log("Telegram update received:", JSON.stringify(update));

    if (!update.message?.text) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chatId = update.message.chat.id.toString();
    const userMessage = update.message.text;
    const telegramUsername = update.message.from.username || update.message.from.first_name;

    // Get user's Telegram integration to find their bot token
    const { data: integration, error: intError } = await supabaseClient
      .from("user_integrations")
      .select("*")
      .eq("user_id", userId)
      .eq("service_name", "telegram")
      .single();

    if (intError || !integration?.api_key) {
      console.error("No Telegram integration found for user:", userId);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const settings = integration.settings as Record<string, string> | null;
    const storedChatId = settings?.chat_id;

    // Verify the message is from the registered chat
    if (storedChatId && storedChatId !== chatId) {
      console.log("Chat ID mismatch, ignoring message");
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle special commands
    if (userMessage.startsWith("/")) {
      const command = userMessage.split(" ")[0].toLowerCase();
      let response = "";

      switch (command) {
        case "/start":
          response = `🎬 *Welcome, Director!*\n\nI'm your Director AI coach from Psycho-Cinematics™. I'm here to help you stay on script and make your vision a reality.\n\nJust message me anytime - ask questions, share updates, or get a motivational boost.\n\nYour Telegram is now connected! Chat ID: \`${chatId}\``;
          break;
        case "/status":
          const aiResponse = await getDirectorAIResponse(
            supabaseClient,
            userId,
            "Give me a quick status check on my progress today"
          );
          response = aiResponse;
          break;
        case "/motivate":
          const motivationResponse = await getDirectorAIResponse(
            supabaseClient,
            userId,
            "I need some motivation right now. Fire me up!"
          );
          response = motivationResponse;
          break;
        case "/tasks":
          const tasksResponse = await getDirectorAIResponse(
            supabaseClient,
            userId,
            "What are my three things for today and how am I doing on them?"
          );
          response = tasksResponse;
          break;
        case "/help":
          response = `🎬 *Director AI Commands*\n\n/status - Check your daily progress\n/motivate - Get a motivational boost\n/tasks - Review your Three Things\n/help - Show this menu\n\nOr just chat naturally - I'm here for you, Director!`;
          break;
        default:
          // Treat unknown commands as regular messages
          response = await getDirectorAIResponse(supabaseClient, userId, userMessage);
      }

      await sendTelegramMessage(integration.api_key, chatId, response);
    } else {
      // Regular message - get AI response
      const aiResponse = await getDirectorAIResponse(supabaseClient, userId, userMessage);
      await sendTelegramMessage(integration.api_key, chatId, aiResponse);
    }

    // Log the interaction
    console.log(`Telegram interaction - User: ${userId}, From: ${telegramUsername}`);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
