import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { chiefAim, visualStyle, userDescription, existingScenes, addMoreScenes, transformationAnalysis } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build a rich, cinematic system prompt based on whether we have transformation data
    const hasTransformation = transformationAnalysis?.requiredCharacter?.name;
    
    const systemPrompt = hasTransformation 
      ? `You are an Oscar-winning screenwriter and Mind Movie director. You don't just create scenes—you craft TRANSFORMATION STORIES that burn into the subconscious.

Your mission: Turn the user's character transformation journey into a VISCERAL, CINEMATIC experience. This isn't a slideshow. This is the movie of their life they'll watch every morning until their neural pathways rewire.

THE CHARACTER ARC:
The user must transform from "${transformationAnalysis.currentSelf?.archetype || 'their current self'}" into "${transformationAnalysis.requiredCharacter.name}".

REQUIRED TRAITS TO EMBED IN EVERY SCENE:
${transformationAnalysis.requiredCharacter.traits?.map((t: string) => `• ${t}`).join('\n') || 'Not specified'}

BEHAVIORS THE CHARACTER MUST DEMONSTRATE:
${transformationAnalysis.requiredCharacter.behaviors?.map((b: string) => `• ${b}`).join('\n') || 'Not specified'}

THE MINDSET SHIFT:
${transformationAnalysis.requiredCharacter.mindset || 'Not specified'}

WHAT MUST DIE (Show the old self being left behind):
${transformationAnalysis.gap?.whatMustDie?.map((d: string) => `💀 ${d}`).join('\n') || 'Not specified'}

WHAT MUST EMERGE (Show these qualities rising):
${transformationAnalysis.gap?.whatMustEmerge?.map((e: string) => `🌱 ${e}`).join('\n') || 'Not specified'}

SCREENWRITING RULES:
1. SHOW, DON'T TELL. No generic "person achieving goals" scenes. Be SPECIFIC. Be VIVID.
2. Each scene must demonstrate a REQUIRED TRAIT in action—not abstractly, but through a concrete moment
3. Include AFFIRMATION TEXT that will appear on screen—write it like dialogue, not a fortune cookie
4. The affirmations must feel like the character's internal voice—confident, specific, first-person
5. Build emotional momentum—start with determination, move through challenge, crescendo into triumph
6. The FINAL SCENE must show the complete manifestation—the Oscar-winning moment

FOR AI IMAGE GENERATION:
- Cinematic 16:9 aspect ratio
- Specify lighting (golden hour, dramatic shadows, studio lighting)
- Camera angles (low angle for power, close-up for emotion, wide for establishing)
- Include the protagonist in most scenes—describe their posture, expression, energy
- Use terms: photorealistic, cinematic, shallow depth of field, volumetric lighting`
      : `You are a Mind Movie Storyboard Director, an expert in visual storytelling and the Psycho-Cinematics methodology. Your role is to help users create powerful visual storyboards for their Mind Movies - short visualization videos that program the subconscious mind for success.

A Mind Movie should:
1. Start with the user's current state or the beginning of their journey
2. Progress through key milestones and transformations
3. End with the FINAL SCENE - the complete manifestation of their Definite Chief Aim
4. Use vivid, emotionally evocative imagery
5. Include personal details that make it feel real and achievable

Generate prompts that are optimized for AI image generation:
- Include specific visual details (lighting, camera angle, composition)
- Describe the scene cinematically
- Include the person's appearance if described
- Use terms like "cinematic", "photorealistic", "golden hour", "shallow depth of field"
- Specify aspect ratio as 16:9 for video frames
- Include emotional tone and atmosphere`;

    // Build the user prompt with transformation context if available
    let userPrompt: string;
    
    if (addMoreScenes && existingScenes?.length > 0) {
      userPrompt = `Add 3 MORE scenes to extend this Mind Movie storyboard.

Current scene count: ${existingScenes.length}
Last scene title: "${existingScenes[existingScenes.length - 1]?.title || 'Unknown'}"

Chief Aim: ${chiefAim?.what || "Not specified"}
By When: ${chiefAim?.byWhen || "Not specified"}
Visual Style: ${visualStyle || "Cinematic"}

Create 3 NEW scenes that continue the story toward the triumphant finale. Number them starting from 1.`;
    } else if (hasTransformation) {
      userPrompt = `WRITE THE SCREENPLAY for this transformation journey:

═══════════════════════════════════════════════
THE FINAL SCENE (Where we're headed):
${chiefAim?.what || "Not specified"}
Deadline: ${chiefAim?.byWhen || "Not specified"}
═══════════════════════════════════════════════

THE CHARACTER TRANSFORMATION:
From: ${transformationAnalysis.currentSelf?.archetype || 'Current self'}
To: ${transformationAnalysis.requiredCharacter.name}

THE ROLE THEY'RE PLAYING:
"${transformationAnalysis.script?.role || 'Not specified'}"

THE ARC:
${transformationAnalysis.script?.arc || 'Not specified'}

VISUAL STYLE: ${visualStyle || "Cinematic and inspiring"}
ADDITIONAL DIRECTION: ${userDescription || "None provided"}

═══════════════════════════════════════════════
CREATE 6-8 SCENES that:
1. Open with a powerful moment showing the character CHOOSING to transform
2. Show them PRACTICING the required traits in specific situations
3. Include a moment of CHALLENGE where old patterns try to return—and they overcome
4. Build to the TRIUMPHANT FINALE showing complete manifestation

Each scene needs:
- A vivid visual that demonstrates a required character trait
- An affirmation that sounds like the character's confident internal voice
- Emotional escalation toward the climax

Make it so good they'll want to watch it every single day.`;
    } else {
      userPrompt = `Create a storyboard for a Mind Movie based on this Definite Chief Aim:

WHAT I WANT: ${chiefAim?.what || "Not specified"}
BY WHEN: ${chiefAim?.byWhen || "Not specified"}
WHAT I WILL GIVE: ${chiefAim?.exchange || "Not specified"}
MY PLAN: ${chiefAim?.plan || "Not specified"}

VISUAL STYLE PREFERENCE: ${visualStyle || "Cinematic and inspiring"}

USER'S DESCRIPTION OF THEIR VISION: ${userDescription || "Not provided"}

Generate 5-8 scenes that tell the story of achieving this goal. Each scene should build toward the final triumphant visualization.`;
    }

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
        tools: [
          {
            type: "function",
            function: {
              name: "create_storyboard",
              description: "Create a structured storyboard with scenes for a Mind Movie",
              parameters: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "A compelling title for the Mind Movie",
                  },
                  scenes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        order: {
                          type: "number",
                          description: "Scene order number",
                        },
                        title: {
                          type: "string",
                          description: "Short title for the scene",
                        },
                        narrative: {
                          type: "string",
                          description: "Brief narrative description of what happens in this scene",
                        },
                        prompt: {
                          type: "string",
                          description: "Detailed AI image generation prompt with cinematic details, lighting, composition, and style",
                        },
                        duration: {
                          type: "number",
                          description: "Suggested duration in seconds (5 or 10)",
                        },
                        emotionalTone: {
                          type: "string",
                          description: "The emotional feeling of this scene (e.g., hopeful, triumphant, peaceful)",
                        },
                      },
                      required: ["order", "title", "narrative", "prompt", "duration", "emotionalTone"],
                    },
                  },
                },
                required: ["title", "scenes"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_storyboard" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("[generate-storyboard] AI response:", JSON.stringify(data, null, 2));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const finishReason = data.choices?.[0]?.native_finish_reason || data.choices?.[0]?.finish_reason;
    
    if (!toolCall || toolCall.function.name !== "create_storyboard") {
      console.error("[generate-storyboard] Invalid tool call. Finish reason:", finishReason);
      // Provide more specific error message
      if (finishReason === "MALFORMED_FUNCTION_CALL") {
        throw new Error("AI failed to generate storyboard. Please try again.");
      }
      throw new Error("Invalid response from AI. Please try again.");
    }

    let storyboard;
    try {
      storyboard = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error("[generate-storyboard] Failed to parse arguments:", toolCall.function.arguments);
      throw new Error("Failed to parse AI response. Please try again.");
    }

    return new Response(JSON.stringify(storyboard), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[generate-storyboard] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
