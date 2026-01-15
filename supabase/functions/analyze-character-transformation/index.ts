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
    const { archetype, archetypeScores, chiefAim, userName } = await req.json();

    // Build the prompt for character transformation analysis
    const prompt = `You are a direct, no-BS character transformation coach based on the Psycho-Cinematics™ methodology. 

The user "${userName || "Director"}" has completed a character assessment. Their primary archetype is "${archetype.name}".

ARCHETYPE PROFILE:
- Strengths: ${archetype.strengths.join(", ")}
- Weaknesses: ${archetype.weaknesses.join(", ")}
- Light Expression: ${archetype.lightShadow.light}
- Shadow Expression: ${archetype.lightShadow.shadow}
- Core Story Fuel: ${archetype.storyFuel}
- Conflict Pattern: ${archetype.conflictPattern}

THEIR DEFINITE CHIEF AIM (Final Scene):
What: ${chiefAim.what}
By When: ${chiefAim.byWhen || "Not specified"}
What They'll Exchange: ${chiefAim.exchange || "Not specified"}
Their Plan: ${chiefAim.plan || "Not specified"}

Based on WHO THEY ARE NOW (their archetype) and WHAT THEY WANT TO ACHIEVE (their Chief Aim), analyze the CHARACTER TRANSFORMATION required.

Be direct. Be specific. No generic self-help fluff. Think like a casting director telling an actor exactly who they need to become for the role.

Return a JSON object with this exact structure:
{
  "analysis": {
    "currentSelf": {
      "archetype": "${archetype.name}",
      "strengths": ["3 specific strengths that WILL help them achieve their Chief Aim"],
      "liabilities": ["3 specific traits from their archetype that WILL sabotage their goal if not addressed"],
      "blindSpots": ["2-3 things they won't see coming based on their archetype's shadow side"]
    },
    "requiredCharacter": {
      "name": "A specific character name/title they must embody (e.g., 'The Relentless Closer', 'The Patient Builder')",
      "traits": ["5-6 specific character traits they MUST develop"],
      "behaviors": ["4-5 specific daily behaviors that this character would exhibit"],
      "mindset": "A one-paragraph description of how this character thinks and approaches challenges"
    },
    "gap": {
      "whatMustDie": ["3-4 specific habits, beliefs, or patterns that MUST be eliminated"],
      "whatMustEmerge": ["3-4 specific new ways of being that MUST emerge"],
      "dailyPractices": ["3-4 specific practices to close the gap between who they are and who they must become"]
    },
    "script": {
      "role": "A one-sentence description of the role they're auditioning for",
      "motivation": "What drives this character - their core motivation",
      "arc": "The transformation arc from their current archetype to the required character"
    }
  }
}

IMPORTANT RULES:
1. Be specific to THEIR archetype and THEIR Chief Aim - not generic advice
2. Name specific behaviors, not vague concepts
3. The "whatMustDie" should include shadow aspects of their current archetype
4. The required character should bridge their natural strengths to what their goal demands
5. Daily practices should be concrete and actionable
6. The character name should be memorable and specific to their journey`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a character transformation analyst for the Psycho-Cinematics™ Director's OS. You speak directly and without filler. Your job is to help users understand exactly who they must become to achieve their goals. You return only valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      throw new Error("Failed to generate transformation analysis");
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in analyze-character-transformation:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});