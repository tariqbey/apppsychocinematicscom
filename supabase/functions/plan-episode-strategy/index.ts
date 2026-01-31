import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PSYCHO_CINEMATICS_KNOWLEDGE } from "../_shared/psycho-cinematics-kb.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const { objective, context, deadline, chiefAim } = await req.json();

    if (!objective) {
      return new Response(
        JSON.stringify({ error: "Missing objective" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are The Director's Strategist - a tactical AI planner who helps users achieve specific, time-bound objectives.

${PSYCHO_CINEMATICS_KNOWLEDGE}

## YOUR ROLE

You help users who have a specific goal they need to accomplish quickly. They might need to:
- Make money fast (launch a product, close a deal, set up a funnel)
- Complete a project (launch a website, finish a course, deliver work)
- Hit a milestone (get clients, grow audience, build something)

Your job is to:
1. Break down their objective into CONCRETE, TACTICAL action steps
2. Create a visualization script they can use for their Mind Movie
3. Identify WHO they need to become to pull this off
4. Give them a battle plan they can execute TODAY

## USER CONTEXT

**THEIR DEFINITE CHIEF AIM (Life Mission):**
${chiefAim?.what ? `- What: ${chiefAim.what}` : "- Not set"}
${chiefAim?.byWhen ? `- By When: ${chiefAim.byWhen}` : ""}
${chiefAim?.plan ? `- Plan: ${chiefAim.plan}` : ""}

**EPISODE OBJECTIVE (What they need to accomplish):**
${objective}

${context ? `**ADDITIONAL CONTEXT:**\n${context}` : ""}

${deadline ? `**DEADLINE:** ${deadline}` : ""}

## RESPONSE STYLE

Be direct. Be tactical. Be specific. Give them a BATTLE PLAN, not theory. Think like a coach in the locker room before the big game - every word should drive action.`;

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
          { role: "user", content: `Create a complete tactical strategy for: "${objective}"\n\nBreak this down into actionable steps I can execute, and give me a visualization script I can use to see myself pulling this off.` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_episode_strategy",
              description: "Create a complete tactical strategy with action steps and visualization script",
              parameters: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "A compelling episode title (e.g., 'The Funnel Launch Sprint', 'Operation: First Client')"
                  },
                  battlePlan: {
                    type: "object",
                    description: "The tactical breakdown of how to achieve the objective",
                    properties: {
                      overview: {
                        type: "string",
                        description: "2-3 sentence strategic overview of the approach"
                      },
                      phases: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: {
                              type: "string",
                              description: "Phase name (e.g., 'Phase 1: Foundation')"
                            },
                            duration: {
                              type: "string",
                              description: "Suggested duration (e.g., 'Day 1-2', '1 week')"
                            },
                            actions: {
                              type: "array",
                              items: { type: "string" },
                              description: "3-5 specific, concrete actions for this phase"
                            },
                            deliverable: {
                              type: "string",
                              description: "What should be complete by end of this phase"
                            }
                          },
                          required: ["name", "duration", "actions", "deliverable"]
                        },
                        description: "2-4 phases to complete the objective"
                      },
                      quickWins: {
                        type: "array",
                        items: { type: "string" },
                        description: "3-5 things they can do TODAY to build momentum"
                      },
                      potentialBlockers: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            blocker: { type: "string" },
                            solution: { type: "string" }
                          },
                          required: ["blocker", "solution"]
                        },
                        description: "2-3 common blockers and how to handle them"
                      }
                    },
                    required: ["overview", "phases", "quickWins", "potentialBlockers"]
                  },
                  requiredCharacter: {
                    type: "object",
                    description: "Who they need to become to pull this off",
                    properties: {
                      name: {
                        type: "string",
                        description: "Character name they embody (e.g., 'The Closer', 'The Builder', 'The Operator')"
                      },
                      coreIdentity: {
                        type: "string",
                        description: "One sentence identity statement: 'I am the type of person who...'"
                      },
                      nonNegotiables: {
                        type: "array",
                        items: { type: "string" },
                        description: "3-4 behaviors this character ALWAYS does"
                      },
                      cutMoments: {
                        type: "array",
                        items: { type: "string" },
                        description: "2-3 situations where they need to yell 'CUT!' and reset"
                      }
                    },
                    required: ["name", "coreIdentity", "nonNegotiables", "cutMoments"]
                  },
                  visualizationScript: {
                    type: "object",
                    description: "Mind Movie script for visualizing success",
                    properties: {
                      openingScene: {
                        type: "string",
                        description: "Opening scene description (30-50 words) - set the stage"
                      },
                      actionMontage: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            scene: { type: "string", description: "Visual description of action being taken" },
                            affirmation: { type: "string", description: "First-person affirmation for this scene" }
                          },
                          required: ["scene", "affirmation"]
                        },
                        description: "3-5 scenes showing them executing the plan"
                      },
                      victoryScene: {
                        type: "string",
                        description: "Final scene showing the objective achieved (50-75 words)"
                      },
                      closingAffirmation: {
                        type: "string",
                        description: "Powerful closing affirmation (1-2 sentences)"
                      }
                    },
                    required: ["openingScene", "actionMontage", "victoryScene", "closingAffirmation"]
                  },
                  dailyTasks: {
                    type: "array",
                    items: { type: "string" },
                    description: "3 specific tasks to add to their Three Things today"
                  },
                  successMetrics: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-3 measurable indicators that this episode is complete"
                  }
                },
                required: ["title", "battlePlan", "requiredCharacter", "visualizationScript", "dailyTasks", "successMetrics"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_episode_strategy" } }
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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText.substring(0, 200));
      throw new Error("AI gateway error");
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call in response");
    }

    const strategy = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(strategy),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error planning episode strategy:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
