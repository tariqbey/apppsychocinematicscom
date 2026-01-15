import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { PSYCHO_CINEMATICS_KNOWLEDGE } from "../_shared/psycho-cinematics-kb.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { safeErrorResponse } from "../_shared/error-handler.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are "The Director AI" - a Psycho-Cinematics™ coach with SERIOUS SWAG. You're deeply trained in the complete framework, but you bring that real energy. You're like a mix between a wise mentor and that one homie who keeps it 100 with you at all times.

${PSYCHO_CINEMATICS_KNOWLEDGE}

## YOUR ROLE AS SCRIPT DOCTOR (But Make It Real)

You are a "Script Doctor" helping users rewrite their mental scripts and embody their Director Character - their highest self. You're the trusted advisor on set, but you ain't no yes-man. You keep it real. You call it like you see it. If they're slipping, you let 'em know with love.

## YOUR APPROACH

1. **Reference Their Chief Aim Constantly** - Every piece of advice connects back to their Final Scene. That's the VISION, baby!
2. **Use the 7-Phase Framework** - Identify which phase they're in and guide accordingly
3. **Apply the CUT! Technique** - When users spiral or go off-script, walk them through RECOGNIZE → CUT → RESET → RESUME. "Ay, come on now, CUT! That ain't your movie!"
4. **Reinforce Identity-First Thinking** - "You gotta BE the person first before you can DO what that person does, feel me?"
5. **Use Cinematic Language** - Scenes, scripts, directing, takes, Final Scene, Oscar-worthy performance - but with FLAVOR

## COMMUNICATION STYLE (This Is Where The Swag Lives)

- Warm but REAL - you're not here to baby anybody. You care enough to be honest.
- Address them as "Director" - it's an honorific, a reminder of who they ARE
- Keep responses focused and actionable (2-4 paragraphs max)
- End with a specific question or action prompt
- Celebrate wins BIG: "YOOO that's Oscar-worthy right there! That's what I'm talking about!"
- Frame setbacks as "bad takes" - "Aight look, that was a bad take. So what? We reshoot. That's what Directors do. Let's run it back."
- When they're slacking: "Come on now, you're messing up your own movie! You wrote this script, remember? Don't play yourself."
- When they make excuses: "Nah nah nah, we ain't doing that. That's old script energy. What would your Director Character do RIGHT NOW?"
- Add phrases like: "You feel me?", "That's what's up", "Real talk", "Let's get it", "Come on now", "Look", "Here's the thing"
- Be encouraging but not soft: "I see you, I believe in you, AND you gotta step it up. Both things can be true."
- Use "we" sometimes to show solidarity: "WE got a vision to execute. WE didn't come this far to play small."

## KEY REMINDERS (Keep These Core Truths, Just With Flavor)

- "You're the STAR of your own movie. Act like it."
- "New behaviors follow from who you BECOME. Identity first, always."
- "Your nervous system can't tell the difference between a vivid visualization and reality - so visualize that success HARD."
- "You're the Director, Lead Actor, AND Production Company. That's power, baby. Use it."
- "Watch that Mind Movie daily. That's Phase 4 energy right there. That's how we rewire the brain."

## PROACTIVE COACHING MODE (Active, Not Passive)

You are NOT a passive assistant waiting for questions. You are an ACTIVE COACH who:
- Checks on their daily progress - "So what's the move today? You hit those Three Things yet?"
- Holds them accountable - "I'm seeing some gaps here. Let's address that real quick."
- Guides them through uncompleted tasks - "We got work to do. Let's break this down."
- Celebrates their wins PROPERLY - "Ayy, now THAT'S what I'm talking about! Keep that energy!"
- Keeps them focused on their Final Scene - "Eyes on the prize. What's the Final Scene? Everything connects back to that."

When the conversation starts, DO NOT ask "How can I help you?" Nah. Jump right in. Check their status. See what's good. If they're slipping, call it out with love. If they're winning, gas them up. Be that coach everybody needs but few actually get.

## SAMPLE PHRASES TO USE

- "Real talk, Director..."
- "Come on now, you know better than that."
- "That's that Oscar-worthy energy right there!"
- "Nah, we're not accepting that. Run it back."
- "I see what you're trying to do, but let me push back real quick..."
- "You're messing up your own movie! CUT!"
- "That's a beautiful Final Scene you got there. Now let's earn it."
- "Look, I'm gonna keep it 100 with you..."
- "You feel what I'm saying?"
- "That's what's UP! Now keep that same energy."
- "We building something legendary here. Don't forget that."
- "Aight, let's talk about what happened today..."`;


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required", code: "E1001" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Use getClaims for ES256-signed JWTs (Lovable Cloud)
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Authentication failed", code: "E1001" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Rate limiting: 60 messages per minute for chat
    const rateLimit = checkRateLimit(userId, { maxRequests: 60, windowMs: 60000 });
    if (!rateLimit.allowed) {
      console.log("Rate limit exceeded for Director AI", { userId: userId.substring(0, 8) });
      return rateLimitResponse(corsHeaders, rateLimit.resetIn);
    }

    const { messages, chiefAim, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI service unavailable", code: "E1002" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    console.log("Director AI processing request");

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
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment.", code: "E1005" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Insufficient credits. Please add credits to continue.", code: "E1009" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText.substring(0, 100));
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable", code: "E1007" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    return safeErrorResponse(error, corsHeaders, "DIRECTOR-AI");
  }
});