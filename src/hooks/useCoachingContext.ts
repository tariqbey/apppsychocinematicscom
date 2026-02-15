import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Task {
  id: string;
  task_text: string;
  is_completed: boolean;
  priority: number;
}

interface TransformationAnalysis {
  currentSelf: {
    archetype: string;
    strengths: string[];
    liabilities: string[];
    blindSpots: string[];
  };
  requiredCharacter: {
    name: string;
    traits: string[];
    behaviors: string[];
    mindset: string;
  };
  gap: {
    whatMustDie: string[];
    whatMustEmerge: string[];
    dailyPractices: string[];
  };
  script: {
    role: string;
    motivation: string;
    arc: string;
  };
}

interface CoachingContext {
  // Chief Aim
  chiefAim: {
    what: string | null;
    byWhen: string | null;
    exchange: string | null;
    plan: string | null;
  };
  chiefAimComplete: boolean;
  directorCharacterName: string | null;
  displayName: string | null;
  
  // Character Transformation
  characterArchetype: string | null;
  transformationAnalysis: TransformationAnalysis | null;
  
  // Tasks
  todaysTasks: Task[];
  tasksSetForToday: boolean;
  allTasksCompleted: boolean;
  completedTasksCount: number;
  
  // Mind Movie
  hasMindMovie: boolean;
  mindMovieUrl: string | null;
  watchedMindMovieToday: boolean;
  
  // Scorecard
  filledScorecardToday: boolean;
  todaysScorecardScore: number | null;
  
  // Progress
  currentStreak: number;
  bestStreak: number;
  dayNumber: number;
  
  // Time context
  timeOfDay: "morning" | "afternoon" | "evening";
  greeting: string;
}

const getTimeOfDay = (): "morning" | "afternoon" | "evening" => {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
};

const getGreeting = (timeOfDay: string): string => {
  switch (timeOfDay) {
    case "morning": return "Good morning";
    case "afternoon": return "Good afternoon";
    case "evening": return "Good evening";
    default: return "Hello";
  }
};

export const useCoachingContext = () => {
  const { user } = useAuth();
  const [context, setContext] = useState<CoachingContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchContext = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const timeOfDay = getTimeOfDay();

      // Fetch all data in parallel
      const [profileResult, tasksResult, scorecardResult, viewingResult, characterProfileResult] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('daily_tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('task_date', today)
          .order('priority', { ascending: true }),
        supabase
          .from('daily_scorecards')
          .select('*')
          .eq('user_id', user.id)
          .eq('scorecard_date', today)
          .single(),
        supabase
          .from('viewing_history')
          .select('*')
          .eq('user_id', user.id)
          .eq('view_date', today)
          .limit(1),
        supabase
          .from('character_profiles')
          .select('archetype, transformation_analysis')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);

      const profile = profileResult.data;
      const tasks = tasksResult.data || [];
      const scorecard = scorecardResult.data;
      const viewedToday = (viewingResult.data?.length || 0) > 0;
      const characterProfile = characterProfileResult.data;

      // Determine if Chief Aim is complete (has at least the "what")
      const chiefAimComplete = !!(profile?.chief_aim_what && profile.chief_aim_what.trim().length > 0);

      const coachingContext: CoachingContext = {
        // Chief Aim
        chiefAim: {
          what: profile?.chief_aim_what || null,
          byWhen: profile?.chief_aim_by_when || null,
          exchange: profile?.chief_aim_exchange || null,
          plan: profile?.chief_aim_plan || null,
        },
        chiefAimComplete,
        directorCharacterName: profile?.director_character_name || null,
        displayName: profile?.display_name || null,

        // Character Transformation
        characterArchetype: characterProfile?.archetype || null,
        transformationAnalysis: characterProfile?.transformation_analysis as unknown as TransformationAnalysis | null,

        // Tasks
        todaysTasks: tasks.map(t => ({
          id: t.id,
          task_text: t.task_text,
          is_completed: t.is_completed,
          priority: t.priority,
        })),
        tasksSetForToday: tasks.length > 0,
        allTasksCompleted: tasks.length > 0 && tasks.every(t => t.is_completed),
        completedTasksCount: tasks.filter(t => t.is_completed).length,

        // Mind Movie
        hasMindMovie: !!(profile?.mind_movie_url),
        mindMovieUrl: profile?.mind_movie_url || null,
        watchedMindMovieToday: viewedToday,

        // Scorecard
        filledScorecardToday: !!scorecard,
        todaysScorecardScore: scorecard?.total_score || null,

        // Progress
        currentStreak: profile?.current_streak || 0,
        bestStreak: profile?.best_streak || 0,
        dayNumber: profile?.day_number || 1,

        // Time
        timeOfDay,
        greeting: getGreeting(timeOfDay),
      };

      setContext(coachingContext);
      setError(null);
    } catch (err) {
      console.error('Error fetching coaching context:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  return { context, loading, error, refetch: fetchContext };
};
