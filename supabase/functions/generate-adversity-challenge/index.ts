import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scenarioType, targetTrait, episodeContext } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are an Adversity Challenge Generator for the Psycho-Cinematics™ system.

Your job is to create REALISTIC scenario-based challenges that test and train specific character traits.

These challenges should:
1. Feel authentic and relatable to entrepreneurs/high-achievers
2. Target the specific trait mentioned
3. Create an emotional trigger that would normally cause reactive behavior
4. Be challenging but not traumatic
5. Allow the user to practice the "CUT!" technique (consciously pausing before reacting)

The goal is CHARACTER DEVELOPMENT through navigating emotional adversity with clarity and maturity.`;

    const userPrompt = `Generate an adversity challenge:

SCENARIO TYPE: ${scenarioType}
TARGET TRAIT: ${targetTrait}
${episodeContext ? `
EPISODE CONTEXT:
- Title: ${episodeContext.title}
- Objective: ${episodeContext.objective}
` : ''}

Create a realistic situation that would trigger emotional reactivity and test the target trait.

Return JSON with exactly these fields:
{
  "situation": "A detailed 2-3 sentence description of the adversity scenario",
  "trigger": "The specific emotional trigger that would cause reactive behavior (1 sentence)"
}`;

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
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    let challenge;
    try {
      challenge = JSON.parse(content);
    } catch {
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify(challenge), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
