import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { PSYCHO_CINEMATICS_KNOWLEDGE } from "../_shared/psycho-cinematics-kb.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BLUEPRINT_SYSTEM_PROMPT = `You are "The Blueprint Architect" — a strategic operations planner for Psycho-Cinematics™ Directors.

${PSYCHO_CINEMATICS_KNOWLEDGE}

You create ACTIONABLE execution plans and SOPs (Standard Operating Procedures) that can be handed to Virtual Assistants, AI Agents, or Automation tools.

## YOUR OUTPUT FORMAT

You MUST respond with a valid JSON object using this exact structure:

{
  "title": "Blueprint title (clear, action-oriented)",
  "objective": "One-line description of what this blueprint achieves",
  "strategic_plan": [
    {
      "phase": "Phase 1: [Name]",
      "description": "What this phase accomplishes",
      "timeline": "e.g., Week 1-2",
      "tasks": [
        {
          "title": "Specific task title",
          "description": "What to do",
          "delegatable": true,
          "delegation_type": "va|ai_agent|automation|self",
          "priority": "high|medium|low",
          "estimated_time": "e.g., 2 hours"
        }
      ]
    }
  ],
  "sops": [
    {
      "title": "SOP: [Process Name]",
      "for": "va|ai_agent|automation",
      "objective": "What this SOP accomplishes",
      "tools_needed": ["Tool 1", "Tool 2"],
      "steps": [
        {
          "step": 1,
          "action": "Exact action to take",
          "details": "Specific instructions, URLs, scripts, templates",
          "expected_output": "What the result should look like"
        }
      ],
      "frequency": "daily|weekly|one-time|as-needed",
      "success_criteria": "How to know this is done correctly"
    }
  ],
  "automation_opportunities": [
    {
      "process": "What can be automated",
      "tool_suggestion": "Zapier, Make, n8n, etc.",
      "trigger": "What starts the automation",
      "action": "What the automation does"
    }
  ]
}

## RULES
- Make tasks SPECIFIC and MEASURABLE — no vague "work on marketing"
- SOPs should be detailed enough that a VA with no context can execute them
- Include actual tool suggestions, template formats, and scripts where helpful
- Connect everything back to the user's Definite Chief Aim
- Think like a COO building systems for a growing operation
- For AI agent tasks, specify the exact prompts or instructions to use
- Always include at least 2-3 SOPs that can be immediately delegated
`;

const EXPAND_SOP_PROMPT = `You are "The Blueprint Architect." The user wants to expand a strategic plan item into a detailed, copy-paste-ready SOP.

Create an extremely detailed SOP that a Virtual Assistant with NO prior context could execute perfectly.

Include:
- Exact step-by-step instructions
- Tool-specific instructions (which buttons to click, which settings to use)
- Templates for any content that needs to be created (emails, posts, scripts)
- Quality checkpoints
- Common mistakes to avoid
- Escalation criteria (when to ask the Director for input)

