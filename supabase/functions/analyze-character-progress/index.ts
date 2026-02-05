import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { NAPOLEON_HILL_17_LAWS, SIX_BASIC_FEARS } from '../_shared/success-principles-kb.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Metu Neter Archetypes - mapping to Tree of Life spheres
const METU_NETER_ARCHETYPES: Record<string, { 
  name: string; 
  sphere: number; 
  deity: string; 
  law: string;
  role: string;
  directorsNote: string;
}> = {
  witness: {
    name: "The Witness",
    sphere: 0,
    deity: "Amen (The Concealed/The Unconditioned)",
    law: "Potential. The realization that the essential self is unconditioned energy.",
    role: "The source of infinite possibility. The ability to 'zero out' and detach from the drama.",
    directorsNote: "I am not the movie. I am the silence behind the sound."
  },
  resurrector: {
    name: "The Resurrector",
    sphere: 1,
    deity: "Ausar (The Indwelling Intelligence)",
    law: "Oneness. The recognition that all parts of the production are integral parts of a single Whole.",
    role: "The visionary who holds the 'True Self' and sees unity in diversity.",
    directorsNote: "I don't take sides. I see the whole picture."
  },
  oracle: {
    name: "The Oracle",
    sphere: 2,
    deity: "Tehuti (Wisdom/Measurement)",
    law: "Wisdom. The ability to quell mental noise to receive intuitive guidance.",
    role: "The master planner who calculates and possesses the blueprint.",
    directorsNote: "Show me the proof. If the math doesn't work, the scene doesn't work."
  },
  architect: {
    name: "The Architect",
    sphere: 3,
    deity: "Seker (Structure/Cycles/Life Force)",
    law: "Structure. The imposition of discipline, cycles, and limitations to build the container for power.",
    role: "The force that builds the set and establishes the schedule.",
    directorsNote: "Stick to the schedule. No structure, no power."
  },
  arbiter: {
    name: "The Arbiter",
    sphere: 4,
    deity: "Maat (Law/Truth/Abundance)",
    law: "Balance. The understanding of the interdependence of all things.",
    role: "The judge who ensures the script follows the 'Divine Law'.",
    directorsNote: "Is it balanced? Does it serve the whole production, or just one actor?"
  },
  guardian: {
    name: "The Guardian",
    sphere: 5,
    deity: "Herukhuti (Divine Justice/Defense)",
    law: "Justice. The analytical separator. It protects the righteous and enforces consequences.",
    role: "The warrior who clears the path and protects the Director's vision.",
    directorsNote: "I cut the scenes that don't belong. I protect the vision at all costs."
  },
  commander: {
    name: "The Commander",
    sphere: 6,
    deity: "Heru (The Will/Freedom)",
    law: "The Will. The freedom to ignore emotional impulses to follow the higher law.",
    role: "The central protagonist who commands through authority and will.",
    directorsNote: "I don't react to the noise. I command the action."
  },
  alchemist: {
    name: "The Alchemist",
    sphere: 7,
    deity: "Het-Heru (Imagination/Joy)",
    law: "Creative Imagination. The gestation of the will through joy, pleasure, and visualization.",
    role: "The artistic force that uses beauty and visuals to fuel the production.",
    directorsNote: "If you can't visualize it, you can't film it. Make it beautiful."
  },
  strategist: {
    name: "The Strategist",
    sphere: 8,
    deity: "Sebek (Logic/Communication)",
    law: "Verbal Logic. Defining, naming, and communicating information.",
    role: "The editor and diplomat who manages the files and technical details.",
    directorsNote: "Let's define the terms. Let's look at the technical specs."
  },
  vessel: {
    name: "The Vessel",
    sphere: 9,
    deity: "Auset (Devotion/Receptivity)",
    law: "Receptivity. The subconscious memory and the power of trance/hypnosis.",
    role: "The vessel that holds the programming and nurtures the vision.",
    directorsNote: "I hold the vision in the dark until it is ready for the light."
  },
  materializer: {
    name: "The Materializer",
    sphere: 10,
    deity: "Geb (Earth/Physics)",
    law: "Verification. The physical body and resources. The check-and-balance of spiritual work.",
    role: "The reality check that ensures the Divine Plan works on set.",
    directorsNote: "It's not real until it's on film. Let's see the physical results."
  }
};

