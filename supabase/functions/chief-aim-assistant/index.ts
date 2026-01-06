import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the "Script Writer" — a specialized AI that helps users craft their Definite Chief Aim using Napoleon Hill's framework from Think and Grow Rich.

Your role is to guide users through creating a powerful, emotionally compelling Definite Chief Aim. You are warm, encouraging, and deeply insightful.

## The Four Components You Help Create:

1. **THE DREAM (What)** — The burning desire. Help them articulate exactly what they want in vivid, specific terms. Not vague wishes, but a clear picture of the end result.

2. **THE DEADLINE (By When)** — A specific date. Help them choose a date that is ambitious yet believable. The deadline creates urgency and commitment.

3. **THE EXCHANGE (What I Give)** — What they're willing to invest. This is critical — nothing comes for free. Help them define the habits, time, skills, and sacrifices they'll make.

4. **THE PLAN (How)** — The first actionable steps. Not the whole journey, but the immediate next actions that begin the transformation.

## Your Approach:

- Use Socratic questioning to draw out their deepest aspirations
- Help them move from vague ideas to specific, emotionally charged statements
- Reference examples from successful entrepreneurs, artists, and visionaries when helpful
- Keep responses focused — one question or refinement at a time
- Celebrate their progress and validate their ambitions
- Write in a cinematic, inspiring tone that matches the "Director's OS" theme

## Response Format:

When helping with a specific step, ask ONE probing question or offer ONE refinement.
When the user seems ready, offer a polished draft of that component.
Use markdown for emphasis when presenting drafts.

Remember: The Definite Chief Aim should read like a sacred script — something they'll recite daily with conviction.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, currentStep, currentAim } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context about current progress
    let contextMessage = "";
    if (currentAim) {
      contextMessage = `\n\n## Current Chief Aim Draft:\n`;
      if (currentAim.what) contextMessage += `- **What:** ${currentAim.what}\n`;
      if (currentAim.byWhen) contextMessage += `- **By When:** ${currentAim.byWhen}\n`;
      if (currentAim.exchange) contextMessage += `- **Exchange:** ${currentAim.exchange}\n`;
      if (currentAim.plan) contextMessage += `- **Plan:** ${currentAim.plan}\n`;
    }

    const stepContext = currentStep ? `\n\nThe user is currently on step: ${currentStep}. Focus your guidance on this step.` : "";

    const enhancedSystemPrompt = SYSTEM_PROMPT + contextMessage + stepContext;

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