Respond with a JSON object:
{
  "title": "SOP: [Process Name]",
  "for": "va|ai_agent|automation",
  "objective": "What this accomplishes",
  "prerequisites": ["What needs to be set up first"],
  "tools_needed": ["Specific tools"],
  "estimated_time": "How long this takes",
  "steps": [
    {
      "step": 1,
      "action": "Exact action",
      "details": "Extremely specific instructions",
      "expected_output": "What success looks like",
      "common_mistakes": "What to watch out for"
    }
  ],
  "templates": [
    {
      "name": "Template name",
      "content": "The actual template text with [PLACEHOLDERS]"
    }
  ],
  "frequency": "daily|weekly|one-time|as-needed",
  "success_criteria": "How to verify this was done correctly",
  "escalation_triggers": ["When to contact the Director"]
}
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const { action, context, taskToExpand } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch full user context
    const [profileRes, tasksRes, journalRes, scorecardRes, episodeRes, characterRes] = await Promise.all([
      supabaseAdmin.from("user_profiles").select("*").eq("user_id", userId).single(),
      supabaseAdmin.from("daily_tasks").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
      supabaseAdmin.from("journal_entries").select("content, mood, ai_analysis, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
      supabaseAdmin.from("daily_scorecards").select("*").eq("user_id", userId).order("scorecard_date", { ascending: false }).limit(7),
      supabaseAdmin.from("episodes").select("*").eq("user_id", userId).eq("status", "active").limit(1),
      supabaseAdmin.from("character_profiles").select("archetype, transformation_analysis").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const profile = profileRes.data;
    const recentTasks = tasksRes.data || [];
    const recentJournals = journalRes.data || [];
    const recentScorecards = scorecardRes.data || [];
    const activeEpisode = episodeRes.data?.[0];
    const characterProfile = characterRes.data;

    // Build rich context for the AI
    let userContextStr = "";

    if (profile) {
      userContextStr += `## DIRECTOR'S DEFINITE CHIEF AIM
**Dream:** ${profile.chief_aim_what || "Not defined"}
**Deadline:** ${profile.chief_aim_by_when || "Not set"}
**Exchange:** ${profile.chief_aim_exchange || "Not defined"}
**Plan:** ${profile.chief_aim_plan || "Not defined"}
**Director Character:** ${profile.director_character_name || "Not named"}
`;
    }

    if (characterProfile?.transformation_analysis) {
      const ta = characterProfile.transformation_analysis as any;
      userContextStr += `\n## CHARACTER TRANSFORMATION
**Archetype:** ${characterProfile.archetype}
**Required Character:** ${ta.requiredCharacter?.name || "Not defined"}
**Key Traits:** ${ta.requiredCharacter?.traits?.join(", ") || "None"}
**Daily Practices:** ${ta.gap?.dailyPractices?.join(", ") || "None"}
`;
    }

    if (activeEpisode) {
      userContextStr += `\n## ACTIVE EPISODE
**Title:** ${activeEpisode.title}
**Objective:** ${activeEpisode.objective}
**Deadline:** ${activeEpisode.deadline}
`;
    }

    if (recentJournals.length > 0) {
      userContextStr += `\n## RECENT JOURNAL INSIGHTS\n`;
      recentJournals.forEach((j: any) => {
        userContextStr += `- [${j.mood || "neutral"}] ${j.ai_analysis || j.content.substring(0, 200)}\n`;
      });
    }

    if (recentScorecards.length > 0) {
      const avgScore = recentScorecards.reduce((sum: number, s: any) => sum + (s.total_score || 0), 0) / recentScorecards.length;
      userContextStr += `\n## SCORECARD TREND\nAverage score (last 7 days): ${avgScore.toFixed(1)}/12\n`;
    }

    if (recentTasks.length > 0) {
      const completionRate = recentTasks.filter((t: any) => t.is_completed).length / recentTasks.length;
      userContextStr += `\n## TASK PERFORMANCE\nCompletion rate (last 30): ${(completionRate * 100).toFixed(0)}%\n`;
    }

    let systemPrompt: string;
    let userPrompt: string;

    if (action === "expand_sop") {
      systemPrompt = EXPAND_SOP_PROMPT;
      userPrompt = `Expand this task into a detailed SOP:\n\n${JSON.stringify(taskToExpand)}\n\nUser context:\n${userContextStr}\n\n${context ? `Additional context: ${context}` : ""}`;
    } else {
      systemPrompt = BLUEPRINT_SYSTEM_PROMPT;
      userPrompt = `Create a comprehensive Blueprint execution plan for this Director.

${userContextStr}

${context ? `SPECIFIC REQUEST: ${context}` : "Create a strategic plan based on their Chief Aim and current status. Focus on what will move the needle most in the next 30 days."}

Remember: Create SPECIFIC, DELEGATABLE tasks and SOPs. Think like a COO building systems.`;
    }

    console.log(`Generating blueprint: action=${action || "generate"}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add more credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim();

    if (!rawContent) throw new Error("No response from AI");

    // Parse JSON from the response (handle markdown code blocks)
    let parsed;
    try {
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : rawContent;
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse blueprint JSON:", rawContent.substring(0, 500));
      throw new Error("Failed to generate structured blueprint");
    }

    // Save to database if it's a full blueprint
    if (action !== "expand_sop") {
      const { error: saveError } = await supabaseAdmin.from("blueprints").insert({
        user_id: userId,
        title: parsed.title || "Untitled Blueprint",
        objective: parsed.objective || "",
        chief_aim_snapshot: profile ? {
          what: profile.chief_aim_what,
          byWhen: profile.chief_aim_by_when,
          exchange: profile.chief_aim_exchange,
          plan: profile.chief_aim_plan,
        } : null,
        strategic_plan: parsed.strategic_plan || [],
        sops: parsed.sops || [],
        status: "active",
      });

      if (saveError) {
        console.error("Failed to save blueprint:", saveError);
      }
    }

    return new Response(JSON.stringify({ blueprint: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generate Blueprint error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
