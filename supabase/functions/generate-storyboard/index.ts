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
    const { chiefAim, visualStyle, userDescription, existingScenes, addMoreScenes } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a Mind Movie Storyboard Director, an expert in visual storytelling and the Psycho-Cinematics methodology. Your role is to help users create powerful visual storyboards for their Mind Movies - short visualization videos that program the subconscious mind for success.

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

    const userPrompt = addMoreScenes && existingScenes?.length > 0 
      ? `Add 3 MORE scenes to extend this Mind Movie storyboard.

Current scene count: ${existingScenes.length}
Last scene title: "${existingScenes[existingScenes.length - 1]?.title || 'Unknown'}"

Chief Aim: ${chiefAim?.what || "Not specified"}
By When: ${chiefAim?.byWhen || "Not specified"}
Visual Style: ${visualStyle || "Cinematic"}

Create 3 NEW scenes that continue the story toward the triumphant finale. Number them starting from 1.`
      : `Create a storyboard for a Mind Movie based on this Definite Chief Aim:

WHAT I WANT: ${chiefAim?.what || "Not specified"}
BY WHEN: ${chiefAim?.byWhen || "Not specified"}
WHAT I WILL GIVE: ${chiefAim?.exchange || "Not specified"}
MY PLAN: ${chiefAim?.plan || "Not specified"}

VISUAL STYLE PREFERENCE: ${visualStyle || "Cinematic and inspiring"}

USER'S DESCRIPTION OF THEIR VISION: ${userDescription || "Not provided"}

Generate 5-8 scenes that tell the story of achieving this goal. Each scene should build toward the final triumphant visualization.`;

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
