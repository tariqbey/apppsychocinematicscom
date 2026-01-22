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

    // Fetch user data for analysis
    const [
      { data: profile },
      { data: scorecards },
      { data: challenges },
      { data: tasks },
      { data: journals },
      { data: checkins },
      { data: characterProfile }
    ] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('character_scorecards').select('*').eq('user_id', user.id).order('scorecard_date', { ascending: false }).limit(14),
      supabase.from('adversity_challenges').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('daily_tasks').select('*').eq('user_id', user.id).order('task_date', { ascending: false }).limit(21),
      supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(7),
      supabase.from('daily_character_checkins').select('*').eq('user_id', user.id).order('checkin_date', { ascending: false }).limit(7),
      supabase.from('character_profiles').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)
    ]);

    // Calculate metrics
    const completedTasks = tasks?.filter(t => t.is_completed).length || 0;
    const totalTasks = tasks?.length || 0;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const completedChallenges = challenges?.filter(c => c.completed).length || 0;
    const totalChallenges = challenges?.length || 0;
    const cutChallenges = challenges?.filter(c => c.did_cut).length || 0;

    const avgScorecardScore = scorecards?.length 
      ? Math.round(scorecards.reduce((sum, s) => sum + (s.total_score || 0), 0) / scorecards.length)
      : 0;

    const recentMoods = journals?.map(j => j.mood).filter(Boolean) || [];
    const transformationCheckins = checkins?.filter(c => c.chose_transformation).length || 0;

    // Build context for AI
    const context = {
      userName: profile?.display_name || 'Director',
      chiefAim: profile?.chief_aim_what || 'Not set',
      currentStreak: profile?.current_streak || 0,
      archetype: characterProfile?.[0]?.archetype || 'Unknown',
      metrics: {
        taskCompletionRate,
        avgScorecardScore,
        completedChallenges,
        cutChallenges,
        totalChallenges,
        transformationCheckins,
        journalEntries: journals?.length || 0,
        recentMoods
      },
      recentReflections: journals?.slice(0, 3).map(j => j.content?.substring(0, 200)) || [],
      recentChallenges: challenges?.slice(0, 3).map(c => ({
        trigger: c.emotional_trigger,
        response: c.response_type,
        completed: c.completed,
        cut: c.did_cut
      })) || []
    };

    const systemPrompt = `You are the Director AI, a no-BS character transformation coach for Psycho-Cinematics™. 
You analyze user data and provide direct, actionable insights about their character development.

Speak in a supportive but challenging tone. Use film/director metaphors naturally.
Be specific and reference their actual data. No generic self-help fluff.

The user's name is ${context.userName}.
Their Chief Aim is: "${context.chiefAim}"
Their archetype is: ${context.archetype}
Current streak: ${context.currentStreak} days

PERFORMANCE METRICS:
- Task completion rate: ${context.metrics.taskCompletionRate}%
- Average scorecard score: ${context.metrics.avgScorecardScore}/12
- Challenges completed: ${context.metrics.completedChallenges}/${context.metrics.totalChallenges}
- Times they "cut" (gave up): ${context.metrics.cutChallenges}
- Transformation check-ins: ${context.metrics.transformationCheckins}
- Recent moods: ${context.metrics.recentMoods.join(', ') || 'Not recorded'}

RECENT JOURNAL EXCERPTS:
${context.recentReflections.join('\n---\n') || 'No recent entries'}

RECENT CHALLENGES:
${JSON.stringify(context.recentChallenges, null, 2)}`;

    const userPrompt = `Provide a comprehensive character analysis with these sections:

1. OVERALL ASSESSMENT (2-3 sentences on where they are in their transformation)
2. STRENGTHS SPOTLIGHT (2-3 specific things they're doing well, with data)
3. GROWTH EDGES (2-3 areas needing attention, be direct)
4. PATTERN RECOGNITION (any behavioral patterns you notice from the data)
5. DIRECTOR'S NOTE (a powerful, personalized message to motivate them)
6. NEXT SCENE (1 specific action they should take TODAY)

Return as JSON with keys: assessment, strengths (array), growthEdges (array), patterns (array), directorsNote, nextScene`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_analysis",
            description: "Create a structured character analysis",
            parameters: {
              type: "object",
              properties: {
                assessment: { type: "string", description: "Overall 2-3 sentence assessment" },
                strengths: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "2-3 specific strengths with data references"
                },
                growthEdges: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "2-3 areas needing improvement"
                },
                patterns: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "Behavioral patterns noticed"
                },
                directorsNote: { type: "string", description: "Motivational personalized message" },
                nextScene: { type: "string", description: "One specific action for today" },
                overallScore: { type: "number", description: "Overall character score 0-100" }
              },
              required: ["assessment", "strengths", "growthEdges", "patterns", "directorsNote", "nextScene", "overallScore"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "create_analysis" } }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", errorText);
      throw new Error("Failed to generate analysis");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("No analysis generated");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({
      analysis,
      metrics: context.metrics,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in analyze-character-progress:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
