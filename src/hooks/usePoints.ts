import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// Points configuration
export const POINTS_CONFIG = {
  // Ritual completion bonuses (per ritual item)
  rituals: {
    morning_screening: 10,
    script_review: 10,
    action_execution: 15,
    evening_review: 10,
    journal_entry: 15,
    chief_aim_listened: 10,
  },
  // All rituals completed bonus
  allRitualsBonus: 50,
  
  // Task completion
  taskCompleted: 20,
  allThreeTasksBonus: 75, // Bonus for completing all 3 daily tasks
  
  // Journal bonuses
  journalEntry: 25,
  journalWithBreakthrough: 50, // Journal entry with positive mood/breakthrough
  
  // Scorecard bonuses (based on score 0-12)
  scorecardBase: 10, // Per point scored
  perfectScoreBonus: 100, // 12/12 score
  
  // Super bonus: All tasks + Journal + All rituals
  superBonus: 150,
  
  // Excuse penalties (from most severe to least)
  penalties: {
    procrastination: -50, // "Procrastinating the bullshit"
    others_movie: -35,    // "Got caught up in someone else's movie"  
    ran_out_of_time: -15, // "Ran out of time" (least severe)
  },
  
  // Negative journal mood penalties
  negativeMood: -10, // Scrubbing, negative entries
};

export interface DailyPointsData {
  id?: string;
  user_id: string;
  points_date: string;
  ritual_points: number;
  task_points: number;
  journal_points: number;
  scorecard_points: number;
  bonus_points: number;
  penalty_points: number;
  total_points: number;
}

export interface PointsSummary {
  total_points: number;
  ritual_points: number;
  task_points: number;
  journal_points: number;
  scorecard_points: number;
  bonus_points: number;
  penalty_points: number;
  days_active: number;
}

