import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PSYCHO_CINEMATICS_KNOWLEDGE } from "../_shared/psycho-cinematics-kb.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { episodeObjective, chiefAim, archetype } = await req.json();

    if (!episodeObjective || !chiefAim) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are the Transformation Architect for the Psycho-Cinematics™ system.

${PSYCHO_CINEMATICS_KNOWLEDGE}

## YOUR MISSION

For each EPISODE (short-term sprint), you must identify WHO the person must BECOME to achieve the objective. 
They cannot succeed through cleverness alone - they must activate their Definite Chief Aim through identity transformation.

## USER CONTEXT

**DEFINITE CHIEF AIM (Their Life Mission):**
- What they want: ${chiefAim.what || "Not specified"}
- Deadline: ${chiefAim.byWhen || "Not specified"}
- What they give in exchange: ${chiefAim.exchange || "Not specified"}
- Their plan: ${chiefAim.plan || "Not specified"}

**CURRENT ARCHETYPE:** ${archetype || "Not determined"}

**EPISODE OBJECTIVE (The Sprint Goal):**
${episodeObjective}

## TRANSFORMATION ANALYSIS REQUIRED

Generate a deep character transformation profile for THIS specific episode.`;

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
          { role: "user", content: `Analyze the character transformation required for this episode objective: "${episodeObjective}"` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_transformation_profile",
              description: "Create a complete character transformation profile for the episode",
              parameters: {
                type: "object",
                properties: {
                  requiredCharacter: {
                    type: "object",
                    description: "The character they must become for this episode",
                    properties: {
                      name: {
                        type: "string",
                        description: "A specific character name (e.g., 'The Relentless Closer', 'The Disciplined Creator')"
                      },
                      traits: {
                        type: "array",
                        items: { type: "string" },
                        description: "4-5 specific character traits required"
                      },
                      behaviors: {
                        type: "array",
                        items: { type: "string" },
                        description: "4-5 specific daily behaviors to embody"
                      },
                      mindset: {
                        type: "string",
                        description: "The core belief/mindset to hold during this sprint"
                      }
                    },
                    required: ["name", "traits", "behaviors", "mindset"]
                  },
                  currentCharacterProfile: {
                    type: "object",
                    description: "Who they are now that's blocking success",
                    properties: {
                      limitingBeliefs: {
                        type: "array",
                        items: { type: "string" },
                        description: "2-3 limiting beliefs to overcome"
                      },
                      sabotagePatterns: {
                        type: "array",
                        items: { type: "string" },
                        description: "2-3 self-sabotage patterns to watch for"
                      }
                    },
                    required: ["limitingBeliefs", "sabotagePatterns"]
                  },
                  transformationGap: {
                    type: "object",
                    description: "The gap between current and required character",
                    properties: {
                      whatMustDie: {
                        type: "array",
                        items: { type: "string" },
                        description: "3-4 behaviors/patterns that must be eliminated"
                      },
                      whatMustEmerge: {
                        type: "array",
                        items: { type: "string" },
                        description: "3-4 new patterns that must be adopted"
                      }
                    },
                    required: ["whatMustDie", "whatMustEmerge"]
                  },
                  narrativeArc: {
                    type: "object",
                    description: "The story arc within this episode",
                    properties: {
                      midpointConflict: {
                        type: "string",
                        description: "The moment where they'll be tempted to solve things the OLD way (without transformation)"
                      },
                      climacticShift: {
                        type: "string",
                        description: "The identity moment where they must choose to evolve or fail"
                      },
                      resolution: {
                        type: "string",
                        description: "How success looks when achieved through transformation"
                      }
                    },
                    required: ["midpointConflict", "climacticShift", "resolution"]
                  },
                  dailyPractice: {
                    type: "object",
                    description: "Daily rituals to reinforce transformation",
                    properties: {
                      morningActivation: {
                        type: "string",
                        description: "Morning ritual or affirmation"
                      },
                      midDayReset: {
                        type: "string",
                        description: "Midday check-in question or practice"
                      },
                      eveningReflection: {
                        type: "string",
                        description: "Evening reflection prompt"
                      },
                      mantra: {
                        type: "string",
                        description: "One-line identity mantra for the episode"
                      }
                    },
                    required: ["morningActivation", "midDayReset", "eveningReflection", "mantra"]
                  },
                  chiefAimConnection: {
                    type: "string",
                    description: "How completing this episode advances the Definite Chief Aim through character growth"
                  }
                },
                required: ["requiredCharacter", "currentCharacterProfile", "transformationGap", "narrativeArc", "dailyPractice", "chiefAimConnection"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_transformation_profile" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI gateway error");
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call in response");
    }

    const transformation = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(transformation),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error analyzing episode character:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
