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

    const { chiefAim, visualStyle, userDescription, existingScenes, addMoreScenes, transformationAnalysis, episodeMode, episodeData, targetDuration = 120 } = await req.json();
    
    // Calculate scene count based on target duration (default 2 minutes = 120 seconds)
    // Each scene is 10 seconds
    const sceneCount = Math.max(6, Math.min(18, Math.ceil(targetDuration / 10)));
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build a rich, cinematic system prompt based on mode and available data
    const hasTransformation = transformationAnalysis?.requiredCharacter?.name;
    const isEpisodeMode = episodeMode && episodeData;
    
    // Extract character transformation data for embedding traits in storyboard
    const characterTraits = transformationAnalysis?.requiredCharacter?.traits || [];
    const characterBehaviors = transformationAnalysis?.requiredCharacter?.behaviors || [];
    const characterMindset = transformationAnalysis?.requiredCharacter?.mindset || '';
    const requiredCharacterName = transformationAnalysis?.requiredCharacter?.name || 'Your Best Self';
    
    // Episode-focused system prompt for mini mind movies
    const episodeSystemPrompt = `You are a Psycho-Cinematics™ Episode Director. Your specialty: creating SHORT, FOCUSED visualization sequences for specific sprints and objectives.

This is NOT a full Mind Movie—it's an EPISODE MOVIE: a 3-5 scene mini-visualization focused on ONE specific objective that supports the user's larger Chief Aim.

EPISODE CONTEXT:
**Episode Title:** ${episodeData?.title || 'Untitled Episode'}
**Episode Objective:** ${episodeData?.objective || 'Not specified'}
**Deadline:** ${episodeData?.deadline || 'Not specified'}

CONNECTION TO CHIEF AIM:
${chiefAim?.what ? `Their Final Scene: ${chiefAim.what}` : 'Chief Aim not specified'}
${episodeData?.alignment_score ? `Alignment Score: ${episodeData.alignment_score}%` : ''}

EPISODE MOVIE RULES:
1. EXACTLY 3-5 SCENES - This is a sprint visualization, not an epic
2. FOCUS ON THE OBJECTIVE - Every scene must relate to the episode objective
3. SHOW THE ACHIEVEMENT - The final scene shows the episode objective COMPLETED
4. FAST PACING - 10-second scenes, high energy, immediate impact
5. CONNECT TO CHIEF AIM - Subtly show how this episode advances the larger goal

SCENE STRUCTURE:
1. **The Commitment** - Show the user deciding to pursue this objective
2. **In Action** - Show them executing with required character traits
3. **The Challenge** - Optional: A moment of difficulty they push through
4. **The Win** - The objective achieved, celebration moment
5. **The Connection** - Optional: Link back to the Chief Aim / larger vision

FOR AI IMAGE GENERATION:
- Cinematic 16:9 aspect ratio
- High energy, motivational lighting
- Close-ups on determination and triumph
- Include the protagonist demonstrating success`;
    
    // Full Mind Movie system prompt with 3-Act structure
    const fullMindMoviePrompt = hasTransformation 
      ? `You are an Oscar-winning screenwriter and Mind Movie director. You don't just create scenes—you craft TRANSFORMATION STORIES that burn into the subconscious.

Your mission: Create a ${sceneCount}-scene Mind Movie (approximately ${targetDuration} seconds total, each scene 10 seconds) that tells a complete 3-ACT TRANSFORMATION STORY.

═══════════════════════════════════════════════
3-ACT STRUCTURE FOR MIND MOVIES
═══════════════════════════════════════════════

**ACT ONE: THE AWAKENING (Scenes 1-${Math.floor(sceneCount * 0.25)})**
- Open with a powerful moment of DECISION
- Show the character recognizing the need for transformation
- Establish the gap between current reality and the dream
- First affirmations should be about COMMITMENT and IDENTITY SHIFT

**ACT TWO: THE TRANSFORMATION (Scenes ${Math.floor(sceneCount * 0.25) + 1}-${Math.floor(sceneCount * 0.75)})**
- Show the character EMBODYING each required trait in specific situations
- Include a MIDPOINT MOMENT where old patterns try to resurface—and are overcome
- Demonstrate the behaviors and mindset in action
- Affirmations shift from commitment to BEING—"I AM" statements
- Show progressive wins, challenges overcome, skills demonstrated

**ACT THREE: THE MANIFESTATION (Scenes ${Math.floor(sceneCount * 0.75) + 1}-${sceneCount})**
- Build to the CLIMACTIC ACHIEVEMENT
- Show the complete vision realized
- The Chief Aim manifested in vivid detail
- Emotional crescendo—joy, triumph, gratitude
- Final scene: The Oscar-winning moment of complete transformation

═══════════════════════════════════════════════
THE CHARACTER TRANSFORMATION
═══════════════════════════════════════════════

The user must transform from "${transformationAnalysis.currentSelf?.archetype || 'their current self'}" into "${requiredCharacterName}".

REQUIRED TRAITS TO EMBED IN SCENES:
${characterTraits.map((t: string) => `• ${t}`).join('\n') || 'Not specified'}

BEHAVIORS THE CHARACTER MUST DEMONSTRATE:
${characterBehaviors.map((b: string) => `• ${b}`).join('\n') || 'Not specified'}

THE MINDSET SHIFT:
${characterMindset || 'Not specified'}

WHAT MUST DIE (Show being left behind in Act 1-2):
${transformationAnalysis.gap?.whatMustDie?.map((d: string) => `💀 ${d}`).join('\n') || 'Not specified'}

WHAT MUST EMERGE (Show rising in Act 2-3):
${transformationAnalysis.gap?.whatMustEmerge?.map((e: string) => `🌱 ${e}`).join('\n') || 'Not specified'}

═══════════════════════════════════════════════
AFFIRMATION RULES
═══════════════════════════════════════════════

Each scene MUST include an affirmation that:
1. Reinforces the required character trait for that scene
2. Sounds like confident INTERNAL DIALOGUE, not a fortune cookie
3. Uses first-person, present tense: "I am...", "I choose...", "I create..."
4. Feels natural to the scene—like what the character would be thinking
5. Builds emotional intensity as the movie progresses

Examples of GOOD affirmations that reinforce traits:
- (For decisiveness) "I make powerful decisions instantly and follow through completely."
- (For resilience) "Every challenge I face makes me stronger. I rise every time."
- (For confidence) "I walk into every room knowing my value. My presence is powerful."

═══════════════════════════════════════════════
VISUAL GENERATION REQUIREMENTS
═══════════════════════════════════════════════

FOR AI IMAGE GENERATION, EVERY PROMPT MUST INCLUDE:
- Cinematic 16:9 aspect ratio
- Specific lighting (golden hour, dramatic shadows, studio lighting, etc.)
- Camera angle (low angle for power, close-up for emotion, wide for establishing)
- The protagonist's posture, expression, and energy
- Style terms: photorealistic, cinematic, shallow depth of field, volumetric lighting
- Emotional atmosphere matching the scene's place in the arc`
      : `You are a Mind Movie Storyboard Director, an expert in visual storytelling and the Psycho-Cinematics methodology.

Create a ${sceneCount}-scene Mind Movie (approximately ${targetDuration} seconds total) following a 3-ACT STRUCTURE:

**ACT ONE (Opening ${Math.floor(sceneCount * 0.25)} scenes):** The Decision & Starting Point
**ACT TWO (Middle ${Math.floor(sceneCount * 0.5)} scenes):** The Journey & Transformation
**ACT THREE (Final ${Math.floor(sceneCount * 0.25)} scenes):** The Achievement & Celebration

Each scene should:
1. Build emotional momentum from determination to triumph
2. Include vivid, cinematic visuals optimized for AI image generation
3. Feature affirmations that feel like confident internal dialogue
4. Progress logically toward the final manifestation

For AI image generation, include:
- Cinematic 16:9 aspect ratio
- Specific lighting, camera angles, and composition
- Photorealistic, cinematic style with volumetric lighting
- The protagonist's expressions and body language`;
    
    const systemPrompt = isEpisodeMode ? episodeSystemPrompt : fullMindMoviePrompt;

    // Build the user prompt with transformation context if available
    let userPrompt: string;
    
    if (isEpisodeMode) {
      userPrompt = `CREATE AN EPISODE MOVIE for this sprint:

═══════════════════════════════════════════════
EPISODE: "${episodeData?.title || 'My Episode'}"
OBJECTIVE: ${episodeData?.objective || 'Complete this episode'}
DEADLINE: ${episodeData?.deadline || 'Soon'}
═══════════════════════════════════════════════

SUPPORTING THE CHIEF AIM:
${chiefAim?.what || 'Not specified'}

VISUAL STYLE: ${visualStyle || "Cinematic and energetic"}
${userDescription ? `ADDITIONAL CONTEXT: ${userDescription}` : ''}

CREATE 3-5 FOCUSED SCENES that visualize achieving this specific episode objective.
Make it punchy, motivational, and immediately actionable.
The user should feel compelled to take action RIGHT NOW after watching this.`;
    } else if (addMoreScenes && existingScenes?.length > 0) {
      userPrompt = `Add 3 MORE scenes to extend this Mind Movie storyboard.

Current scene count: ${existingScenes.length}
Last scene title: "${existingScenes[existingScenes.length - 1]?.title || 'Unknown'}"

Chief Aim: ${chiefAim?.what || "Not specified"}
By When: ${chiefAim?.byWhen || "Not specified"}
Visual Style: ${visualStyle || "Cinematic"}

Create 3 NEW scenes that continue the story toward the triumphant finale. Number them starting from 1.`;
    } else if (hasTransformation) {
      userPrompt = `CREATE A ${sceneCount}-SCENE MIND MOVIE (${Math.floor(targetDuration / 60)} minute${targetDuration >= 120 ? 's' : ''}) for this transformation:

═══════════════════════════════════════════════
THE DEFINITE CHIEF AIM (The Final Scene)
═══════════════════════════════════════════════
WHAT: ${chiefAim?.what || "Not specified"}
BY WHEN: ${chiefAim?.byWhen || "Not specified"}
EXCHANGE: ${chiefAim?.exchange || "Not specified"}
PLAN: ${chiefAim?.plan || "Not specified"}

═══════════════════════════════════════════════
THE CHARACTER TRANSFORMATION
═══════════════════════════════════════════════
FROM: ${transformationAnalysis.currentSelf?.archetype || 'Current self'}
TO: ${transformationAnalysis.requiredCharacter.name}

REQUIRED TRAITS:
${characterTraits.map((t: string) => `• ${t}`).join('\n') || 'Not specified'}

REQUIRED BEHAVIORS:
${characterBehaviors.map((b: string) => `• ${b}`).join('\n') || 'Not specified'}

MINDSET:
${characterMindset || 'Not specified'}

═══════════════════════════════════════════════
VISUAL DIRECTION
═══════════════════════════════════════════════
STYLE: ${visualStyle || "Cinematic and inspiring"}
ADDITIONAL NOTES: ${userDescription || "None provided"}

═══════════════════════════════════════════════
CREATE EXACTLY ${sceneCount} SCENES following the 3-Act structure:

ACT ONE (Scenes 1-${Math.floor(sceneCount * 0.25)}): THE AWAKENING
- The decision to transform
- Leaving the old identity behind

ACT TWO (Scenes ${Math.floor(sceneCount * 0.25) + 1}-${Math.floor(sceneCount * 0.75)}): THE JOURNEY
- Embodying each required trait
- Overcoming challenges with new behaviors
- The midpoint test of the old pattern

ACT THREE (Scenes ${Math.floor(sceneCount * 0.75) + 1}-${sceneCount}): THE MANIFESTATION
- Progressive wins building to climax
- The Chief Aim fully realized
- The triumphant finale

REMEMBER:
- Each scene = 10 seconds of video
- Every affirmation must reinforce a required character trait
- Show the character BEING the person who achieves the goal
- Make it visceral, specific, and emotionally powerful`;
    } else {
      userPrompt = `CREATE A ${sceneCount}-SCENE MIND MOVIE (${Math.floor(targetDuration / 60)} minute${targetDuration >= 120 ? 's' : ''}) for this Definite Chief Aim:

WHAT I WANT: ${chiefAim?.what || "Not specified"}
BY WHEN: ${chiefAim?.byWhen || "Not specified"}
WHAT I WILL GIVE: ${chiefAim?.exchange || "Not specified"}
MY PLAN: ${chiefAim?.plan || "Not specified"}

VISUAL STYLE: ${visualStyle || "Cinematic and inspiring"}
ADDITIONAL NOTES: ${userDescription || "Not provided"}

Create exactly ${sceneCount} scenes following a 3-Act structure:
- ACT ONE: The decision and starting point
- ACT TWO: The journey, challenges, and transformation
- ACT THREE: The achievement and celebration

Each scene should be 10 seconds, building emotional momentum toward the triumphant finale.`;
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
