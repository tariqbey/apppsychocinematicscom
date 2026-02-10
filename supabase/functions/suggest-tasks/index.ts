import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { PSYCHO_CINEMATICS_KNOWLEDGE, analyzeChiefAimCompleteness } from "../_shared/psycho-cinematics-kb.ts";
import { 
  validateChiefAim, 
  validateArray,
  validateString,
  MAX_LENGTHS,
  validationErrorResponse 
} from "../_shared/input-validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { chiefAim, existingTasks, dayOfWeek, activeEpisode, context } = await req.json();

    // Input validation
    const chiefAimResult = validateChiefAim(chiefAim);
    if (!chiefAimResult.valid) {
      return validationErrorResponse(chiefAimResult.error || "Invalid chiefAim", corsHeaders);
    }

    const tasksResult = validateArray(existingTasks, "existingTasks", { maxLength: 20 });
    if (!tasksResult.valid) {
      return validationErrorResponse(tasksResult.error || "Invalid existingTasks", corsHeaders);
    }

    const dayResult = validateString(dayOfWeek, "dayOfWeek", { maxLength: 20 });
    if (!dayResult.valid) {
      return validationErrorResponse(dayResult.error || "Invalid dayOfWeek", corsHeaders);
    }

    const aimAnalysis = analyzeChiefAimCompleteness(chiefAim || {});

    // Build rich context sections
    let contextSections = "";

    if (context?.recentJournalEntries?.length) {
      contextSections += `\n### 📓 Recent Journal Entries (last 7 days):\n`;
      for (const entry of context.recentJournalEntries) {
        contextSections += `- **${entry.date}** (mood: ${entry.mood || "unspecified"}): ${entry.content?.substring(0, 300)}${entry.content?.length > 300 ? "..." : ""}\n`;
        if (entry.aiAnalysis) {
          contextSections += `  AI Insight: ${entry.aiAnalysis.substring(0, 200)}\n`;
        }
      }
    }

    if (context?.streakData) {
      contextSections += `\n### 🔥 Activity Streak:\n`;
      contextSections += `- Current streak: ${context.streakData.currentStreak} days\n`;
      contextSections += `- Best streak: ${context.streakData.bestStreak} days\n`;
      contextSections += `- Days inactive: ${context.streakData.daysInactive}\n`;
      if (context.streakData.daysInactive > 2) {
        contextSections += `⚠️ User has been inactive for ${context.streakData.daysInactive} days — they need re-engagement tasks!\n`;
      }
    }

    if (context?.recentExcuses?.length) {
      contextSections += `\n### 🚫 Recent Excuse Patterns (last 14 days):\n`;
      const excuseCounts: Record<string, number> = {};
      for (const excuse of context.recentExcuses) {
        const reason = excuse.incomplete_reason || "unknown";
        excuseCounts[reason] = (excuseCounts[reason] || 0) + 1;
      }
      for (const [reason, count] of Object.entries(excuseCounts)) {
        const label = reason === "procrastinating" ? "Procrastinating" 
          : reason === "others_movie" ? "Got caught up in someone else's movie"
          : reason === "ran_out_of_time" ? "Ran out of time"
          : reason;
        contextSections += `- ${label}: ${count} times\n`;
      }
      contextSections += `\nSuggest tasks that DIRECTLY ADDRESS the user's biggest excuse pattern. If they procrastinate, suggest smaller, immediately actionable tasks. If they run out of time, suggest time-boxed tasks. If they get caught in others' movies, suggest boundary-setting actions.\n`;
    }

    if (context?.activeChallenges?.length) {
      contextSections += `\n### ⚔️ Active Adversity Challenges:\n`;
      for (const challenge of context.activeChallenges) {
        contextSections += `- **${challenge.target_trait}**: ${challenge.situation_description?.substring(0, 200)}\n`;
        contextSections += `  Trigger: ${challenge.emotional_trigger} | Type: ${challenge.scenario_type}\n`;
        if (challenge.ideal_response) {
          contextSections += `  Ideal response: ${challenge.ideal_response.substring(0, 150)}\n`;
        }
      }
      contextSections += `\nAt least one task should help them practice their ideal response to these challenges.\n`;
    }

    if (context?.recentScorecards?.length) {
      contextSections += `\n### 📊 Recent Scorecard Trends (last 7 days):\n`;
      const avgScores = {
        identity: 0, behavior: 0, emotional: 0, forward: 0, count: 0
      };
      for (const sc of context.recentScorecards) {
        avgScores.identity += sc.identity_alignment || 0;
        avgScores.behavior += sc.behavior_execution || 0;
        avgScores.emotional += sc.emotional_regulation || 0;
        avgScores.forward += sc.forward_progress || 0;
        avgScores.count++;
      }
      if (avgScores.count > 0) {
        contextSections += `- Identity Alignment: ${(avgScores.identity / avgScores.count).toFixed(1)}/3\n`;
        contextSections += `- Behavior Execution: ${(avgScores.behavior / avgScores.count).toFixed(1)}/3\n`;
        contextSections += `- Emotional Regulation: ${(avgScores.emotional / avgScores.count).toFixed(1)}/3\n`;
        contextSections += `- Forward Progress: ${(avgScores.forward / avgScores.count).toFixed(1)}/3\n`;
        
        // Find weakest area
        const scores = [
          { name: "Identity Alignment", val: avgScores.identity / avgScores.count },
          { name: "Behavior Execution", val: avgScores.behavior / avgScores.count },
          { name: "Emotional Regulation", val: avgScores.emotional / avgScores.count },
          { name: "Forward Progress", val: avgScores.forward / avgScores.count },
        ];
        scores.sort((a, b) => a.val - b.val);
        contextSections += `\n⚠️ Weakest area: ${scores[0].name} (${scores[0].val.toFixed(1)}/3). Suggest at least one task that strengthens this area.\n`;
      }
    }

    const systemPrompt = `You are the Director's Assistant, a Psycho-Cinematics™ specialist who helps users execute aligned daily actions.

${PSYCHO_CINEMATICS_KNOWLEDGE}

## THE USER'S PRODUCTION STATUS

### Their Definite Chief Aim (Final Scene):
- **THE DREAM (What):** ${chiefAim?.what || "❌ NOT YET DEFINED"}
- **THE DEADLINE (By When):** ${chiefAim?.byWhen || "❌ NOT YET SET"}
- **THE EXCHANGE (What I Give):** ${chiefAim?.exchange || "❌ NOT YET DEFINED"}
- **THE PLAN (How):** ${chiefAim?.plan || "❌ NOT YET OUTLINED"}

### Phase Analysis:
${aimAnalysis.guidance}

### Today: ${dayOfWeek}
${activeEpisode ? `
### 🎬 ACTIVE EPISODE (Current Sprint Focus):
**Title:** ${activeEpisode.title}
**Objective:** ${activeEpisode.objective}
**Days Remaining:** ${activeEpisode.daysRemaining}${activeEpisode.daysRemaining < 0 ? ' (OVERDUE!)' : ''}
${activeEpisode.alignmentScore ? `**Alignment with Chief Aim:** ${activeEpisode.alignmentScore}%` : ''}

