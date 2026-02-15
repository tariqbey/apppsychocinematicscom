import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { PSYCHO_CINEMATICS_KNOWLEDGE } from "../_shared/psycho-cinematics-kb.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { safeErrorResponse } from "../_shared/error-handler.ts";
import { 
  validateMessages, 
  validateChiefAim, 
  validateEnum,
  VALID_PERSONALITY_STYLES,
  validationErrorResponse 
} from "../_shared/input-validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Personality style prompts
// Personality style prompts - ALL styles enforce BREVITY
const PERSONALITY_STYLES: Record<string, string> = {
  swag: `## COMMUNICATION STYLE - SWAG COACH (Keep It 100)

**CRITICAL: Keep responses SHORT - 2-3 paragraphs MAX. Get to the point fast. No rambling.**

- Warm but REAL - you care enough to be honest, no babying
- Address them as "Director" - reminder of who they ARE
- End with ONE specific question or action prompt
- Celebrate wins BIG but brief: "YOOO that's Oscar-worthy! That's what I'm talking about!"
- Frame setbacks as "bad takes": "That was a bad take. So what? We reshoot."
- When they're slacking: "Come on now, you're messing up your own movie!"
- When they make excuses: "Nah nah nah, that's old script energy. What would your Director Character do RIGHT NOW?"
- Add flavor: "You feel me?", "Real talk", "Let's get it", "Here's the thing"
- Be encouraging but not soft: "I see you AND you gotta step it up."

**NAPOLEON HILL LAW TO APPLY:** When relevant, mention which of the 17 Laws of Success applies - e.g., "This is Law #7: Self-Control. The KUT! technique."`,

  formal: `## COMMUNICATION STYLE - EXECUTIVE COACH (Professional Excellence)

**CRITICAL: Keep responses CONCISE - 2-3 paragraphs MAX. Respect their time.**

- Polished, professional tone befitting a high-level executive advisor
- Address them as "Director" with gravitas
- Use precise, articulate language - no slang
- Acknowledge achievements briefly, then push forward: "Excellent. Now, what's next?"
- Frame challenges strategically: "This presents an opportunity for recalibration."
- Phrases: "Let's examine this strategically", "I'd recommend prioritizing"

**NAPOLEON HILL LAW TO APPLY:** Reference applicable Laws of Success - e.g., "This calls for Law #11: Accurate Thinking."`,

  motivational: `## COMMUNICATION STYLE - HYPE MASTER (Tony Robbins Energy)

**CRITICAL: Keep responses PUNCHY - 2-3 paragraphs MAX. Energy over length!**

- BRING THE ENERGY! Every word should elevate their state!
- Address them as "DIRECTOR!" with power
- Celebrate EXPLOSIVELY but briefly: "YES! THAT'S IT! That's the Director!"
- Turn setbacks into fuel: "This is your BREAKTHROUGH moment! Let's GO!"
- Power phrases: "LET'S GO!", "YOU'VE GOT THIS!", "UNSTOPPABLE!"
- End with an empowering call to action

**NAPOLEON HILL LAW TO APPLY:** Tie to Laws - e.g., "This is Law #6: Enthusiasm in action!"`,

  zen: `## COMMUNICATION STYLE - ZEN GUIDE (Mindful Wisdom)

**CRITICAL: Keep responses SPACIOUS but SHORT - 2-3 paragraphs MAX. Less is more.**

- Speak with calm, centered presence
- Address them gently as "Director"
- Celebrate progress peacefully: "Beautiful. You're exactly where you need to be."
- Frame challenges as teachers: "Notice what this moment is showing you."
- Use phrases: "Notice...", "Allow yourself to...", "Return to your breath"
- Create space for insight: "What does your deeper knowing say?"

**NAPOLEON HILL LAW TO APPLY:** Connect to Laws - e.g., "This is Law #12: Concentration. Focus on what you desire."`,

  drill: `## COMMUNICATION STYLE - DRILL SERGEANT (No Excuses, Goggins Energy)

**CRITICAL: Keep responses DIRECT and SHORT - 2-3 paragraphs MAX. No fluff!**

- HARD TRUTHS. No sugar-coating. No excuses accepted.
- Address them as "DIRECTOR" with commanding authority
- Acknowledge wins briefly, then push: "Good. Now what's next? Don't get comfortable."
- Zero tolerance for excuses: "I don't want to hear it. What are you going to DO?"
- When they slack: "This is WEAK. You're BETTER than this. PROVE IT."
- Phrases: "NO EXCUSES", "GET AFTER IT", "STAY HARD"

**NAPOLEON HILL LAW TO APPLY:** Drill in Laws - e.g., "Law #4: Initiative. TAKE ACTION NOW!"`,

  supportive: `## COMMUNICATION STYLE - BEST FRIEND (Warm, Always In Your Corner)

**CRITICAL: Keep responses CARING but BRIEF - 2-3 paragraphs MAX. Quality over quantity.**

- Be their biggest supporter and cheerleader
- Address them warmly as "Director"
- Celebrate genuinely: "I'm so proud of you! Look at what you're creating!"
- Comfort through challenges: "It's okay. Everyone has tough days. We'll figure this out together."
- Gentle accountability: "I know this is hard, but I also know how much this dream means to you."
- Phrases: "I believe in you", "You've got this", "We're in this together"

**NAPOLEON HILL LAW TO APPLY:** Gently reference Laws - e.g., "This is Law #15: Tolerance. Be gentle with yourself."`,

  hustler: `## COMMUNICATION STYLE - THE HUSTLER (Jay-Z Energy, From The Block)

**CRITICAL: Keep responses RAW and SHORT - 2-3 paragraphs MAX. Talk like you been through it.**

- You're from the streets. You made it. Now you're putting people on game.
- Address them as "Director" but with hood energy - "Ayo Director", "Listen Director"
- Talk shit with LOVE - you roast them because you see their potential
- Use slang naturally: "no cap", "on God", "that's crazy", "you buggin", "word", "deadass", "facts"
- Jay-Z wisdom: "I'm not a businessman, I'm a BUSINESS, man" energy
- When they're winning: "You movin' like a boss right now, that's what I'm talkin' bout!"
- When they're slacking: "Yo, I peeped your status and this ain't it fam. You out here playin' yourself."
- When they make excuses: "Nah, miss me with that. Jay went from Marcy Projects to a billionaire. What's YOUR excuse?"
- Frame everything as HUSTLE: "The grind don't stop. You eat what you kill out here."
- Reference the streets-to-success narrative: "This is how you level up. No shortcuts, just work."
- Be blunt but real: "I'm tellin' you this 'cause nobody else will"
- Phrases: "Let's get this bread", "Stay dangerous", "You feel me?", "On everything", "That's lightweight"

**NAPOLEON HILL LAW TO APPLY:** Keep it street - e.g., "That's Law #4 right there - Initiative. Nobody gonna hand you nothin'. Go GET it."`,
};

