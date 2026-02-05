import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { NAPOLEON_HILL_17_LAWS } from '../_shared/success-principles-kb.ts';

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
  blank_canvas: {
    name: "The Blank Canvas",
    sphere: 0,
    deity: "Amen (The Concealed/The Unconditioned)",
    law: "Potential. The realization that the essential self is unconditioned energy.",
    role: "The source of infinite possibility. The ability to 'zero out' and detach from the drama.",
    directorsNote: "I am not the movie. I am the silence behind the sound."
  },
  auteur: {
    name: "The Auteur",
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
  system_builder: {
    name: "The System Builder",
    sphere: 3,
    deity: "Seker (Structure/Cycles/Life Force)",
    law: "Structure. The imposition of discipline, cycles, and limitations to build the container for power.",
    role: "The force that builds the set and establishes the schedule.",
    directorsNote: "Stick to the schedule. No structure, no power."
  },
  law_keeper: {
    name: "The Law Keeper",
    sphere: 4,
    deity: "Maat (Law/Truth/Abundance)",
    law: "Balance. The understanding of the interdependence of all things.",
    role: "The judge who ensures the script follows the 'Divine Law'.",
    directorsNote: "Is it balanced? Does it serve the whole production, or just one actor?"
  },
  sentinel: {
    name: "The Sentinel",
    sphere: 5,
    deity: "Herukhuti (Divine Justice/Defense)",
    law: "Justice. The analytical separator. It protects the righteous and enforces consequences.",
    role: "The warrior who clears the path and protects the Director's vision.",
    directorsNote: "I cut the scenes that don't belong. I protect the vision at all costs."
  },
  sovereign_will: {
    name: "The Sovereign Will",
    sphere: 6,
    deity: "Heru (The Will/Freedom)",
    law: "The Will. The freedom to ignore emotional impulses to follow the higher law.",
    role: "The central protagonist who commands through authority and will.",
    directorsNote: "I don't react to the noise. I command the action."
  },
  creative_muse: {
    name: "The Creative Muse",
    sphere: 7,
    deity: "Het-Heru (Imagination/Joy)",
    law: "Creative Imagination. The gestation of the will through joy, pleasure, and visualization.",
    role: "The artistic force that uses beauty and visuals to fuel the production.",
    directorsNote: "If you can't visualize it, you can't film it. Make it beautiful."
  },
  analyst: {
    name: "The Analyst",
    sphere: 8,
    deity: "Sebek (Logic/Communication)",
    law: "Verbal Logic. Defining, naming, and communicating information.",
    role: "The editor and diplomat who manages the files and technical details.",
    directorsNote: "Let's define the terms. Let's look at the technical specs."
  },
  deep_memory: {
    name: "The Deep Memory",
    sphere: 9,
    deity: "Auset (Devotion/Receptivity)",
    law: "Receptivity. The subconscious memory and the power of trance/hypnosis.",
    role: "The vessel that holds the programming and nurtures the vision.",
    directorsNote: "I hold the vision in the dark until it is ready for the light."
  },
  anchor: {
    name: "The Anchor",
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
  "still_center": "blank_canvas",
  "sovereign": "auteur",
  "truth_keeper": "sentinel",
  "sacred_judge": "law_keeper",
  "master_builder": "system_builder",
  "divine_analyst": "oracle",
  "alchemist": "creative_muse",
  "protector": "anchor",
  "harmonizer": "deep_memory",
  "wayfinder": "sovereign_will",
  "weaver": "analyst",
  // Previous cinematic names
  "concerned_observer": "blank_canvas",
  "showrunner": "auteur",
  "lead_editor": "sentinel",
  "studio_executive": "law_keeper",
  "screenwriter": "system_builder",
  "script_doctor": "oracle",
  "method_actor": "creative_muse",
  "stunt_coordinator": "anchor",
  "ensemble_director": "deep_memory",
  "location_scout": "sovereign_will",
  "distributor": "analyst"
};

function resolveArchetypeId(id: string | undefined): string {
  if (!id) return "blank_canvas";
  if (METU_NETER_ARCHETYPES[id]) return id;
  return LEGACY_ARCHETYPE_MAP[id] || "blank_canvas";
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
    const identifiedLaws: Array<{ lawNumber: number; name: string; application: string; quote: string }> = [];
    
    // Analyze task completion for relevant law
    if (taskCompletionRate < 50) {
      const law = NAPOLEON_HILL_17_LAWS[7]; // Self-Control
      identifiedLaws.push({ lawNumber: 7, name: law.name, application: law.application, quote: law.quote });
    }
    
    // Check for confidence issues based on challenges
    if (cutChallenges > completedChallenges) {
      const law = NAPOLEON_HILL_17_LAWS[2]; // Self-Confidence
      identifiedLaws.push({ lawNumber: 2, name: law.name, application: law.application, quote: law.quote });
    }
    
    // Check for goal clarity
    if (!profile?.chief_aim_what || profile?.chief_aim_what === 'Not set') {
      const law = NAPOLEON_HILL_17_LAWS[1]; // Definite Chief Aim
      identifiedLaws.push({ lawNumber: 1, name: law.name, application: law.application, quote: law.quote });
    }
    
    // Check for initiative based on activity
    if (totalTasks < 7) {
      const law = NAPOLEON_HILL_17_LAWS[4]; // Initiative and Leadership
      identifiedLaws.push({ lawNumber: 4, name: law.name, application: law.application, quote: law.quote });
    }
    
    // Add imagination law for visualization
    const imaginationLaw = NAPOLEON_HILL_17_LAWS[5];
    identifiedLaws.push({ lawNumber: 5, name: imaginationLaw.name, application: imaginationLaw.application, quote: imaginationLaw.quote });
    
    // Add profiting from failure if they have cuts
    if (cutChallenges > 0) {
      const law = NAPOLEON_HILL_17_LAWS[13]; // Profiting from Failure
      identifiedLaws.push({ lawNumber: 13, name: law.name, application: law.application, quote: law.quote });
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
    const napoleonHillGuidance = identifiedLaws.slice(0, 3).map(law => 
      `LAW #${law.lawNumber} (${law.name}): ${law.application}\n   Quote: "${law.quote}"`
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
                archetypeAlignment: { type: "string", description: "Assessment of how well they embody their Metu Neter archetype" },
                napoleonHillPrescription: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      lawNumber: { type: "number" },
                      lawName: { type: "string" },
                      application: { type: "string" }
                    },
                    required: ["lawNumber", "lawName", "application"]
                  },
                  description: "2-3 Napoleon Hill Laws to focus on"
                },
                directorsNote: { type: "string", description: "Motivational personalized message with Napoleon Hill quote" },
                nextScene: { type: "string", description: "One specific action for today based on the most relevant law" },
                overallScore: { type: "number", description: "Overall character score 0-100" }
              },
              required: ["assessment", "strengths", "growthEdges", "patterns", "archetypeAlignment", "napoleonHillPrescription", "directorsNote", "nextScene", "overallScore"]
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
      napoleonHillLaws: identifiedLaws,
      archetype: currentArchetype ? {
        id: resolvedArchetypeId,
        name: currentArchetype.name,
        sphere: currentArchetype.sphere,
        deity: currentArchetype.deity,
        law: currentArchetype.law,
        role: currentArchetype.role,
        directorsNote: currentArchetype.directorsNote
      } : null,
      chiefAimSnapshot: {
        what: profile?.chief_aim_what,
        byWhen: profile?.chief_aim_by_when,
        exchange: profile?.chief_aim_exchange,
        plan: profile?.chief_aim_plan
      },
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