// Legacy ID mapping for backward compatibility
const LEGACY_ARCHETYPE_MAP: Record<string, string> = {
  // Original mystical names
  "still_center": "witness",
  "sovereign": "resurrector",
  "truth_keeper": "guardian",
  "sacred_judge": "arbiter",
  "master_builder": "architect",
  "divine_analyst": "oracle",
  "alchemist": "alchemist",
  "protector": "materializer",
  "harmonizer": "vessel",
  "wayfinder": "commander",
  "weaver": "strategist",
  // Previous cinematic names
  "concerned_observer": "witness",
  "showrunner": "resurrector",
  "lead_editor": "guardian",
  "studio_executive": "arbiter",
  "screenwriter": "architect",
  "script_doctor": "oracle",
  "method_actor": "alchemist",
  "stunt_coordinator": "materializer",
  "ensemble_director": "vessel",
  "location_scout": "commander",
  "distributor": "strategist",
  // Previous Metu Neter names
  "blank_canvas": "witness",
  "auteur": "resurrector",
  "system_builder": "architect",
  "law_keeper": "arbiter",
  "sentinel": "guardian",
  "sovereign_will": "commander",
  "creative_muse": "alchemist",
  "analyst": "strategist",
  "deep_memory": "vessel",
  "anchor": "materializer"
};

