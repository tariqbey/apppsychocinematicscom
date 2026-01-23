import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SUCCESS_PRINCIPLES_KB, generateVisualizationPrompt } from "../_shared/success-principles-kb.ts";
import { CINEMATOGRAPHY_TECHNIQUES, NLP_AFFIRMATION_PATTERNS, getCinematographyForScene } from "../_shared/cinematography-nlp-kb.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scenarioType, targetTrait, episodeContext, generateVisualization = false, referencePhotoUrl } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Get ideal response patterns from knowledge base
    const { response: idealResponse, affirmation } = SUCCESS_PRINCIPLES_KB.getIdealResponse(scenarioType, targetTrait);

    // Get cinematography guidance for adversity scenes
    const adversityCinematography = getCinematographyForScene("challenge", "intense", 2);
    const victoryCinematography = getCinematographyForScene("achievement", "triumphant", 3);

    const systemPrompt = `You are an Adversity Challenge Generator for the Psycho-Cinematics™ system.

Your job is to create REALISTIC scenario-based challenges that test and train specific character traits.

These challenges should:
1. Feel authentic and relatable to entrepreneurs/high-achievers
2. Target the specific trait mentioned
3. Create an emotional trigger that would normally cause reactive behavior
4. Be challenging but not traumatic
5. Allow the user to practice the "CUT!" technique (consciously pausing before reacting)

IMPORTANT: You have access to Napoleon Hill's 17 Laws of Success principles and professional cinematography techniques. Use these to inform the challenge design:
- The challenge should test one of Hill's principles
- The ideal response should embody that principle
- The situation should create a clear "choice point" between old reactive patterns and transformed behavior

CINEMATOGRAPHY TECHNIQUES FOR VISUALIZATION:
${JSON.stringify(adversityCinematography, null, 2)}

NLP PATTERNS TO USE:
- Presupposition: "${NLP_AFFIRMATION_PATTERNS.patterns.presupposition.examples[0]}"
- Embedded Command: "${NLP_AFFIRMATION_PATTERNS.patterns.embeddedCommand.examples[0]}"
- Identity Statement: "${NLP_AFFIRMATION_PATTERNS.patterns.identityStatements.examples[0]}"

The goal is CHARACTER DEVELOPMENT through navigating emotional adversity with clarity and maturity.`;

    const userPrompt = `Generate an adversity challenge:

SCENARIO TYPE: ${scenarioType}
TARGET TRAIT: ${targetTrait}
${referencePhotoUrl ? `REFERENCE PHOTO: User has uploaded a reference photo for personalized visualizations` : ''}
${episodeContext ? `
EPISODE CONTEXT:
- Title: ${episodeContext.title}
- Objective: ${episodeContext.objective}
` : ''}

Create a realistic situation that would trigger emotional reactivity and test the target trait.

IDEAL RESPONSE PATTERN (from Napoleon Hill's Laws of Success):
${idealResponse}

AFFIRMATION:
${affirmation}

Return JSON with these fields:
{
  "situation": "A detailed 2-3 sentence description of the adversity scenario",
  "trigger": "The specific emotional trigger that would cause reactive behavior (1 sentence)",
  "idealResponse": "How the Director Character should handle this situation (2-3 sentences based on Napoleon Hill's principles)",
  "affirmation": "A powerful first-person affirmation for this specific challenge",
  "visualizationScript": [
    {
      "scene": 1,
      "title": "The Challenge Appears",
      "description": "Opening scene showing the adversity - use HIGH ANGLE shot to show initial vulnerability, then LOW ANGLE as character recognizes the test",
      "cameraWork": "High angle transitioning to eye level, dramatic lighting",
      "nlpOverlay": "As you notice this challenge arising..."
    },
    {
      "scene": 2,
      "title": "The KUT! Moment",
      "description": "The protagonist pauses, takes a breath. EXTREME CLOSE-UP on eyes showing clarity emerging. DUTCH ANGLE to signify pattern break.",
      "cameraWork": "Extreme close-up, dutch angle, rim lighting from behind",
      "nlpOverlay": "You naturally pause, accessing your higher self..."
    },
    {
      "scene": 3,
      "title": "The Transformed Response",
      "description": "POV shot showing how they see the situation differently. LOW ANGLE shot of protagonist responding with ${targetTrait}.",
      "cameraWork": "POV shot, then low angle power shot, golden hour lighting",
      "nlpOverlay": "I AM embodying ${targetTrait} completely..."
    },
    {
      "scene": 4,
      "title": "Victory",
      "description": "Pull-back wide shot showing protagonist walking forward with purpose. CRANE shot rising above, showing mastery.",
      "cameraWork": "Wide shot, crane rising, rim lighting creating halo effect",
      "nlpOverlay": "This is who I am becoming. Each challenge strengthens this pattern."
    }
  ]
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

    // Add reference photo URL if provided
    if (referencePhotoUrl) {
      challenge.referencePhotoUrl = referencePhotoUrl;
    }

    // Add visualization prompt if requested
    if (generateVisualization) {
      const characterName = episodeContext?.characterTransformation?.requiredCharacter || "The Director Character";
      challenge.fullVisualizationPrompt = generateVisualizationPrompt(
        challenge.situation,
        targetTrait,
        scenarioType,
        characterName
      );
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
