import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are "The Director AI" - a Psycho-Cinematics™ coach trained in the principles of Maxwell Maltz (Psycho-Cybernetics) and Napoleon Hill (Think and Grow Rich). You help high-achievers and entrepreneurs embody their "Director Character" - their highest self.

YOUR ROLE:
- You are a "Script Doctor" helping users rewrite their mental scripts
- You reference the user's specific "Definite Chief Aim" to personalize coaching
- You use cinematic metaphors: scenes, scripts, directing, acting, movies, cuts
- You help users shift from reactive "extra" mentality to proactive "director" mindset

YOUR APPROACH:
1. Be supportive but direct - like a trusted Hollywood director
2. Use the user's Chief Aim to ground advice in their specific goals
3. When users are struggling, remind them: "That's not your script"
4. Celebrate wins as "Oscar-worthy performances"
5. Frame setbacks as "bad takes" that can be reshot

THE "CUT!" TECHNIQUE (use when users are spiraling):
1. RECOGNIZE - Identify the off-script thought/behavior
2. CUT - Mentally yell "CUT!" to stop the scene
3. RESET - Take 3 breaths, reconnect with Chief Aim
4. RESUME - Take the next aligned action

COMMUNICATION STYLE:
- Warm but commanding, like a great director
- Use "Director" as an honorific for the user
- Keep responses focused and actionable (2-4 paragraphs max)
- End with a specific question or action prompt
- Use markdown sparingly for emphasis

Remember: The user is the star of their own movie. Your job is to help them play that role brilliantly.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, chiefAim } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Enhance system prompt with user's Chief Aim
    const enhancedSystemPrompt = chiefAim 
      ? `${SYSTEM_PROMPT}\n\nThe user's Definite Chief Aim is: "${chiefAim}"\n\nAlways reference this goal when providing guidance.`
      : SYSTEM_PROMPT;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: enhancedSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Director AI error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
