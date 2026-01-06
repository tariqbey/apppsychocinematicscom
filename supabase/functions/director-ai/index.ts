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
- Daily viewing of their mind movie (Phase 4) accelerates transformation`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, chiefAim } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build enhanced context with full Chief Aim breakdown
    let chiefAimContext = "";
    if (chiefAim) {
      if (typeof chiefAim === "string") {
        chiefAimContext = `\n\n## THE USER'S DEFINITE CHIEF AIM (FINAL SCENE)\n${chiefAim}`;
      } else {
        chiefAimContext = `\n\n## THE USER'S DEFINITE CHIEF AIM (FINAL SCENE)

**THE DREAM (What They Want):** ${chiefAim.what || "Not yet defined - help them craft this!"}
**THE DEADLINE (By When):** ${chiefAim.byWhen || "Not yet set"}
**THE EXCHANGE (What They Give):** ${chiefAim.exchange || "Not yet defined"}
**THE PLAN (How They'll Start):** ${chiefAim.plan || "Not yet outlined"}

${(!chiefAim.what || !chiefAim.byWhen || !chiefAim.exchange || !chiefAim.plan) 
  ? "⚠️ Their Chief Aim is incomplete. Consider guiding them to complete it - a Director needs a clear Final Scene to shoot towards." 
  : "✓ Their Chief Aim is complete. Focus on Phase 5 - helping them LIVE as their Director Character daily."}`;
      }
    } else {
      chiefAimContext = `\n\n## CHIEF AIM STATUS\n⚠️ The user has not yet defined their Definite Chief Aim. This is critical! Guide them toward Phase 1 (Pre-Production) to craft their Final Scene.`;
    }

    const enhancedSystemPrompt = SYSTEM_PROMPT + chiefAimContext;

    console.log("Director AI processing request with Psycho-Cinematics framework");

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
