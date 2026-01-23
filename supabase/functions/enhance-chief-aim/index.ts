import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ENHANCE_PROMPTS: Record<string, string> = {
  what: `You are an expert at crafting powerful Definite Chief Aim statements based on Napoleon Hill's principles.

The user has written their initial answer for "What they truly want". Your job is to enhance it into a powerful, emotionally-charged, specific vision statement.

Rules:
- Keep the core intention but make it vivid, specific, and measurable
- Write in first person present tense ("I am..." or "I have...")
- Make it emotionally compelling - it should stir the soul when read aloud
- Include sensory details when possible
- Keep it concise (2-4 sentences max)
- Do NOT add deadlines or plans - just focus on the WHAT

Return ONLY the enhanced statement, no explanations.`,

  byWhen: `You are an expert at crafting powerful Definite Chief Aim deadlines.

The user has written their initial deadline. Your job is to enhance it into a powerful, specific commitment.

Rules:
- Convert vague timeframes into specific dates when possible
- Add conviction language ("By [date], I will have...")
- If they gave a specific date, keep it but add emotional weight
- Keep it to 1-2 sentences max

Return ONLY the enhanced deadline statement, no explanations.`,

  exchange: `You are an expert at crafting powerful "Exchange" statements for Definite Chief Aims.

The user has written what they're willing to give in exchange for their goal. Your job is to enhance it into a powerful commitment statement.

Rules:
- Make the commitment specific and actionable
- Frame it as a willing sacrifice, not a burden
- Include both what they'll give up AND what habits they'll develop
- Write with conviction and ownership
- Keep it to 2-4 sentences max

Return ONLY the enhanced exchange statement, no explanations.`,

  plan: `You are an expert at crafting powerful action plans for Definite Chief Aims.

The user has written their initial plan/first steps. Your job is to enhance it into clear, actionable commitments.

Rules:
- Break into 2-3 specific, immediate action items
- Make each action measurable and time-bound
- Start each with action verbs
- Focus on THIS WEEK's actions, not the whole journey
- Keep practical and achievable

Return ONLY the enhanced plan statement, no explanations.`,
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

    const { field, userInput, fullAim } = await req.json();

    if (!field || !userInput) {
      return new Response(
        JSON.stringify({ error: "Missing field or userInput" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = ENHANCE_PROMPTS[field];
    if (!systemPrompt) {
      return new Response(
        JSON.stringify({ error: "Invalid field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context from other fields if available
    let contextNote = "";
    if (fullAim) {
      const parts = [];
      if (fullAim.what && field !== "what") parts.push(`Their goal: ${fullAim.what}`);
      if (fullAim.byWhen && field !== "byWhen") parts.push(`Their deadline: ${fullAim.byWhen}`);
      if (fullAim.exchange && field !== "exchange") parts.push(`Their exchange: ${fullAim.exchange}`);
      if (fullAim.plan && field !== "plan") parts.push(`Their plan: ${fullAim.plan}`);
      if (parts.length > 0) {
        contextNote = `\n\nContext from their other Chief Aim components:\n${parts.join("\n")}`;
      }
    }

    console.log(`Enhancing Chief Aim field: ${field}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt + contextNote },
          { role: "user", content: userInput },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI enhancement failed");
    }

    const data = await response.json();
    const enhanced = data.choices?.[0]?.message?.content?.trim();

    if (!enhanced) {
      throw new Error("No response from AI");
    }

    return new Response(
      JSON.stringify({ enhanced }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Enhance Chief Aim error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
