import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parseISO, format } from "date-fns";

interface CycleInfo {
  currentCycle: number;
  currentCycleDay: number;
  currentAct: number;
  cyclesCompleted: number;
  transformationStartDate: string | null;
  daysUntilCycleEnd: number;
  cycleProgress: number; // 0-100
  actProgress: number; // 0-100
  isReviewDue: boolean;
  totalDaysInProgram: number;
  cycleWithinAct: number;
  cyclesInCurrentAct: number;
}

interface CycleReview {
  id: string;
  cycle_number: number;
  act_number: number;
  review_date: string;
  avg_identity_alignment: number | null;
  avg_behavior_execution: number | null;
  avg_emotional_regulation: number | null;
  avg_forward_progress: number | null;
  avg_total_score: number | null;
  character_trait_averages: Record<string, number> | null;
  archetype_at_start: string | null;
  archetype_at_end: string | null;
  archetype_shifted: boolean;
  ai_progress_report: string | null;
  biggest_win: string | null;
  biggest_challenge: string | null;
  commitment_for_next_cycle: string | null;
  days_completed: number;
  streak_during_cycle: number | null;
  created_at: string;
}

const DAYS_PER_CYCLE = 21;

// Act structure: Act 1 = 3 cycles, Act 2 = 4 cycles, Act 3 = 3 cycles
const ACT_CYCLE_COUNTS: Record<number, number> = {
  1: 3, // Act 1: The Awakening - 3 cycles (63 days)
  2: 4, // Act 2: The Integration - 4 cycles (84 days)  
  3: 3, // Act 3: The Mastery - 3 cycles (63 days)
};

const getCyclesPerAct = (actNumber: number): number => {
  return ACT_CYCLE_COUNTS[actNumber] || 3;
};

const getActForCycle = (cycleNumber: number): number => {
  // Act 1: cycles 1-3
  if (cycleNumber <= 3) return 1;
  // Act 2: cycles 4-7
  if (cycleNumber <= 7) return 2;
  // Act 3: cycles 8-10
  if (cycleNumber <= 10) return 3;
  // Beyond program: continue in "extended" acts
  return 4 + Math.floor((cycleNumber - 11) / 3);
};

const getCycleWithinAct = (cycleNumber: number, actNumber: number): number => {
  if (actNumber === 1) return cycleNumber;
  if (actNumber === 2) return cycleNumber - 3;
  if (actNumber === 3) return cycleNumber - 7;
  // Extended acts
  return ((cycleNumber - 11) % 3) + 1;
};

