import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { scriptId, frameDataUrls } = await req.json();

    if (!scriptId) {
      return new Response(JSON.stringify({ error: 'Script ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch the mind movie script
    const { data: script, error: scriptError } = await supabase
      .from('mind_movie_scripts')
      .select('*')
      .eq('id', scriptId)
      .eq('user_id', user.id)
      .single();

    if (scriptError || !script) {
      return new Response(JSON.stringify({ error: 'Mind movie not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch user's Chief Aim and profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Fetch active episode if any
    const { data: activeEpisode } = await supabase
      .from('episodes')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const chiefAim = script.chief_aim_snapshot || {
      what: profile?.chief_aim_what,
      byWhen: profile?.chief_aim_by_when,
      exchange: profile?.chief_aim_exchange,
      plan: profile?.chief_aim_plan
    };

    const scenes = script.scenes || [];
    
    // Build content for Gemini analysis
    const sceneDescriptions = scenes.map((scene: any, i: number) => 
      `Scene ${i + 1}: "${scene.title}" - ${scene.narrative} (Emotional tone: ${scene.emotionalTone})`
    ).join('\n');

    const lyrics = script.song_lyrics ? `\nSoundtrack Lyrics:\n${script.song_lyrics}` : '';

    // Build the multimodal message
    const messageContent: any[] = [];

    // Add text context first
    messageContent.push({
      type: "text",
      text: `You are analyzing a user's Mind Movie for the Psycho-Cinematics™ transformation system.

## THE USER'S VISION
**Chief Aim (What):** ${chiefAim?.what || 'Not specified'}
**Deadline (By When):** ${chiefAim?.byWhen || 'Not specified'}
**Exchange (What I Give):** ${chiefAim?.exchange || 'Not specified'}
**Plan (How):** ${chiefAim?.plan || 'Not specified'}

## MOVIE DETAILS
**Title:** ${script.title || 'Untitled'}
**Visual Style:** ${script.visual_style || 'Cinematic'}
${activeEpisode ? `\n**Current Episode:** ${activeEpisode.title} - ${activeEpisode.objective}` : ''}

## SCENE BREAKDOWN
${sceneDescriptions}
${lyrics}

${frameDataUrls?.length ? `I'm also providing ${frameDataUrls.length} key frames from their Mind Movie for visual analysis.` : ''}

Based on this Mind Movie and the user's Chief Aim, provide:
1. **Movie Analysis** - What themes and transformation goals are embedded in this visualization?
2. **Alignment Score** - How well does this movie align with their stated Chief Aim? (0-100)
3. **Today's Three Actions** - 3 specific, actionable tasks for TODAY that will move them closer to what's shown in their movie
4. **Director's Insight** - One powerful observation about their subconscious goals based on the imagery/scenes
5. **Missing Element** - What's one thing NOT in their movie that should be added for completeness?`
    });

    // Add images if provided (key frames from the movie)
    if (frameDataUrls?.length > 0) {
      for (const dataUrl of frameDataUrls.slice(0, 6)) { // Max 6 frames
        if (dataUrl && dataUrl.startsWith('data:image')) {
          const base64Data = dataUrl.split(',')[1];
          const mimeType = dataUrl.split(';')[0].split(':')[1];
          messageContent.push({
            type: "image_url",
            image_url: {
              url: dataUrl
            }
          });
        }
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use Gemini Pro for multimodal analysis
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro", // Use Pro for better image understanding
        messages: [
          { 
            role: "user", 
            content: messageContent 
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_movie_analysis",
            description: "Create a structured Mind Movie analysis with daily action suggestions",
            parameters: {
              type: "object",
              properties: {
                movieAnalysis: { 
                  type: "string", 
                  description: "2-3 sentences analyzing the transformation themes in the movie" 
                },
                alignmentScore: { 
                  type: "number", 
                  description: "How well the movie aligns with their Chief Aim (0-100)" 
                },
                todaysActions: { 
                  type: "array", 
                  items: { 
                    type: "object",
                    properties: {
                      action: { type: "string", description: "The specific action to take" },
                      connection: { type: "string", description: "How this connects to their movie/vision" }
                    },
                    required: ["action", "connection"]
                  },
                  description: "3 specific actions for today based on the movie content"
                },
                directorsInsight: { 
                  type: "string", 
                  description: "A powerful observation about their subconscious goals" 
                },
                missingElement: { 
                  type: "string", 
                  description: "One thing that should be added to their movie" 
                }
              },
              required: ["movieAnalysis", "alignmentScore", "todaysActions", "directorsInsight", "missingElement"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "create_movie_analysis" } }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      throw new Error("Failed to analyze mind movie");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("No analysis generated");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({
      analysis,
      movieTitle: script.title,
      sceneCount: scenes.length,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in analyze-mind-movie:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