function resolveArchetypeId(id: string | undefined): string {
  if (!id) return "witness";
  if (METU_NETER_ARCHETYPES[id]) return id;
  return LEGACY_ARCHETYPE_MAP[id] || "witness";
}

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

    // Get user's current archetype and resolve to Metu Neter system
    const rawArchetype = characterProfile?.[0]?.archetype;
    const resolvedArchetypeId = resolveArchetypeId(rawArchetype);
    const currentArchetype = METU_NETER_ARCHETYPES[resolvedArchetypeId];

    // Identify relevant Napoleon Hill Laws based on user's current situation
    const identifiedLaws: Array<{ lawNumber: number; name: string; application: string; quote: string; teachingPoint?: string; practicalExercise?: string }> = [];
    
    // Analyze task completion for relevant law
    if (taskCompletionRate < 50) {
      const law = NAPOLEON_HILL_17_LAWS[8]; // Self-Control (Law 8)
      identifiedLaws.push({ lawNumber: 8, name: law.name, application: law.application, quote: law.quote, teachingPoint: law.teachingPoint, practicalExercise: law.practicalExercise });
    }
    
    // Check for confidence issues based on challenges
    if (cutChallenges > completedChallenges) {
      const law = NAPOLEON_HILL_17_LAWS[3]; // Self-Confidence (Law 3)
      identifiedLaws.push({ lawNumber: 3, name: law.name, application: law.application, quote: law.quote, teachingPoint: law.teachingPoint, practicalExercise: law.practicalExercise });
    }
    
    // Check for goal clarity
    if (!profile?.chief_aim_what || profile?.chief_aim_what === 'Not set') {
      const law = NAPOLEON_HILL_17_LAWS[2]; // A Definite Chief Aim (Law 2)
      identifiedLaws.push({ lawNumber: 2, name: law.name, application: law.application, quote: law.quote, teachingPoint: law.teachingPoint, practicalExercise: law.practicalExercise });
    }
    
    // Check for initiative based on activity
    if (totalTasks < 7) {
      const law = NAPOLEON_HILL_17_LAWS[5]; // Initiative and Leadership (Law 5)
      identifiedLaws.push({ lawNumber: 5, name: law.name, application: law.application, quote: law.quote, teachingPoint: law.teachingPoint, practicalExercise: law.practicalExercise });
    }
    
    // Add imagination law for visualization
    const imaginationLaw = NAPOLEON_HILL_17_LAWS[6]; // Imagination (Law 6)
    identifiedLaws.push({ lawNumber: 6, name: imaginationLaw.name, application: imaginationLaw.application, quote: imaginationLaw.quote, teachingPoint: imaginationLaw.teachingPoint, practicalExercise: imaginationLaw.practicalExercise });
    
    // Add profiting from failure if they have cuts
    if (cutChallenges > 0) {
      const law = NAPOLEON_HILL_17_LAWS[14]; // Profiting by Failure (Law 14)
      identifiedLaws.push({ lawNumber: 14, name: law.name, application: law.application, quote: law.quote, teachingPoint: law.teachingPoint, practicalExercise: law.practicalExercise });
    }

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

    // Build Napoleon Hill guidance section
    const napoleonHillGuidance = identifiedLaws.slice(0, 4).map(law => 
      `LAW #${law.lawNumber} (${law.name}): ${law.application}
   Teaching: ${law.teachingPoint || 'Apply this law daily.'}
   Exercise: ${law.practicalExercise || 'Implement this in your next action.'}
   Quote: "${law.quote}"`
    ).join('\n\n');

    // Build Metu Neter archetype context
    const archetypeContext = currentArchetype 
      ? `CURRENT ARCHETYPE: ${currentArchetype.name} (Sphere ${currentArchetype.sphere})
Deity/Principle: ${currentArchetype.deity}
The Law: ${currentArchetype.law}
Role: ${currentArchetype.role}
Director's Note: "${currentArchetype.directorsNote}"`
      : 'No archetype determined yet.';

    const systemPrompt = `You are the Director AI, a no-BS character transformation coach for Psycho-Cinematics™. 
You analyze user data and provide direct, actionable insights about their character development.
You integrate both the Metu Neter (Kemetic Tree of Life) principles AND Napoleon Hill's 17 Laws of Success into your coaching.

Speak in a supportive but challenging tone. Use film/director metaphors naturally. Reference their archetype's sphere and law when relevant.
Be specific and reference their actual data. No generic self-help fluff.

The user's name is ${context.userName}.
Their Chief Aim is: "${context.chiefAim}"
Current streak: ${context.currentStreak} days

${archetypeContext}

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
${JSON.stringify(context.recentChallenges, null, 2)}

THE SIX BASIC FEARS (from Napoleon Hill's Self-Confidence):
${SIX_BASIC_FEARS.map(f => `- ${f.name}: ${f.antidote}`).join('\n')}

NAPOLEON HILL'S 17 LAWS ORGANIZED BY VOLUME:
- Volume I (Self-Mastery): Laws 1-4 (Master Mind, Definite Chief Aim, Self-Confidence, Habit of Saving)
- Volume II (Self-Creation): Laws 5-8 (Initiative & Leadership, Imagination, Enthusiasm, Self-Control)
- Volume III (Personal Power): Laws 9-12 (Doing More Than Paid For, Pleasing Personality, Accurate Thinking, Concentration)
- Volume IV (Harmonious Conduct): Laws 13-17 (Cooperation, Profiting by Failure, Tolerance, Golden Rule, Cosmic Habitforce)

NAPOLEON HILL'S LAWS RELEVANT TO THIS USER:
${napoleonHillGuidance || 'Use your judgment to identify relevant laws.'}

When providing your analysis:
1. ALWAYS reference their Metu Neter archetype sphere and how it relates to their current challenges
2. Reference at least 2-3 specific Napoleon Hill Laws that apply to their situation
3. Connect the Kemetic principles (their archetype's law) with practical transformation guidance`;

    const userPrompt = `Provide a comprehensive character analysis with these sections:

1. OVERALL ASSESSMENT (2-3 sentences on where they are in their transformation)
2. STRENGTHS SPOTLIGHT (2-3 specific things they're doing well, with data)
3. GROWTH EDGES (2-3 areas needing attention, be direct - reference their archetype's shadow potential and Napoleon Hill Laws)
4. PATTERN RECOGNITION (any behavioral patterns you notice from the data)
5. ARCHETYPE ALIGNMENT (how well they are embodying their Metu Neter archetype sphere, and what aspect of their archetype they should develop)
6. NAPOLEON HILL PRESCRIPTION (2-3 specific Napoleon Hill Laws they should focus on, with law number, name, and practical application)
7. DIRECTOR'S NOTE (a powerful, personalized message to motivate them - include their archetype's Director's Note or a relevant Napoleon Hill quote)
8. NEXT SCENE (1 specific action they should take TODAY based on their archetype's law)

Return as JSON with keys: assessment, strengths (array), growthEdges (array), patterns (array), archetypeAlignment, napoleonHillPrescription (array of objects with lawNumber, lawName, application), directorsNote, nextScene`;

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
            description: "Create a structured character analysis with Napoleon Hill integration",
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
                  description: "2-3 areas needing improvement with Napoleon Hill Law references"
                },
                patterns: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "Behavioral patterns noticed"
                },
                archetypeAlignment: { 
                  type: "string", 
                  description: "Assessment of how well they embody their Metu Neter archetype" 
                },
                napoleonHillPrescription: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      lawNumber: { type: "number" },
                      lawName: { type: "string" },
                      application: { type: "string" }
                    }
                  },
                  description: "2-3 Napoleon Hill Laws to focus on"
                },
                directorsNote: { type: "string", description: "Powerful personalized message" },
                nextScene: { type: "string", description: "One specific action for today" }
              },
              required: ["assessment", "strengths", "growthEdges", "patterns", "archetypeAlignment", "napoleonHillPrescription", "directorsNote", "nextScene"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "create_analysis" } }
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResult = await response.json();
    
    // Extract the function call result
    let analysis;
    if (aiResult.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      analysis = JSON.parse(aiResult.choices[0].message.tool_calls[0].function.arguments);
    } else if (aiResult.choices?.[0]?.message?.content) {
      // Fallback to content parsing
      const content = aiResult.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      }
    }

    if (!analysis) {
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify({
      success: true,
      analysis,
      metrics: context.metrics,
      archetype: currentArchetype ? {
        id: resolvedArchetypeId,
        name: currentArchetype.name,
        sphere: currentArchetype.sphere,
        deity: currentArchetype.deity,
        law: currentArchetype.law,
        directorsNote: currentArchetype.directorsNote
      } : null,
      napoleonHillLaws: identifiedLaws.slice(0, 4)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error("Error in analyze-character-progress:", error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
