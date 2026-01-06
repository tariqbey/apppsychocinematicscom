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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { chiefAim, existingTasks, dayOfWeek } = await req.json();

    const systemPrompt = `You are the Director's Assistant, helping entrepreneurs align their daily actions with their Definite Chief Aim.

The user's Definite Chief Aim:
- What they want: ${chiefAim?.what || "Not yet defined"}
- By when: ${chiefAim?.byWhen || "Not yet defined"}
- What they'll exchange: ${chiefAim?.exchange || "Not yet defined"}
- Their plan: ${chiefAim?.plan || "Not yet defined"}

Today is ${dayOfWeek}.

Your job is to suggest 3 highly actionable tasks that:
1. Directly advance their Chief Aim
2. Are specific and completable in one day
3. Create momentum toward their bigger vision
4. Are appropriate for ${dayOfWeek} (e.g., Mondays for planning, Fridays for review)

${existingTasks?.length ? `They already have these tasks planned: ${existingTasks.join(", ")}. Suggest complementary tasks.` : ""}

Respond with ONLY a JSON object in this exact format:
{
  "suggestions": [
    { "task": "Task description here", "reason": "Brief reason why this advances their aim" },
    { "task": "Task description here", "reason": "Brief reason why this advances their aim" },
    { "task": "Task description here", "reason": "Brief reason why this advances their aim" }
  ]
}`;

    console.log("Generating task suggestions for:", dayOfWeek);

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
          { role: "user", content: "Suggest 3 powerful tasks for today that will move me toward my Chief Aim." },
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