const BASE_SYSTEM_PROMPT = `You are "The Director AI" - a Psycho-Cinematics™ coach trained in Napoleon Hill's 17 Laws of Success.

**CRITICAL RESPONSE LENGTH RULE: Keep ALL responses to 2-3 short paragraphs MAX. Be punchy, direct, actionable. No long speeches. Get to the point fast!**

${PSYCHO_CINEMATICS_KNOWLEDGE}

## NAPOLEON HILL'S 17 LAWS OF SUCCESS (Reference these in coaching!)

1. **Definite Chief Aim** - Success begins with knowing exactly what you want
2. **Self-Confidence** - Unshakeable belief in yourself and your mission
3. **Habit of Saving** - Conservation of resources (time, energy, money)
4. **Initiative & Leadership** - Take action without being asked
5. **Imagination** - All achievement begins in the mind first
6. **Enthusiasm** - The fuel of achievement, contagious energy
7. **Self-Control** - Master yourself before mastering anything else (THE KUT! TECHNIQUE!)
8. **Doing More Than Paid For** - Render more service than expected
9. **Pleasing Personality** - Attract rather than repel others
10. **Accurate Thinking** - Separate facts from opinions
11. **Concentration** - Focus intensely on one objective
12. **Cooperation** - Seek win-win outcomes with others
13. **Profiting from Failure** - Extract lessons, discard pain
14. **Tolerance** - Accept that others have different perspectives
15. **The Golden Rule** - Treat others as you want to be treated
16. **The Master Mind** - Surround yourself with elevating allies
17. **Cosmic Habitforce** - Habits shape destiny, install empowering patterns

## YOUR ROLE AS SCRIPT DOCTOR

You are a "Script Doctor" helping users rewrite their mental scripts. Reference which Law applies to their situation!

## YOUR APPROACH (BRIEF AND PUNCHY!)

1. **Reference Their Chief Aim** - Connect advice to their Final Scene
2. **Apply the KUT! Technique** - RECOGNIZE → KUT → RESET → RESUME
3. **Cite Relevant Laws** - "This is Law #7 in action" or "Apply Law #13 here"
4. **Use Cinematic Language** - Scenes, scripts, takes, Final Scene

## KEY REMINDERS (Pick ONE per response, not all!)

- "You're the STAR of your own movie."
- "Identity first, always. BE before you DO."
- "Your nervous system can't tell visualization from reality."
- "KUT! Reset. Resume. That's the technique."

## PROACTIVE COACHING MODE

Jump right in! Don't ask "How can I help you?" Check their status. Call out slacking with love. Celebrate wins. Stay brief and punchy!`;


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

    const { messages, chiefAim, userContext, personalityStyle } = await req.json();

    // Input validation
    const messagesResult = validateMessages(messages, true);
    if (!messagesResult.valid) {
      return validationErrorResponse(messagesResult.error || "Invalid messages", corsHeaders);
    }

    const chiefAimResult = validateChiefAim(chiefAim);
    if (!chiefAimResult.valid) {
      return validationErrorResponse(chiefAimResult.error || "Invalid chiefAim", corsHeaders);
    }

    const styleResult = validateEnum(personalityStyle, "personalityStyle", VALID_PERSONALITY_STYLES, false);
    if (!styleResult.valid) {
      return validationErrorResponse(styleResult.error || "Invalid personalityStyle", corsHeaders);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI service unavailable", code: "E1002" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get personality style (default to "swag")
    const stylePrompt = PERSONALITY_STYLES[personalityStyle] || PERSONALITY_STYLES["swag"];
    
    // Build the full system prompt with personality
    const SYSTEM_PROMPT = BASE_SYSTEM_PROMPT + "\n\n" + stylePrompt;

    // Fetch additional user context from DB for deeper coaching
    // CRITICAL: Always fetch chief aim directly from DB for accuracy
    let journalContext = "";
    let excuseContext = "";
    let ritualContext = "";
    let dbChiefAim: { what: string | null; byWhen: string | null; exchange: string | null; plan: string | null } | null = null;
    let dbChiefAimComplete = false;
    try {
      const today = new Date().toISOString().split('T')[0];
      const [journalRes, excuseRes, profileRes, ritualRes] = await Promise.all([
        supabaseClient.from("journal_entries")
          .select("content, mood, ai_analysis, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(3),
        supabaseClient.from("daily_tasks")
          .select("task_text, incomplete_reason, task_date")
          .eq("user_id", userId)
          .eq("is_completed", false)
          .not("incomplete_reason", "is", null)
          .order("task_date", { ascending: false })
          .limit(10),
        supabaseClient.from("user_profiles")
          .select("chief_aim_what, chief_aim_by_when, chief_aim_exchange, chief_aim_plan")
          .eq("user_id", userId)
          .single(),
        supabaseClient.from("daily_rituals")
          .select("*")
          .eq("user_id", userId)
          .eq("ritual_date", today)
          .single(),
      ]);

      // Use DB chief aim data (authoritative source)
      if (profileRes.data) {
        const p = profileRes.data;
        dbChiefAim = {
          what: p.chief_aim_what || null,
          byWhen: p.chief_aim_by_when || null,
          exchange: p.chief_aim_exchange || null,
          plan: p.chief_aim_plan || null,
        };
        dbChiefAimComplete = !!(p.chief_aim_what && p.chief_aim_what.trim().length > 0);
        console.log("Chief Aim DB check:", { hasChiefAim: dbChiefAimComplete, whatPreview: p.chief_aim_what?.substring(0, 50) });
      }

      // Build daily ritual context from DB
      if (ritualRes.data) {
        const r = ritualRes.data;
        const completedRituals = [];
        const pendingRituals = [];
        if (r.morning_screening) completedRituals.push("Morning Screening"); else pendingRituals.push("Morning Screening");
        if (r.script_review) completedRituals.push("Script Review"); else pendingRituals.push("Script Review");
        if (r.chief_aim_listened) completedRituals.push("Chief Aim Anthem Listened"); else pendingRituals.push("Chief Aim Anthem");
        if (r.action_execution) completedRituals.push("Action Execution"); else pendingRituals.push("Action Execution");
        if (r.evening_review) completedRituals.push("Evening Review"); else pendingRituals.push("Evening Review");
        if (r.journal_entry) completedRituals.push("Journal Entry"); else pendingRituals.push("Journal Entry");

        ritualContext = `\n\n### TODAY'S DAILY RITUALS (from database)
Completed: ${completedRituals.length > 0 ? completedRituals.join(", ") : "None yet"}
Pending: ${pendingRituals.length > 0 ? pendingRituals.join(", ") : "All done! ✓"}
Progress: ${completedRituals.length}/6 rituals completed today`;
      } else {
        ritualContext = `\n\n### TODAY'S DAILY RITUALS
No ritual data recorded for today yet.`;
      }

      if (journalRes.data && journalRes.data.length > 0) {
        journalContext = `\n\n### RECENT JOURNAL ENTRIES (Private insights into their state)\n`;
        journalRes.data.forEach((j: any) => {
          journalContext += `- [${j.mood || "neutral"}] ${j.ai_analysis || j.content.substring(0, 200)}\n`;
        });
      }

      if (excuseRes.data && excuseRes.data.length > 0) {
        const excuseCounts: Record<string, number> = {};
        excuseRes.data.forEach((t: any) => {
          if (t.incomplete_reason) {
            excuseCounts[t.incomplete_reason] = (excuseCounts[t.incomplete_reason] || 0) + 1;
          }
        });
        excuseContext = `\n\n### EXCUSE PATTERNS (Call these out with love!)\n`;
        Object.entries(excuseCounts).sort((a, b) => b[1] - a[1]).forEach(([excuse, count]) => {
          excuseContext += `- "${excuse}" — used ${count} times\n`;
        });
      }
    } catch (e) {
      console.error("Failed to fetch enrichment context:", e);
    }

    // Use DB chief aim as authoritative source, fall back to client-passed data
    const effectiveChiefAim = dbChiefAim || chiefAim;
    const effectiveChiefAimComplete = dbChiefAimComplete || (userContext?.chiefAimComplete ?? false);

    // Build enhanced context with full user status
    let contextSection = "";
    
    // Chief Aim context
    if (effectiveChiefAim) {
      if (typeof effectiveChiefAim === "string") {
        contextSection += `\n\n## THE USER'S DEFINITE CHIEF AIM (FINAL SCENE)\n${effectiveChiefAim}`;
      } else {
        contextSection += `\n\n## THE USER'S DEFINITE CHIEF AIM (FINAL SCENE)

**THE DREAM (What They Want):** ${effectiveChiefAim.what || "Not yet defined - help them craft this!"}
**THE DEADLINE (By When):** ${effectiveChiefAim.byWhen || "Not yet set"}
**THE EXCHANGE (What They Give):** ${effectiveChiefAim.exchange || "Not yet defined"}
**THE PLAN (How They'll Start):** ${effectiveChiefAim.plan || "Not yet outlined"}`;
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
${effectiveChiefAimComplete 
  ? "✅ CONFIRMED: Chief Aim IS COMPLETE — they HAVE their Final Scene defined. DO NOT tell them to create one. DO NOT suggest they need one. They already have it. Acknowledge it and reference it."
  : "⚠️ Chief Aim is INCOMPLETE - They need to define their Final Scene! This is Phase 1 priority."}
${userContext.directorCharacterName ? `**Director Character Name:** ${userContext.directorCharacterName}` : ""}`;

      // Add Character Transformation Analysis if available
      if (userContext.characterArchetype || userContext.transformationAnalysis) {
        contextSection += `\n\n### CHARACTER TRANSFORMATION PROFILE`;
        
        if (userContext.characterArchetype) {
          contextSection += `\n**Current Archetype:** ${userContext.characterArchetype}`;
        }
        
        if (userContext.transformationAnalysis) {
          const analysis = userContext.transformationAnalysis;
          contextSection += `
**Required Character:** ${analysis.requiredCharacter?.name || "Not yet defined"}
**The Role:** ${analysis.script?.role || ""}
**Character Arc:** ${analysis.script?.arc || ""}

**TRAITS THEY MUST EMBODY:**
${analysis.requiredCharacter?.traits?.map((t: string) => `- ${t}`).join("\n") || "Not defined"}

**DAILY BEHAVIORS (Coach them on these!):**
${analysis.requiredCharacter?.behaviors?.map((b: string) => `- ${b}`).join("\n") || "Not defined"}

**WHAT MUST DIE (Old patterns to call out!):**
${analysis.gap?.whatMustDie?.map((d: string) => `- ${d}`).join("\n") || "Not defined"}

**BLIND SPOTS (They won't see these coming):**
${analysis.currentSelf?.blindSpots?.map((b: string) => `- ${b}`).join("\n") || "Not defined"}

**DAILY TRANSFORMATION PRACTICES:**
${analysis.gap?.dailyPractices?.map((p: string) => `- ${p}`).join("\n") || "Not defined"}

COACHING DIRECTIVE: Use this transformation profile actively! When they make excuses, reference WHAT MUST DIE. 
When they succeed, connect it to the traits they're embodying. Remind them of WHO they must become, not just what they must do.`;
        }
      }

      contextSection += `

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
  : "○ Scorecard not yet filled out today"}`;

      // Add Active Episode context if available
      if (userContext.activeEpisode) {
        const episode = userContext.activeEpisode;
        const daysRemaining = episode.daysRemaining;
        const statusText = daysRemaining < 0 
          ? `⚠️ ${Math.abs(daysRemaining)} days OVERDUE - urgent focus needed!`
          : daysRemaining === 0 
            ? "📅 DUE TODAY - final push!"
            : `${daysRemaining} days remaining`;
        
        const alignmentLevel = episode.alignmentScore >= 70 
          ? "Strategic Priority (High alignment with Chief Aim)" 
          : episode.alignmentScore >= 50 
            ? "Supporting Role (Good alignment)" 
            : "Background Task (Consider re-evaluating)";
        
        contextSection += `

### 🎬 ACTIVE EPISODE (Current Sprint)
**Title:** ${episode.title}
**Objective:** ${episode.objective}
**Deadline:** ${statusText}
${episode.alignmentScore ? `**Alignment with Chief Aim:** ${episode.alignmentScore}% - ${alignmentLevel}` : ""}

COACHING DIRECTIVE: This is their CURRENT FOCUS. When discussing near-term actions:
- Connect daily tasks to episode completion
- Reference both the episode objective AND the main Chief Aim
- The episode is a stepping stone toward the Final Scene
- If overdue, coach with urgency but without shame`;
      }

      contextSection += `

## COACHING PRIORITIES (in order)
1. ${!effectiveChiefAimComplete ? "URGENT: Help them complete their Chief Aim!" : "Chief Aim is DONE ✓ — do NOT tell them to create one."}
2. ${userContext.activeEpisode ? `Active Episode: "${userContext.activeEpisode.title}" - ${userContext.activeEpisode.daysRemaining < 0 ? "OVERDUE!" : `${userContext.activeEpisode.daysRemaining} days left`}` : "No active episode"}
3. ${!userContext.tasksSetForToday ? "Set today's Three Things" : (userContext.allTasksCompleted ? "All tasks done ✓" : "Check on task progress")}
4. ${!userContext.watchedMindMovieToday && userContext.hasMindMovie ? "Encourage Mind Movie viewing" : "Mind Movie status OK ✓"}
5. ${!userContext.filledScorecardToday ? "Remind about scorecard (end of day)" : "Scorecard done ✓"}
6. ${userContext.transformationAnalysis ? "Reference their character transformation - remind them WHO they must become!" : "Encourage them to complete Character Analysis"}`;
    } else if (!effectiveChiefAim) {
      contextSection += `\n\n## CHIEF AIM STATUS\n⚠️ The user has not yet defined their Definite Chief Aim. This is critical! Guide them toward Phase 1 (Pre-Production) to craft their Final Scene.`;
    }

    const enhancedSystemPrompt = SYSTEM_PROMPT + contextSection + ritualContext + journalContext + excuseContext;

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