export const usePoints = () => {
  const { user } = useAuth();
  const [todayPoints, setTodayPoints] = useState<DailyPointsData | null>(null);
  const [summary, setSummary] = useState<PointsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  // Calculate points for rituals
  const calculateRitualPoints = useCallback(async () => {
    if (!user) return { points: 0, allComplete: false };

    const { data: rituals } = await supabase
      .from("daily_rituals")
      .select("*")
      .eq("user_id", user.id)
      .eq("ritual_date", today)
      .maybeSingle();

    if (!rituals) return { points: 0, allComplete: false };

    let points = 0;
    const config = POINTS_CONFIG.rituals;

    if (rituals.morning_screening) points += config.morning_screening;
    if (rituals.script_review) points += config.script_review;
    if (rituals.action_execution) points += config.action_execution;
    if (rituals.evening_review) points += config.evening_review;
    if (rituals.journal_entry) points += config.journal_entry;
    if (rituals.chief_aim_listened) points += config.chief_aim_listened;

    const allComplete = 
      rituals.morning_screening && 
      rituals.script_review && 
      rituals.action_execution && 
      rituals.evening_review && 
      rituals.journal_entry;

    if (allComplete) {
      points += POINTS_CONFIG.allRitualsBonus;
    }

    return { points, allComplete };
  }, [user, today]);

  // Calculate points for tasks
  const calculateTaskPoints = useCallback(async () => {
    if (!user) return { points: 0, penalties: 0, allComplete: false, completedCount: 0 };

    const { data: tasks } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("task_date", today);

    if (!tasks || tasks.length === 0) return { points: 0, penalties: 0, allComplete: false, completedCount: 0 };

    let points = 0;
    let penalties = 0;
    let completedCount = 0;

    for (const task of tasks) {
      if (task.is_completed) {
        points += POINTS_CONFIG.taskCompleted;
        completedCount++;
      } else if (task.incomplete_reason) {
        // Apply penalty based on excuse type
        switch (task.incomplete_reason) {
          case "procrastination":
            penalties += Math.abs(POINTS_CONFIG.penalties.procrastination);
            break;
          case "others_movie":
            penalties += Math.abs(POINTS_CONFIG.penalties.others_movie);
            break;
          case "ran_out_of_time":
          default:
            penalties += Math.abs(POINTS_CONFIG.penalties.ran_out_of_time);
            break;
        }
      }
    }

    // Check for all 3 tasks completed bonus
    const allComplete = completedCount >= 3;
    if (allComplete) {
      points += POINTS_CONFIG.allThreeTasksBonus;
    }

    return { points, penalties, allComplete, completedCount };
  }, [user, today]);

  // Calculate points for journal
  const calculateJournalPoints = useCallback(async () => {
    if (!user) return { points: 0, hasBreakthrough: false };

    const { data: entries } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", `${today}T00:00:00`)
      .lt("created_at", `${today}T23:59:59`);

    if (!entries || entries.length === 0) return { points: 0, hasBreakthrough: false };

    let points = POINTS_CONFIG.journalEntry;
    let hasBreakthrough = false;

    // Check for positive moods indicating breakthrough
    const positiveMoods = ["grateful", "inspired", "hopeful", "confident", "peaceful", "excited"];
    const negativeMoods = ["frustrated", "anxious", "overwhelmed", "stuck", "defeated"];

    for (const entry of entries) {
      if (entry.mood && positiveMoods.includes(entry.mood.toLowerCase())) {
        points += POINTS_CONFIG.journalWithBreakthrough - POINTS_CONFIG.journalEntry;
        hasBreakthrough = true;
        break;
      } else if (entry.mood && negativeMoods.includes(entry.mood.toLowerCase())) {
        points += POINTS_CONFIG.negativeMood;
      }
    }

    return { points: Math.max(0, points), hasBreakthrough };
  }, [user, today]);

  // Calculate points for scorecard
  const calculateScorecardPoints = useCallback(async () => {
    if (!user) return 0;

    const { data: scorecard } = await supabase
      .from("daily_scorecards")
      .select("total_score")
      .eq("user_id", user.id)
      .eq("scorecard_date", today)
      .maybeSingle();

    if (!scorecard) return 0;

    let points = scorecard.total_score * POINTS_CONFIG.scorecardBase;

    if (scorecard.total_score === 12) {
      points += POINTS_CONFIG.perfectScoreBonus;
    }

    return points;
  }, [user, today]);

  // Recalculate and save today's points
  const recalculateToday = useCallback(async () => {
    if (!user) return;

    try {
      const [ritualResult, taskResult, journalResult, scorecardPoints] = await Promise.all([
        calculateRitualPoints(),
        calculateTaskPoints(),
        calculateJournalPoints(),
        calculateScorecardPoints(),
      ]);

      let bonusPoints = 0;
      const penaltyPoints = taskResult.penalties;

      // Super bonus: All rituals + All 3 tasks + Journal with breakthrough
      if (ritualResult.allComplete && taskResult.allComplete && journalResult.hasBreakthrough) {
        bonusPoints += POINTS_CONFIG.superBonus;
      }

      const totalPoints = Math.max(0,
        ritualResult.points +
        taskResult.points +
        journalResult.points +
        scorecardPoints +
        bonusPoints -
        penaltyPoints
      );

      const pointsData: DailyPointsData = {
        user_id: user.id,
        points_date: today,
        ritual_points: ritualResult.points,
        task_points: taskResult.points,
        journal_points: journalResult.points,
        scorecard_points: scorecardPoints,
        bonus_points: bonusPoints,
        penalty_points: penaltyPoints,
        total_points: totalPoints,
      };

      // Upsert today's points
      const { data, error } = await supabase
        .from("daily_points")
        .upsert(pointsData, { onConflict: "user_id,points_date" })
        .select()
        .single();

      if (error) throw error;

      setTodayPoints(data);
      return data;
    } catch (err) {
      console.error("Error calculating points:", err);
    }
  }, [user, today, calculateRitualPoints, calculateTaskPoints, calculateJournalPoints, calculateScorecardPoints]);

  // Fetch summary for a time period
  const fetchSummary = useCallback(async (period: "weekly" | "monthly" | "yearly" | "all_time" = "all_time") => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc("get_user_points_summary", {
        p_user_id: user.id,
        time_period: period,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setSummary(data[0] as PointsSummary);
      }
    } catch (err) {
      console.error("Error fetching points summary:", err);
    }
  }, [user]);

  // Load initial data
  useEffect(() => {
    if (!user) {
      setTodayPoints(null);
      setSummary(null);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      
      // Fetch today's points
      const { data: existing } = await supabase
        .from("daily_points")
        .select("*")
        .eq("user_id", user.id)
        .eq("points_date", today)
        .maybeSingle();

      if (existing) {
        setTodayPoints(existing as DailyPointsData);
      } else {
        // Calculate and create today's points
        await recalculateToday();
      }

      await fetchSummary("all_time");
      setLoading(false);
    };

    loadData();
  }, [user, today, recalculateToday, fetchSummary]);

  return {
    todayPoints,
    summary,
    loading,
    recalculateToday,
    fetchSummary,
    POINTS_CONFIG,
  };
};
