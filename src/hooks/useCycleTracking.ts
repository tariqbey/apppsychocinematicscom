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
const CYCLES_PER_ACT = 3;

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
      };
    }

    const start = parseISO(startDate);
    const today = new Date();
    const totalDays = differenceInDays(today, start) + 1;
    
    // Calculate current cycle (1-indexed)
    const currentCycle = Math.floor((totalDays - 1) / DAYS_PER_CYCLE) + 1;
    
    // Calculate day within current cycle (1-21)
    const currentCycleDay = ((totalDays - 1) % DAYS_PER_CYCLE) + 1;
    
    // Calculate current act (every 3 cycles = 1 act)
    const currentAct = Math.floor((currentCycle - 1) / CYCLES_PER_ACT) + 1;
    
    // Calculate cycles completed (full cycles only)
    const cyclesCompleted = currentCycle - 1;
    
    // Days until cycle ends
    const daysUntilCycleEnd = DAYS_PER_CYCLE - currentCycleDay;
    
    // Progress percentages
    const cycleProgress = (currentCycleDay / DAYS_PER_CYCLE) * 100;
    
    // Act progress (how far through 3 cycles)
    const cycleWithinAct = ((currentCycle - 1) % CYCLES_PER_ACT) + 1;
    const actProgress = ((cycleWithinAct - 1) * DAYS_PER_CYCLE + currentCycleDay) / (CYCLES_PER_ACT * DAYS_PER_CYCLE) * 100;
    
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
      2: "Act II: The Transformation", 
      3: "Act III: The Mastery",
      4: "Act IV: The Legacy",
    };
    return actNames[actNumber] || `Act ${actNumber}: The Journey Continues`;
  };

  const getCycleName = (cycleNumber: number, actNumber: number): string => {
    const cycleWithinAct = ((cycleNumber - 1) % CYCLES_PER_ACT) + 1;
    const cycleNames: Record<number, string> = {
      1: "Foundation",
      2: "Integration",
      3: "Mastery",
    };
    return cycleNames[cycleWithinAct] || `Cycle ${cycleWithinAct}`;
  };

  return {
    cycleInfo,
    pastReviews,
    loading,
    startTransformation,
    completeCycleReview,
    refetch: fetchCycleData,
    getActName,
    getCycleName,
    DAYS_PER_CYCLE,
    CYCLES_PER_ACT,
  };
}
