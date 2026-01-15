import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncPayload {
  type: "journal" | "scorecard" | "chief_aim";
  entryId?: string;
}

async function createNotionPage(token: string, databaseId: string, properties: Record<string, unknown>, content?: string): Promise<boolean> {
  try {
    const children = content ? [
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content } }],
        },
      },
    ] : [];

    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties,
        children,
      }),
    });

    const data = await response.json();
    console.log("Notion response:", data);
    return response.ok;
  } catch (error) {
    console.error("Notion API error:", error);
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

    const { type, entryId }: SyncPayload = await req.json();

    // Get Notion integration
    const { data: integrations } = await supabaseClient
      .from("user_integrations")
      .select("*")
      .eq("user_id", user.id)
      .eq("service_name", "notion")
      .single();

    if (!integrations?.api_key) {
      return new Response(
        JSON.stringify({ error: "Notion not connected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const notionToken = integrations.api_key;
    const settings = integrations.settings as Record<string, string> | null;
    const databaseId = settings?.database_id;

    if (!databaseId) {
      return new Response(
        JSON.stringify({ error: "Notion database ID not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let success = false;

    if (type === "journal" && entryId) {
      // Sync journal entry
      const { data: entry } = await supabaseClient
        .from("journal_entries")
        .select("*")
        .eq("id", entryId)
        .eq("user_id", user.id)
        .single();

      if (entry) {
        success = await createNotionPage(notionToken, databaseId, {
          Name: {
            title: [{ text: { content: entry.title || `Journal - ${new Date(entry.created_at).toLocaleDateString()}` } }],
          },
          Type: {
            select: { name: "Journal Entry" },
          },
          Mood: entry.mood ? {
            select: { name: entry.mood },
          } : undefined,
          Date: {
            date: { start: entry.created_at },
          },
          Tags: entry.tags ? {
            multi_select: entry.tags.map((tag: string) => ({ name: tag })),
          } : undefined,
          Source: {
            rich_text: [{ text: { content: "Psycho-Cinematics™" } }],
          },
        }, entry.content);
      }
    } else if (type === "scorecard") {
      // Sync today's scorecard
      const today = new Date().toISOString().split("T")[0];
      const { data: scorecard } = await supabaseClient
        .from("daily_scorecards")
        .select("*")
        .eq("user_id", user.id)
        .eq("scorecard_date", today)
        .single();

      if (scorecard) {
        const content = `
**Identity Alignment:** ${scorecard.identity_alignment}/3
**Behavior Execution:** ${scorecard.behavior_execution}/3
**Emotional Regulation:** ${scorecard.emotional_regulation}/3
**Forward Progress:** ${scorecard.forward_progress}/3

**Total Score:** ${scorecard.total_score}/12
        `.trim();

        success = await createNotionPage(notionToken, databaseId, {
          Name: {
            title: [{ text: { content: `Daily Scorecard - ${today}` } }],
          },
          Type: {
            select: { name: "Scorecard" },
          },
          Score: {
            number: scorecard.total_score,
          },
          Date: {
            date: { start: scorecard.created_at },
          },
          Source: {
            rich_text: [{ text: { content: "Psycho-Cinematics™" } }],
          },
        }, content);
      }
    } else if (type === "chief_aim") {
      // Sync Chief Aim
      const { data: profile } = await supabaseClient
        .from("user_profiles")
        .select("chief_aim_what, chief_aim_by_when, chief_aim_exchange, chief_aim_plan")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        const content = `
**THE DREAM (What I Want):**
${profile.chief_aim_what || "Not defined"}

**THE DEADLINE (By When):**
${profile.chief_aim_by_when || "Not set"}

**THE EXCHANGE (What I Will Give):**
${profile.chief_aim_exchange || "Not defined"}

**THE PLAN (How I Will Achieve It):**
${profile.chief_aim_plan || "Not outlined"}
        `.trim();

        success = await createNotionPage(notionToken, databaseId, {
          Name: {
            title: [{ text: { content: "My Definite Chief Aim" } }],
          },
          Type: {
            select: { name: "Chief Aim" },
          },
          Date: {
            date: { start: new Date().toISOString() },
          },
          Source: {
            rich_text: [{ text: { content: "Psycho-Cinematics™" } }],
          },
        }, content);
      }
    }

    return new Response(
      JSON.stringify({ success }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("notion-sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
