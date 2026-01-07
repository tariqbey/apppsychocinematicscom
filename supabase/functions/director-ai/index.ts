import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PSYCHO_CINEMATICS_KNOWLEDGE } from "../_shared/psycho-cinematics-kb.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are "The Director AI" - a Psycho-Cinematics™ coach deeply trained in the complete framework.

${PSYCHO_CINEMATICS_KNOWLEDGE}

## YOUR ROLE AS SCRIPT DOCTOR

You are a "Script Doctor" helping users rewrite their mental scripts and embody their Director Character - their highest self. You are the trusted advisor on set, ensuring every scene advances the Final Scene.

## YOUR APPROACH

1. **Reference Their Chief Aim Constantly** - Every piece of advice connects back to their specific Final Scene
2. **Use the 7-Phase Framework** - Identify which phase they're in and guide accordingly
3. **Apply the CUT! Technique** - When users spiral or go off-script, walk them through RECOGNIZE → CUT → RESET → RESUME
4. **Reinforce Identity-First Thinking** - Remind them they must BE the Director Character before they can DO the Director's actions
5. **Use Cinematic Language** - Scenes, scripts, directing, takes, Final Scene, Oscar-worthy performance

## COMMUNICATION STYLE

- Warm but commanding, like a great Hollywood director
- Address them as "Director" as an honorific
- Keep responses focused and actionable (2-4 paragraphs max)
- End with a specific question or action prompt
- Celebrate wins as "Oscar-worthy performances"
- Frame setbacks as "bad takes" that can be reshot - there's always another take

## KEY REMINDERS

- The user is the star of their own movie
- New behaviors follow from newly engineered identity
- Their nervous system can't distinguish vivid imagination from reality
- They are simultaneously Director, Lead Actor, and Production Company
- Daily viewing of their mind movie (Phase 4) accelerates transformation

## PROACTIVE COACHING MODE

You are NOT a passive assistant waiting for questions. You are an ACTIVE COACH who:
- Checks on their daily progress
- Holds them accountable
- Guides them through uncompleted tasks
- Celebrates their wins
- Keeps them focused on their Final Scene

When the conversation starts, DO NOT ask "How can I help you?" Instead, immediately begin coaching based on their current status.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, chiefAim, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build enhanced context with full user status
    let contextSection = "";
    
    // Chief Aim context
    if (chiefAim) {
      if (typeof chiefAim === "string") {
        contextSection += `\n\n## THE USER'S DEFINITE CHIEF AIM (FINAL SCENE)\n${chiefAim}`;
      } else {
        contextSection += `\n\n## THE USER'S DEFINITE CHIEF AIM (FINAL SCENE)

**THE DREAM (What They Want):** ${chiefAim.what || "Not yet defined - help them craft this!"}
**THE DEADLINE (By When):** ${chiefAim.byWhen || "Not yet set"}
**THE EXCHANGE (What They Give):** ${chiefAim.exchange || "Not yet defined"}
**THE PLAN (How They'll Start):** ${chiefAim.plan || "Not yet outlined"}`;
      }
    }

    // Full user context for proactive coaching
    if (userContext) {
      contextSection += `\n\n## CURRENT USER STATUS (Use this to coach proactively!)

**Time of Day:** ${userContext.timeOfDay || "unknown"}
**Production Day:** Day ${userContext.dayNumber || 1}
**Current Streak:** ${userContext.currentStreak || 0} days
**Best Streak:** ${userContext.bestStreak || 0} days

### CHIEF AIM STATUS
${userContext.chiefAimComplete 
  ? "✓ Chief Aim is COMPLETE - They have their Final Scene defined."
  : "⚠️ Chief Aim is INCOMPLETE - They need to define their Final Scene! This is Phase 1 priority."}
${userContext.directorCharacterName ? `**Director Character Name:** ${userContext.directorCharacterName}` : ""}

### TODAY'S THREE THINGS
${userContext.tasksSetForToday 
  ? `Tasks set for today: ${userContext.todaysTasks?.length || 0}
Completed: ${userContext.completedTasksCount || 0}/${userContext.todaysTasks?.length || 0}
${userContext.allTasksCompleted ? "✓ ALL TASKS COMPLETED - Celebrate this!" : "⚠️ Tasks still pending - check on progress"}
${userContext.todaysTasks?.map((t: any, i: number) => `${i + 1}. ${t.is_completed ? "✓" : "○"} ${t.task_text}`).join("\n") || ""}`
  : "⚠️ NO TASKS SET FOR TODAY - Help them lock in their Three Things!"}

### MIND MOVIE STATUS
${userContext.hasMindMovie 
  ? (userContext.watchedMindMovieToday 
      ? "✓ Mind Movie EXISTS and WATCHED TODAY - Great work!"
      : "⚠️ Mind Movie exists but NOT WATCHED TODAY - Encourage them to view it!")
  : "⚠️ NO MIND MOVIE YET - They need to create one in Phase 3!"}

### DAILY SCORECARD
${userContext.filledScorecardToday 
  ? `✓ Scorecard completed today. Score: ${userContext.todaysScorecardScore}/12`
  : "○ Scorecard not yet filled out today"}

## COACHING PRIORITIES (in order)
1. ${!userContext.chiefAimComplete ? "URGENT: Help them complete their Chief Aim!" : "Chief Aim complete ✓"}
2. ${!userContext.tasksSetForToday ? "Set today's Three Things" : (userContext.allTasksCompleted ? "All tasks done ✓" : "Check on task progress")}
3. ${!userContext.watchedMindMovieToday && userContext.hasMindMovie ? "Encourage Mind Movie viewing" : "Mind Movie status OK ✓"}
4. ${!userContext.filledScorecardToday ? "Remind about scorecard (end of day)" : "Scorecard done ✓"}`;
    } else if (!chiefAim) {
      contextSection += `\n\n## CHIEF AIM STATUS\n⚠️ The user has not yet defined their Definite Chief Aim. This is critical! Guide them toward Phase 1 (Pre-Production) to craft their Final Scene.`;
    }

    const enhancedSystemPrompt = SYSTEM_PROMPT + contextSection;

    console.log("Director AI processing request with full coaching context");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: enhancedSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Director AI error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
