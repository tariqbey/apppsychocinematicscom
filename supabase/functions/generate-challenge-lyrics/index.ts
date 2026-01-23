import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// NLP-infused songwriting techniques for character transformation
const NLP_SONGWRITING_SYSTEM = `
## NEURO-LINGUISTIC PROGRAMMING IN LYRICS

You are a master songwriter who understands the power of language on the subconscious mind.
Your lyrics must incorporate these NLP principles:

### 1. EMBEDDED COMMANDS
- Hide direct commands within longer sentences
- Example: "When you FEEL YOUR POWER RISING, everything changes"
- The capitalized portion is the embedded command the subconscious receives

### 2. PRESUPPOSITIONS
- Assume the transformation has already occurred
- "As you continue to embody [trait]..." (presupposes they're already doing it)
- "The more you master [skill], the stronger you become"

### 3. TIMELINE LANGUAGE
- Move pain to the past: "There was a time when fear controlled me"
- Anchor power in the present: "Now I stand in my strength"
- Project success into the future: "And I will continue to rise"

### 4. IDENTITY STATEMENTS
- Use "I am" statements (present, first person)
- Attach traits to identity: "I AM a person of unshakeable confidence"
- Make it about WHO they are, not what they do

### 5. SENSORY-RICH LANGUAGE
- Visual: "I see myself standing tall"
- Auditory: "I hear my voice commanding respect"
- Kinesthetic: "I feel the power in my bones"

### 6. PATTERN INTERRUPTS
- Break negative patterns with unexpected language
- Use contrasts: "What once was fear is now fuel"
- Create cognitive disruption that opens the mind

### 7. METAPHORICAL TRANSFORMATION
- Use metaphors that imply change is natural/inevitable
- "Like the phoenix", "Like water finding its path", "Like the sun rising"
- Avoid clichés - make metaphors specific to their journey

### STRUCTURE FOR CHALLENGE TRANSFORMATION SONGS

The song should follow this emotional arc:

[VERSE 1: THE TRIGGER]
- Acknowledge the challenge scenario
- Name the emotional trigger (without dwelling)
- Hint at the old pattern

[PRE-CHORUS: THE KUT!]
- The moment of conscious choice
- "I take a breath", "I pause", "I see through the illusion"
- The interrupt that breaks the pattern

[CHORUS: THE TRANSFORMED RESPONSE]
- The new identity in action
- Powerful "I am" statements
- The trait being embodied at full power
- This is the mantra - simple, memorable, singable

[VERSE 2: THE STRATEGY]
- How they navigate with the new trait
- Specific actions that demonstrate the change
- The "exchange" - what they give up (fear, doubt, old patterns)

[BRIDGE: THE BREAKTHROUGH]
- Emotional peak - the moment of full embodiment
- Often uses metaphor of transformation
- Can reference archetype if provided

[FINAL CHORUS + OUTRO: VICTORY]
- Amplified version of chorus
- Celebration and gratitude
- Future-paced success - "And every day I grow stronger"
`;

interface ChallengeContext {
  situationDescription: string;
  targetTrait: string;
  emotionalTrigger: string;
  scenarioType: string;
  visualizationScript?: string;
}

interface ArchetypeContext {
  name: string;
  tagline: string;
  strengths: string[];
  weaknesses: string[];
  lightShadow: { light: string; shadow: string };
}

interface ChiefAimContext {
  what: string | null;
  byWhen: string | null;
  exchange: string | null;
  plan: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const { challenge, archetype, chiefAim, musicStyle } = await req.json() as {
      challenge: ChallengeContext;
      archetype: ArchetypeContext | null;
      chiefAim: ChiefAimContext | null;
      musicStyle: string;
    };

    console.log("[generate-challenge-lyrics] Generating for trait:", challenge.targetTrait);

    // Build archetype context if available
    let archetypeSection = "";
    if (archetype) {
      archetypeSection = `
## CHARACTER ARCHETYPE: ${archetype.name}
Tagline: "${archetype.tagline}"
Strengths to embody: ${archetype.strengths.join(", ")}
Shadow to transcend: ${archetype.lightShadow.shadow}
Light expression: ${archetype.lightShadow.light}
`;
    }

    // Build Chief Aim context if available
    let chiefAimSection = "";
    if (chiefAim?.what) {
      chiefAimSection = `
## THE DEFINITE CHIEF AIM
The Dream: ${chiefAim.what}
${chiefAim.byWhen ? `The Deadline: ${chiefAim.byWhen}` : ""}
${chiefAim.exchange ? `The Exchange: ${chiefAim.exchange}` : ""}
${chiefAim.plan ? `The Plan: ${chiefAim.plan}` : ""}
`;
    }

    // Build the system prompt
    const systemPrompt = `You are a master songwriter creating a powerful transformation anthem for someone facing a specific challenge.

${NLP_SONGWRITING_SYSTEM}

${archetypeSection}

${chiefAimSection}

## THE ADVERSITY CHALLENGE

Scenario Type: ${challenge.scenarioType}
Situation: ${challenge.situationDescription}
Emotional Trigger: "${challenge.emotionalTrigger}"
Trait Being Developed: ${challenge.targetTrait}

${challenge.visualizationScript ? `
## VISUALIZATION SCRIPT (for imagery reference)
${challenge.visualizationScript}
` : ""}

## MUSIC STYLE: ${musicStyle}

Create lyrics that match the authentic sound and conventions of ${musicStyle} music.

## YOUR TASK

Write complete song lyrics that:
1. Transform the challenge into a victory anthem for the "${challenge.targetTrait}" trait
2. Use NLP techniques throughout (embedded commands, presuppositions, identity statements)
3. Follow the emotional arc from trigger → KUT! → transformed response → victory
4. Are specific to THIS challenge, not generic motivation
5. Would sound AUTHENTIC to ${musicStyle} - not corny or preachy
6. Use sophisticated metaphors and wordplay befitting the genre
7. Make the chorus a powerful, memorable mantra they can repeat

## OUTPUT FORMAT

Return lyrics in this structure:

[VERSE 1]
(8-12 lines - the challenge scenario)

[PRE-CHORUS]
(4 lines - the KUT! moment)

[CHORUS]
(6-8 lines - transformed identity anthem)

[VERSE 2]
(8-12 lines - the strategy and action)

[BRIDGE]
(4-6 lines - emotional breakthrough)

[CHORUS]
(repeat)

[OUTRO]
(4 lines - future-paced victory)

Write the complete lyrics now. Make them powerful, genre-authentic, and deeply personal to this challenge.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Write a ${musicStyle} song for overcoming this challenge and embodying ${challenge.targetTrait}. Make it hit hard and authentic to the genre.` 
          }
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[generate-challenge-lyrics] AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const lyrics = data.choices?.[0]?.message?.content;

    if (!lyrics) {
      throw new Error("No lyrics generated");
    }

    console.log("[generate-challenge-lyrics] Successfully generated lyrics");

    return new Response(
      JSON.stringify({ lyrics }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[generate-challenge-lyrics] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
