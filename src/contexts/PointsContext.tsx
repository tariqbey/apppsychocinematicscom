import React, { createContext, useContext, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PointsContextType {
  triggerRecalculation: () => Promise<void>;
}

const PointsContext = createContext<PointsContextType | null>(null);

export const usePointsContext = () => {
  const context = useContext(PointsContext);
  if (!context) {
    // Return a no-op if not wrapped in provider (for backward compatibility)
    return { triggerRecalculation: async () => {} };
  }
  return context;
};

interface PointsProviderProps {
  children: React.ReactNode;
}

// Points configuration (duplicated from usePoints for edge case handling)
const POINTS_CONFIG = {
  rituals: {
    morning_screening: 10,
    script_review: 10,
    action_execution: 15,
    evening_review: 10,
    journal_entry: 15,
    chief_aim_listened: 10,
  },
  allRitualsBonus: 50,
  taskCompleted: 20,
  allThreeTasksBonus: 75,
  journalEntry: 25,
  journalWithBreakthrough: 50,
  scorecardBase: 10,
  perfectScoreBonus: 100,
  superBonus: 150,
  penalties: {
    procrastination: -50,
    others_movie: -35,
    ran_out_of_time: -15,
  },
  negativeMood: -10,
};

export const PointsProvider: React.FC<PointsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const calculateAndSavePoints = useCallback(async () => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];

    try {
      // Fetch all data in parallel
      const [ritualsResult, tasksResult, journalResult, scorecardResult] = await Promise.all([
        supabase.from("daily_rituals").select("*").eq("user_id", user.id).eq("ritual_date", today).maybeSingle(),
        supabase.from("daily_tasks").select("*").eq("user_id", user.id).eq("task_date", today),
        supabase.from("journal_entries").select("*").eq("user_id", user.id).gte("created_at", `${today}T00:00:00`).lt("created_at", `${today}T23:59:59`),
        supabase.from("daily_scorecards").select("total_score").eq("user_id", user.id).eq("scorecard_date", today).maybeSingle(),
      ]);

      // Calculate ritual points
      let ritualPoints = 0;
      let allRitualsComplete = false;
      if (ritualsResult.data) {
        const rituals = ritualsResult.data;
        const config = POINTS_CONFIG.rituals;
        if (rituals.morning_screening) ritualPoints += config.morning_screening;
        if (rituals.script_review) ritualPoints += config.script_review;
        if (rituals.action_execution) ritualPoints += config.action_execution;
        if (rituals.evening_review) ritualPoints += config.evening_review;
        if (rituals.journal_entry) ritualPoints += config.journal_entry;
        if (rituals.chief_aim_listened) ritualPoints += config.chief_aim_listened;

        allRitualsComplete = 
          rituals.morning_screening && 
          rituals.script_review && 
          rituals.action_execution && 
          rituals.evening_review && 
          rituals.journal_entry;

        if (allRitualsComplete) {
          ritualPoints += POINTS_CONFIG.allRitualsBonus;
        }
      }

      // Calculate task points
      let taskPoints = 0;
      let penaltyPoints = 0;
      let allTasksComplete = false;
      let completedTaskCount = 0;
      if (tasksResult.data) {
        for (const task of tasksResult.data) {
          if (task.is_completed) {
            taskPoints += POINTS_CONFIG.taskCompleted;
            completedTaskCount++;
          } else if (task.incomplete_reason) {
            switch (task.incomplete_reason) {
              case "procrastination":
                penaltyPoints += Math.abs(POINTS_CONFIG.penalties.procrastination);
                break;
              case "others_movie":
                penaltyPoints += Math.abs(POINTS_CONFIG.penalties.others_movie);
                break;
              default:
                penaltyPoints += Math.abs(POINTS_CONFIG.penalties.ran_out_of_time);
            }
          }
        }
        allTasksComplete = completedTaskCount >= 3;
        if (allTasksComplete) {
          taskPoints += POINTS_CONFIG.allThreeTasksBonus;
        }
      }

      // Calculate journal points
      let journalPoints = 0;
      let hasBreakthrough = false;
      if (journalResult.data && journalResult.data.length > 0) {
        journalPoints = POINTS_CONFIG.journalEntry;
        const positiveMoods = ["grateful", "inspired", "hopeful", "confident", "peaceful", "excited"];
        const negativeMoods = ["frustrated", "anxious", "overwhelmed", "stuck", "defeated"];

        for (const entry of journalResult.data) {
          if (entry.mood && positiveMoods.includes(entry.mood.toLowerCase())) {
            journalPoints += POINTS_CONFIG.journalWithBreakthrough - POINTS_CONFIG.journalEntry;
            hasBreakthrough = true;
            break;
          } else if (entry.mood && negativeMoods.includes(entry.mood.toLowerCase())) {
            journalPoints += POINTS_CONFIG.negativeMood;
          }
        }
        journalPoints = Math.max(0, journalPoints);
      }

      // Calculate scorecard points
      let scorecardPoints = 0;
      if (scorecardResult.data?.total_score) {
        scorecardPoints = scorecardResult.data.total_score * POINTS_CONFIG.scorecardBase;
        if (scorecardResult.data.total_score === 12) {
          scorecardPoints += POINTS_CONFIG.perfectScoreBonus;
        }
      }

      // Calculate bonuses
      let bonusPoints = 0;
      if (allRitualsComplete && allTasksComplete && hasBreakthrough) {
        bonusPoints = POINTS_CONFIG.superBonus;
      }

      const totalPoints = Math.max(0, 
        ritualPoints + taskPoints + journalPoints + scorecardPoints + bonusPoints - penaltyPoints
      );

      // Upsert daily points
      await supabase.from("daily_points").upsert({
        user_id: user.id,
        points_date: today,
        ritual_points: ritualPoints,
        task_points: taskPoints,
        journal_points: journalPoints,
        scorecard_points: scorecardPoints,
        bonus_points: bonusPoints,
        penalty_points: penaltyPoints,
        total_points: totalPoints,
      }, { onConflict: "user_id,points_date" });

    } catch (err) {
      console.error("Error recalculating points:", err);
    }
  }, [user]);

  const triggerRecalculation = useCallback(async () => {
    // Debounce to prevent multiple rapid recalculations
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      calculateAndSavePoints();
    }, 500);
  }, [calculateAndSavePoints]);

  return (
    <PointsContext.Provider value={{ triggerRecalculation }}>
      {children}
    </PointsContext.Provider>
  );
};
