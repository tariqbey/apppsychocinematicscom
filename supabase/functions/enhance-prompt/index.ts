import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cinematography enhancement knowledge
const CINEMATOGRAPHY_ENHANCEMENTS = {
  cameraAngles: [
    "low angle shot looking up, empowering perspective, heroic framing",
    "eye level shot, direct gaze, intimate connection with viewer",
    "dynamic dutch angle, tilted frame suggesting transformation",
    "bird's eye view, godlike perspective, seeing the complete picture",
    "over the shoulder shot, protagonist looking toward their future",
  ],
  lighting: [
    "golden hour lighting, warm sunlight, magical hour glow, optimistic atmosphere",
    "dramatic chiaroscuro lighting, bold shadows, powerful contrast",
    "dramatic rim lighting, glowing backlight, angelic halo effect",
    "soft diffused lighting, gentle flattering light, warmth and comfort",
    "cinematic volumetric lighting, god rays streaming through atmosphere",
  ],
  cameraSetups: [
    "shot on ARRI Alexa 65, large format cinematic sensor, ARRI color science",
    "shot on RED V-Raptor 8K, VistaVision sensor, cinematic color grading",
    "Cooke anamorphic lens, 2x squeeze, oval bokeh, characteristic lens flares",
    "Zeiss Master Prime lens T1.3, ultra sharp optics, smooth bokeh transition",
    "85mm lens f/1.4, shallow depth of field, creamy bokeh separation",
  ],
  quality: [
    "photorealistic, ultra high resolution, 8K quality",
    "cinematic film grain, professional color grading",
    "hyperdetailed, masterful composition, award-winning photography",
    "studio quality lighting, perfect exposure, rich dynamic range",
    "IMAX quality, theatrical presentation, pristine clarity",
  ],
  moods: {
    triumphant: "epic triumphant atmosphere, victorious golden light, heroic scale",
    peaceful: "serene tranquil mood, soft ethereal glow, meditative calm",
    powerful: "commanding presence, bold dramatic lighting, unstoppable energy",
    inspiring: "uplifting hopeful atmosphere, radiant optimism, limitless potential",
    focused: "intense concentration, sharp clarity, laser focus energy",
    luxurious: "opulent wealthy atmosphere, prestigious elegance, refined success",
  }
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

    const { prompt, context, imageType } = await req.json();

    if (!prompt?.trim()) {
      throw new Error("Prompt is required");
    }

    // Build context-aware system prompt
    let systemPrompt = `You are a master cinematographer and AI image prompt engineer. Your job is to transform simple prompts into rich, cinematic image generation prompts that produce stunning, professional-quality images.

ENHANCEMENT TECHNIQUES:
1. Add specific camera and lens details (ARRI Alexa, RED, Cooke Anamorphic, etc.)
2. Include precise lighting descriptions (golden hour, rim lighting, chiaroscuro, etc.)
3. Add composition and framing details (rule of thirds, leading lines, depth)
4. Include mood and atmosphere descriptors
5. Add technical quality markers (8K, photorealistic, cinematic color grading)
6. For portraits, add skin detail and eye sharpness descriptors

AVAILABLE ENHANCEMENT ELEMENTS:
Camera Angles: ${CINEMATOGRAPHY_ENHANCEMENTS.cameraAngles.join(", ")}
Lighting Styles: ${CINEMATOGRAPHY_ENHANCEMENTS.lighting.join(", ")}
Camera Setups: ${CINEMATOGRAPHY_ENHANCEMENTS.cameraSetups.join(", ")}
Quality Markers: ${CINEMATOGRAPHY_ENHANCEMENTS.quality.join(", ")}`;

    // Add context-specific guidance
    if (context?.chiefAim) {
      systemPrompt += `\n\nUSER'S CHIEF AIM (their major goal): ${context.chiefAim}
Incorporate visual elements that represent their journey toward this goal.`;
    }

    if (context?.movieTitle) {
      systemPrompt += `\n\nMIND MOVIE TITLE: ${context.movieTitle}
This image is for their personal visualization movie. Make it aspirational and emotionally powerful.`;
    }

    if (imageType === "poster" || imageType === "cover") {
      systemPrompt += `\n\nThis is for a MOVIE POSTER/COVER IMAGE:
- Use dramatic, high-impact composition
- Include space for potential text overlay
- Make it visually striking and memorable
- Use cinematic aspect ratio framing
- Add lens flares or dramatic lighting for impact`;
    } else if (imageType === "avatar" || imageType === "profile") {
      systemPrompt += `\n\nThis is for a PROFILE/AVATAR IMAGE:
- Focus on the subject's best features
- Use flattering portrait lighting
- Ensure the face is clear and well-lit
- Professional headshot quality
- Confident, approachable expression`;
    } else if (imageType === "scene" || imageType === "storyboard") {
      systemPrompt += `\n\nThis is for a STORYBOARD/SCENE:
- Tell a visual story
- Include emotional context
- Use cinematic composition
- Consider the narrative moment`;
    }

    systemPrompt += `

OUTPUT RULES:
1. Return ONLY the enhanced prompt - no explanations, no preamble
2. Keep the enhanced prompt between 100-200 words
3. Preserve the user's core intent while elevating the visual quality
4. Always include at least one camera/lens specification
5. Always include lighting direction
6. End with quality markers`;

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
          { role: "user", content: `Enhance this image prompt for maximum cinematic impact:\n\n"${prompt}"` }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const enhancedPrompt = data.choices?.[0]?.message?.content?.trim();

    if (!enhancedPrompt) {
      throw new Error("Failed to generate enhanced prompt");
    }

    return new Response(JSON.stringify({ 
      enhancedPrompt,
      originalPrompt: prompt 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("enhance-prompt error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Failed to enhance prompt" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
