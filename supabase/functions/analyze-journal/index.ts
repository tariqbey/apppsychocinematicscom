import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Psycho-Cinematics knowledge for context
const PSYCHO_CINEMATICS_CONTEXT = `
You are a Psycho-Cinematics™ coach analyzing a user's journal entries. The methodology is based on:

1. **Identity-First Transformation**: Users rewrite their self-image through visualization and daily practice
2. **The Definite Chief Aim**: A clear, emotionally charged vision of their future self
3. **Mind Movies**: Daily visualization of achieving their goals
4. **7-Phase Framework**: The journey from awakening to mastery

Your role is to:
- Identify patterns in their thinking and behavior
- Recognize breakthrough moments and struggles
- Track alignment with their Chief Aim
- Provide constructive, encouraging feedback
- Hold them accountable to their stated goals
- Celebrate progress while gently addressing areas for growth

Speak as a supportive director guiding their life's production.
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { entryId, analysisType = "single" } = await req.json();

    // Fetch user's profile for Chief Aim context
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("chief_aim_what, chief_aim_by_when, chief_aim_plan, current_streak, best_streak")
      .eq("user_id", user.id)
      .single();

    let entries: any[] = [];
    
    if (analysisType === "single" && entryId) {
      // Analyze a single entry
      const { data } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("id", entryId)
        .eq("user_id", user.id)
        .single();
      
      if (data) entries = [data];
    } else if (analysisType === "progress") {
      // Analyze last 7 days of entries for progress report
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: true });
      
      entries = data || [];
    } else if (analysisType === "accountability") {
      // Analyze last 30 days for accountability check
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true });
      
      entries = data || [];
    }

    if (entries.length === 0) {
      return new Response(JSON.stringify({ 
        analysis: "No journal entries found for analysis. Start recording your journey to receive personalized insights!" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build prompt based on analysis type
    let userPrompt = "";
    
    if (analysisType === "single") {
      const entry = entries[0];
      userPrompt = `
Analyze this journal entry and provide insightful feedback:

**Entry Title:** ${entry.title || "Untitled"}
**Mood:** ${entry.mood || "Not specified"}
**Content:** ${entry.content}
**Tags:** ${entry.tags?.join(", ") || "None"}

Provide:
1. Key insight about their mindset
2. How this relates to their Chief Aim (if applicable)
3. One actionable suggestion
4. A word of encouragement

Keep response under 200 words.
`;
    } else if (analysisType === "progress") {
      const entrySummaries = entries.map((e, i) => 
        `Day ${i + 1}: "${e.title || 'Entry'}" - Mood: ${e.mood || 'N/A'} - ${e.content.substring(0, 100)}...`
      ).join("\n");
      
      userPrompt = `
Analyze this week's journal entries and provide a progress report:

**Entries this week:**
${entrySummaries}

**Their Chief Aim:** ${profile?.chief_aim_what || "Not defined"}
**Current Streak:** ${profile?.current_streak || 0} days

Provide:
1. Overall progress assessment (2-3 sentences)
2. Patterns noticed (positive and challenging)
3. Alignment with Chief Aim score (1-10) with brief explanation
4. Top recommendation for next week
5. Motivational closing

Keep response under 300 words.
`;
    } else if (analysisType === "accountability") {
      const moodCounts: Record<string, number> = {};
      const tagCounts: Record<string, number> = {};
      
      entries.forEach(e => {
        if (e.mood) moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
        e.tags?.forEach((t: string) => tagCounts[t] = (tagCounts[t] || 0) + 1);
      });
      
      userPrompt = `
Provide an accountability report for the past 30 days:

**Total Entries:** ${entries.length}
**Mood Distribution:** ${JSON.stringify(moodCounts)}
**Topic Focus:** ${JSON.stringify(tagCounts)}
**Chief Aim:** ${profile?.chief_aim_what || "Not defined"}
**Target Date:** ${profile?.chief_aim_by_when || "Not set"}
**Best Streak:** ${profile?.best_streak || 0} days

Based on their journaling patterns:
1. Consistency assessment (are they showing up daily?)
2. Mindset trajectory (improving, stable, or declining?)
3. Action vs. reflection balance
4. Chief Aim alignment score (1-10)
5. Areas needing attention
6. Specific accountability challenge for next month
7. Recognition of their wins

Be direct but supportive. This is an accountability check.
Keep response under 400 words.
`;
    }

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: PSYCHO_CINEMATICS_CONTEXT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const analysis = aiResponse.choices?.[0]?.message?.content || "Unable to generate analysis.";

    // For single entry analysis: also tag relevant laws + fear signals
    let relevantLaws: string[] = [];
    let fearSignals: string[] = [];
    if (analysisType === "single" && entryId) {
      try {
        const tagResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content: `You tag a journal entry against Napoleon Hill's 17 Laws of Success and his Six Basic Fears.

LAWS (use the exact names): Definite Chief Aim, Self-Confidence, Habit of Saving, Initiative and Leadership, Imagination, Enthusiasm, Self-Control, Doing More Than Paid For, Pleasing Personality, Accurate Thinking, Concentration, Cooperation (Master Mind), Profiting from Failure, Tolerance, The Golden Rule, Cosmic Habitforce, The Master Mind.

FEARS (use exactly): Fear of Poverty, Fear of Criticism, Fear of Ill Health, Fear of Loss of Love, Fear of Old Age, Fear of Death.

Return ONLY valid JSON, no prose, no markdown fences:
{"relevant_laws":["..."],"fear_signals":["..."]}
Pick at most 3 laws and at most 2 fears. Use empty arrays if nothing applies.`,
              },
              { role: "user", content: entries[0].content?.substring(0, 4000) || "" },
            ],
            response_format: { type: "json_object" },
          }),
        });
        if (tagResp.ok) {
          const tj = await tagResp.json();
          const raw = tj.choices?.[0]?.message?.content || "{}";
          const parsed = JSON.parse(raw);
          relevantLaws = Array.isArray(parsed.relevant_laws) ? parsed.relevant_laws.slice(0, 3) : [];
          fearSignals = Array.isArray(parsed.fear_signals) ? parsed.fear_signals.slice(0, 2) : [];
        }
      } catch (e) {
        console.error("Law/fear tagging failed:", e);
      }
    }

    // If single entry, save the analysis to the entry
    if (analysisType === "single" && entryId) {
      await supabase
        .from("journal_entries")
        .update({
          ai_analysis: analysis,
          ai_analyzed_at: new Date().toISOString(),
          relevant_laws: relevantLaws,
          fear_signals: fearSignals,
        })
        .eq("id", entryId)
        .eq("user_id", user.id);
    }

    return new Response(JSON.stringify({
      analysis,
      analysisType,
      entriesAnalyzed: entries.length,
      relevant_laws: relevantLaws,
      fear_signals: fearSignals,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("analyze-journal error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});