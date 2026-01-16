import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
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

    const { objective, chiefAim } = await req.json();

    if (!objective || !chiefAim) {
      return new Response(
        JSON.stringify({ error: "Missing objective or chiefAim" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are the Director AI, an expert at analyzing goal alignment within the Psycho-Cinematics™ framework.

Your task is to evaluate whether a short-term "Episode" (mini-goal) aligns with the user's main Definite Chief Aim.

DEFINITE CHIEF AIM:
- What they want: ${chiefAim.what || "Not specified"}
- By when: ${chiefAim.byWhen || "Not specified"}  
- What they'll give in exchange: ${chiefAim.exchange || "Not specified"}
- Their plan: ${chiefAim.plan || "Not specified"}

EPISODE OBJECTIVE:
${objective}

Analyze this episode and determine:
1. How well does this episode support the main Chief Aim? (0-100 score)
2. Could this episode potentially derail or distract from the main goal?
3. What specific connections exist between this episode and the Chief Aim?

SCORING GUIDE:
- 90-100: Directly advances the Chief Aim (critical path)
- 70-89: Strongly supports the Chief Aim (strategic value)
- 50-69: Moderately related (skill building or indirect support)
- 30-49: Loosely connected (could be helpful but not priority)
- 0-29: Potential distraction (may compete with Chief Aim resources)

Provide your analysis in a motivating, director-style tone.`;

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
          { role: "user", content: `Evaluate this episode objective: "${objective}"` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "evaluate_alignment",
              description: "Return the alignment score and reasoning for an episode",
              parameters: {
                type: "object",
                properties: {
                  score: {
                    type: "number",
                    description: "Alignment score from 0-100"
                  },
                  reasoning: {
                    type: "string",
                    description: "Explanation of the alignment analysis in 2-3 sentences, using director terminology"
                  }
                },
                required: ["score", "reasoning"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "evaluate_alignment" } }
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
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiResponse = await response.json();
    console.log("AI Response:", JSON.stringify(aiResponse, null, 2));

    // Extract the tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call in response");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        score: result.score,
        reasoning: result.reasoning
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error validating episode alignment:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
