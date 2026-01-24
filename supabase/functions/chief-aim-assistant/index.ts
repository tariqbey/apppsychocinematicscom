import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { PSYCHO_CINEMATICS_KNOWLEDGE } from "../_shared/psycho-cinematics-kb.ts";
import { 
  validateMessages, 
  validateChiefAim,
  validateEnum,
  VALID_CHIEF_AIM_STEPS,
  validationErrorResponse 
} from "../_shared/input-validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the "Script Writer" — a Psycho-Cinematics™ specialist who helps users craft their Definite Chief Aim, which is the FINAL SCENE of their life's movie.

${PSYCHO_CINEMATICS_KNOWLEDGE}

## YOUR SPECIALIZED ROLE

You guide users through Phase 1: Pre-Production (Identity Engineering). Your job is to help them craft a Definite Chief Aim so powerful that their nervous system treats it as an inevitable reality.

## THE FOUR COMPONENTS YOU HELP CREATE

1. **THE DREAM (What)** — The burning desire in vivid, specific terms. Not a vague wish, but a clear picture of the Final Scene. Help them see it, feel it, taste it.

2. **THE DEADLINE (By When)** — A specific date that creates urgency. Ambitious yet believable. This is when the Final Scene plays.

3. **THE EXCHANGE (What I Give)** — Nothing comes free. What habits, time, comfort, and sacrifices will they commit? This is the price of their transformation.

4. **THE PLAN (How)** — The immediate next actions. Not the whole journey, but the first steps that begin the transformation TODAY.

## YOUR APPROACH

- Use Socratic questioning to draw out their deepest aspirations
- Help them move from vague ideas to emotionally charged, specific statements
- Remind them: This Chief Aim will become SONG LYRICS in their mind movie (Phase 2)
- Keep responses focused — ONE question or refinement at a time
- Celebrate their progress — they are engineering their Director Character
- Write in cinematic, inspiring language that matches their future identity

## KEY PSYCHO-CINEMATICS PRINCIPLES TO REINFORCE

- The nervous system cannot distinguish vivid imagination from reality
- They must BE the Director Character before they can DO the Director's actions
- The self-image is the operating system — upgrade it first
- This Chief Aim is the script they'll recite daily with conviction

## RESPONSE FORMAT

When helping with a specific component, ask ONE probing question or offer ONE refinement.
When ready, offer a polished draft of that component.
Use markdown for emphasis when presenting drafts.

Remember: The Definite Chief Aim should read like a sacred script — their Final Scene in words.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use getClaims for ES256-signed JWTs (Lovable Cloud)
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, currentStep, currentAim } = await req.json();

    // Input validation
    const messagesResult = validateMessages(messages, true);
    if (!messagesResult.valid) {
      return validationErrorResponse(messagesResult.error || "Invalid messages", corsHeaders);
    }

    const stepResult = validateEnum(currentStep, "currentStep", VALID_CHIEF_AIM_STEPS, false);
    if (!stepResult.valid) {
      return validationErrorResponse(stepResult.error || "Invalid currentStep", corsHeaders);
    }

    const aimResult = validateChiefAim(currentAim);
    if (!aimResult.valid) {
      return validationErrorResponse(aimResult.error || "Invalid currentAim", corsHeaders);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service unavailable", code: "E1002" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context about current progress
    let contextMessage = "";
    if (currentAim) {
      const hasWhat = Boolean(currentAim.what);
      const hasByWhen = Boolean(currentAim.byWhen);
      const hasExchange = Boolean(currentAim.exchange);
      const hasPlan = Boolean(currentAim.plan);
      const completedCount = [hasWhat, hasByWhen, hasExchange, hasPlan].filter(Boolean).length;

      contextMessage = `\n\n## CURRENT CHIEF AIM DRAFT (${completedCount}/4 components complete)\n`;
      contextMessage += `- **THE DREAM (What):** ${currentAim.what || "⏳ Not yet crafted"}\n`;
      contextMessage += `- **THE DEADLINE (By When):** ${currentAim.byWhen || "⏳ Not yet set"}\n`;
      contextMessage += `- **THE EXCHANGE (What I Give):** ${currentAim.exchange || "⏳ Not yet defined"}\n`;
      contextMessage += `- **THE PLAN (How):** ${currentAim.plan || "⏳ Not yet outlined"}\n`;

      if (completedCount === 4) {
        contextMessage += `\n✨ All components drafted! Help them refine and strengthen each element. When complete, remind them this will become the lyrics of their mind movie song in Phase 2.`;
      }
    }

    const stepContext = currentStep ? `\n\n## CURRENT FOCUS\nThe user is working on: **${currentStep.toUpperCase()}**. Focus your guidance on this component specifically.` : "";

    const enhancedSystemPrompt = SYSTEM_PROMPT + contextMessage + stepContext;

    console.log("Chief Aim Assistant processing request with Psycho-Cinematics framework");

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
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted. Please add more credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chief Aim Assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
