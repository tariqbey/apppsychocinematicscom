import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { PSYCHO_CINEMATICS_KNOWLEDGE } from "../_shared/psycho-cinematics-kb.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the "Script Rewriter" — a Psycho-Cinematics™ specialist who helps users ADJUST and REFINE their existing Definite Chief Aim.

${PSYCHO_CINEMATICS_KNOWLEDGE}

## YOUR SPECIALIZED ROLE

The user already has a Definite Chief Aim but wants to make specific adjustments. Your job is to:
1. Understand what adjustment they want to make
2. Rewrite ONLY the parts that need changing while preserving what works
3. Maintain the emotional power and specificity of Napoleon Hill's framework
4. Return the COMPLETE updated Chief Aim with all four components

## THE FOUR COMPONENTS
1. **THE DREAM (What)** — The burning desire in vivid, specific terms
2. **THE DEADLINE (By When)** — A specific date that creates urgency
3. **THE EXCHANGE (What I Give)** — The sacrifice and commitment
4. **THE PLAN (How)** — Immediate next actions

## RULES
- Write in first person present tense
- Make statements emotionally compelling
- Be specific and measurable
- Only change what the user asks to change
- Preserve the core essence unless explicitly asked to change it
- Return the full updated Chief Aim in a structured format

## RESPONSE FORMAT
Return a JSON object with exactly these fields:
{
  "what": "The updated WHAT statement",
  "byWhen": "The updated BY WHEN statement", 
  "exchange": "The updated EXCHANGE statement",
  "plan": "The updated PLAN statement",
  "summary": "Brief 1-2 sentence summary of what you changed"
}

IMPORTANT: Return ONLY valid JSON, no markdown, no extra text.`;

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

    const { currentAim, adjustmentRequest } = await req.json();

    if (!currentAim || !adjustmentRequest) {
      return new Response(
        JSON.stringify({ error: "Missing currentAim or adjustmentRequest" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the user prompt with current aim context
    const userPrompt = `## CURRENT DEFINITE CHIEF AIM

**THE DREAM (What):** ${currentAim.what || "Not set"}

**THE DEADLINE (By When):** ${currentAim.byWhen || "Not set"}

**THE EXCHANGE (What I Give):** ${currentAim.exchange || "Not set"}

**THE PLAN (How):** ${currentAim.plan || "Not set"}

## ADJUSTMENT REQUEST

${adjustmentRequest}

Please update my Chief Aim based on this adjustment request. Return the complete updated Chief Aim as JSON.`;

    console.log(`Adjusting Chief Aim for user`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1500,
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
      throw new Error("AI adjustment failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let adjustedAim;
    try {
      // Remove any markdown code block wrappers if present
      const cleanContent = content.replace(/^```json?\s*|\s*```$/g, "").trim();
      adjustedAim = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid AI response format");
    }

    // Validate the response has all required fields
    if (!adjustedAim.what || !adjustedAim.byWhen || !adjustedAim.exchange || !adjustedAim.plan) {
      throw new Error("Incomplete AI response");
    }

    return new Response(
      JSON.stringify({ adjustedAim }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Adjust Chief Aim error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
