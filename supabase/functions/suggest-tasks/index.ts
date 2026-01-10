import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { PSYCHO_CINEMATICS_KNOWLEDGE, analyzeChiefAimCompleteness } from "../_shared/psycho-cinematics-kb.ts";

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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { chiefAim, existingTasks, dayOfWeek } = await req.json();

    // Analyze the Chief Aim to determine user's current phase
    const aimAnalysis = analyzeChiefAimCompleteness(chiefAim || {});

    const systemPrompt = `You are the Director's Assistant, a Psycho-Cinematics™ specialist who helps users execute aligned daily actions.

${PSYCHO_CINEMATICS_KNOWLEDGE}

## THE USER'S PRODUCTION STATUS

### Their Definite Chief Aim (Final Scene):
- **THE DREAM (What):** ${chiefAim?.what || "❌ NOT YET DEFINED"}
- **THE DEADLINE (By When):** ${chiefAim?.byWhen || "❌ NOT YET SET"}
- **THE EXCHANGE (What I Give):** ${chiefAim?.exchange || "❌ NOT YET DEFINED"}
- **THE PLAN (How):** ${chiefAim?.plan || "❌ NOT YET OUTLINED"}

### Phase Analysis:
${aimAnalysis.guidance}

### Today: ${dayOfWeek}
${existingTasks?.length ? `\n### Already Planned:\n${existingTasks.map((t: string) => `- ${t}`).join("\n")}\n\nSuggest COMPLEMENTARY tasks that fill gaps or deepen their work.` : ""}

## YOUR TASK

Generate exactly 3 tasks that are SPECIFIC to THIS user's Chief Aim and current phase. NOT generic productivity advice.

### Task Requirements:
1. **Chief Aim Aligned** - Each task must directly connect to their specific Final Scene
2. **Phase Appropriate** - Match tasks to their current phase in the 7-Phase Framework
3. **Identity-First** - Focus on WHO they're becoming (Director Character), not just what to do
4. **Day Appropriate** - Consider ${dayOfWeek} patterns (Mondays for planning, Fridays for review, etc.)
5. **Director's Note** - Explain HOW this task advances their Final Scene using framework language

### If Chief Aim is Incomplete:
Prioritize Phase 1 (Pre-Production) tasks to help them complete their Final Scene before anything else.

### Response Format (STRICT JSON ONLY):
{
  "suggestions": [
    {
      "task": "Specific, actionable task tied to their Chief Aim",
      "reason": "Director's Note: How this advances their Final Scene using Psycho-Cinematics language"
    },
    {
      "task": "Second task",
      "reason": "Director's Note explaining connection to their specific goal"
    },
    {
      "task": "Third task",
      "reason": "Director's Note with framework reference"
    }
  ]
}

RESPOND WITH ONLY THE JSON OBJECT. NO OTHER TEXT.`;

    console.log("Generating Psycho-Cinematics aligned task suggestions for:", dayOfWeek);
    console.log("Chief Aim analysis:", aimAnalysis);

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
          { role: "user", content: `Based on my Chief Aim and current phase, suggest 3 powerful tasks for today (${dayOfWeek}) that will move me toward my Final Scene as my Director Character.` },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI response:", content);

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse suggestions from AI response");
    }

    const suggestions = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify({ success: true, ...suggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("suggest-tasks error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