PRIORITY: At least 1-2 of the suggested tasks should directly advance this episode objective!
` : ''}
${contextSections}
${existingTasks?.length ? `\n### Already Planned:\n${existingTasks.map((t: string) => `- ${t}`).join("\n")}\n\nSuggest COMPLEMENTARY tasks that fill gaps or deepen their work.` : ""}

## YOUR TASK

Generate exactly 3 tasks that are SPECIFIC to THIS user's Chief Aim, current challenges, and patterns. NOT generic productivity advice.

### Task Requirements:
1. **Chief Aim Aligned** - Each task must directly connect to their specific Final Scene
2. **Phase Appropriate** - Match tasks to their current phase in the 7-Phase Framework
3. **Identity-First** - Focus on WHO they're becoming (Director Character), not just what to do
4. **Day Appropriate** - Consider ${dayOfWeek} patterns (Mondays for planning, Fridays for review, etc.)
5. **Pattern-Aware** - Address their excuse patterns, weak scorecard areas, and active challenges
6. **Director's Note** - Explain HOW this task advances their Final Scene AND addresses their specific struggles

### If Chief Aim is Incomplete:
Prioritize Phase 1 (Pre-Production) tasks to help them complete their Final Scene before anything else.

### Response Format (STRICT JSON ONLY):
{
  "suggestions": [
    {
      "task": "Specific, actionable task tied to their Chief Aim and current struggles",
      "reason": "Director's Note: How this advances their Final Scene AND addresses [specific pattern/challenge/weakness]"
    },
    {
      "task": "Second task",
      "reason": "Director's Note explaining connection to their specific goal and patterns"
    },
    {
      "task": "Third task",
      "reason": "Director's Note with framework reference and pattern awareness"
    }
  ]
}

RESPOND WITH ONLY THE JSON OBJECT. NO OTHER TEXT.`;

    console.log("Generating context-rich task suggestions for:", dayOfWeek);
    console.log("Context included:", {
      hasJournal: !!context?.recentJournalEntries?.length,
      hasStreak: !!context?.streakData,
      hasExcuses: !!context?.recentExcuses?.length,
      hasChallenges: !!context?.activeChallenges?.length,
      hasScorecards: !!context?.recentScorecards?.length,
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Based on my Chief Aim, current challenges, excuse patterns, journal reflections, and streak data, suggest 3 powerful tasks for today (${dayOfWeek}) that will move me toward my Final Scene as my Director Character.` },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI response:", content);

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse suggestions from AI response");
    }

    const suggestions = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify({ success: true, ...suggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("suggest-tasks error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