export function useCycleTracking() {
  const { user } = useAuth();
  const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null);
  const [pastReviews, setPastReviews] = useState<CycleReview[]>([]);
  const [loading, setLoading] = useState(true);

  const calculateCycleInfo = useCallback((startDate: string | null): CycleInfo => {
    if (!startDate) {
      return {
        currentCycle: 1,
        currentCycleDay: 1,
        currentAct: 1,
        cyclesCompleted: 0,
        transformationStartDate: null,
        daysUntilCycleEnd: DAYS_PER_CYCLE,
        cycleProgress: 0,
        actProgress: 0,
        isReviewDue: false,
        totalDaysInProgram: 1,
        cycleWithinAct: 1,
        cyclesInCurrentAct: getCyclesPerAct(1),
      };
    }

    const start = parseISO(startDate);
    const today = new Date();
    const totalDays = differenceInDays(today, start) + 1;
    
    // Calculate current cycle (1-indexed)
    const currentCycle = Math.floor((totalDays - 1) / DAYS_PER_CYCLE) + 1;
    
    // Calculate day within current cycle (1-21)
    const currentCycleDay = ((totalDays - 1) % DAYS_PER_CYCLE) + 1;
    
    // Calculate current act using the 3-4-3 structure
    const currentAct = getActForCycle(currentCycle);
    
    // Calculate cycles completed (full cycles only)
    const cyclesCompleted = currentCycle - 1;
    
    // Days until cycle ends
    const daysUntilCycleEnd = DAYS_PER_CYCLE - currentCycleDay;
    
    // Progress percentages
    const cycleProgress = (currentCycleDay / DAYS_PER_CYCLE) * 100;
    
    // Act progress using the dynamic cycle count per act
    const cyclesInCurrentAct = getCyclesPerAct(currentAct);
    const cycleWithinAct = getCycleWithinAct(currentCycle, currentAct);
    const actProgress = ((cycleWithinAct - 1) * DAYS_PER_CYCLE + currentCycleDay) / (cyclesInCurrentAct * DAYS_PER_CYCLE) * 100;
    
    // Review is due on day 21 of each cycle
    const isReviewDue = currentCycleDay === DAYS_PER_CYCLE;

    return {
      currentCycle,
      currentCycleDay,
      currentAct,
      cyclesCompleted,
      transformationStartDate: startDate,
      daysUntilCycleEnd,
      cycleProgress,
      actProgress,
      isReviewDue,
      totalDaysInProgram: totalDays,
      cycleWithinAct,
      cyclesInCurrentAct,
    };
  }, []);

  const fetchCycleData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch user profile for start date
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("transformation_start_date, current_cycle, cycles_completed")
        .eq("user_id", user.id)
        .single();

      const info = calculateCycleInfo(profile?.transformation_start_date || null);
      setCycleInfo(info);

      // Fetch past cycle reviews
      const { data: reviews } = await supabase
        .from("cycle_reviews")
        .select("*")
        .eq("user_id", user.id)
        .order("cycle_number", { ascending: false });

      setPastReviews((reviews as CycleReview[]) || []);
    } catch (error) {
      console.error("Error fetching cycle data:", error);
    } finally {
      setLoading(false);
    }
  }, [user, calculateCycleInfo]);

  useEffect(() => {
    fetchCycleData();
  }, [fetchCycleData]);

  const startTransformation = useCallback(async () => {
    if (!user) return;

    const today = format(new Date(), "yyyy-MM-dd");
    
    await supabase
      .from("user_profiles")
      .update({
        transformation_start_date: today,
        current_cycle: 1,
        current_cycle_day: 1,
        cycles_completed: 0,
      })
      .eq("user_id", user.id);

    await fetchCycleData();
  }, [user, fetchCycleData]);

  const completeCycleReview = useCallback(async (reviewData: {
    avgScores: {
      identity_alignment: number;
      behavior_execution: number;
      emotional_regulation: number;
      forward_progress: number;
      total: number;
    };
    characterTraitAverages: Record<string, number>;
    archetypeAtStart: string;
    archetypeAtEnd: string;
    aiProgressReport: string;
    biggestWin: string;
    biggestChallenge: string;
    commitmentForNextCycle: string;
    streakDuringCycle: number;
  }) => {
    if (!user || !cycleInfo) return;

    const { error } = await supabase
      .from("cycle_reviews")
      .insert({
        user_id: user.id,
        cycle_number: cycleInfo.currentCycle,
        act_number: cycleInfo.currentAct,
        avg_identity_alignment: reviewData.avgScores.identity_alignment,
        avg_behavior_execution: reviewData.avgScores.behavior_execution,
        avg_emotional_regulation: reviewData.avgScores.emotional_regulation,
        avg_forward_progress: reviewData.avgScores.forward_progress,
        avg_total_score: reviewData.avgScores.total,
        character_trait_averages: reviewData.characterTraitAverages,
        archetype_at_start: reviewData.archetypeAtStart,
        archetype_at_end: reviewData.archetypeAtEnd,
        archetype_shifted: reviewData.archetypeAtStart !== reviewData.archetypeAtEnd,
        ai_progress_report: reviewData.aiProgressReport,
        biggest_win: reviewData.biggestWin,
        biggest_challenge: reviewData.biggestChallenge,
        commitment_for_next_cycle: reviewData.commitmentForNextCycle,
        days_completed: cycleInfo.currentCycleDay,
        streak_during_cycle: reviewData.streakDuringCycle,
      });

    if (!error) {
      // Update user profile
      await supabase
        .from("user_profiles")
        .update({
          cycles_completed: cycleInfo.cyclesCompleted + 1,
        })
        .eq("user_id", user.id);

      await fetchCycleData();
    }

    return error;
  }, [user, cycleInfo, fetchCycleData]);

  const getActName = (actNumber: number): string => {
    const actNames: Record<number, string> = {
      1: "Act I: The Awakening",
      2: "Act II: The Integration", 
      3: "Act III: The Mastery",
      4: "Act IV: The Legacy",
    };
    return actNames[actNumber] || `Act ${actNumber}: The Journey Continues`;
  };

  const getCycleNameForDisplay = (cycleNumber: number, actNumber: number): string => {
    const cycleInAct = getCycleWithinAct(cycleNumber, actNumber);
    const cyclesInAct = getCyclesPerAct(actNumber);
    
    // Dynamic names based on position in act
    if (cycleInAct === 1) return "Foundation";
    if (cycleInAct === cyclesInAct) return "Mastery";
    if (actNumber === 2 && cycleInAct === 2) return "Deep Work";
    if (actNumber === 2 && cycleInAct === 3) return "Integration";
    return "Integration";
  };

  return {
    cycleInfo,
    pastReviews,
    loading,
    startTransformation,
    completeCycleReview,
    refetch: fetchCycleData,
    getActName,
    getCycleName: getCycleNameForDisplay,
    DAYS_PER_CYCLE,
    getCyclesPerAct,
  };
}
