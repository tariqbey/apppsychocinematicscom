import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface PointsHistoryEntry {
  date: string;
  total_points: number;
  ritual_points: number;
  task_points: number;
  journal_points: number;
  scorecard_points: number;
  bonus_points: number;
  penalty_points: number;
}

export const usePointsHistory = (days: number = 30) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<PointsHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("daily_points")
        .select("points_date, total_points, ritual_points, task_points, journal_points, scorecard_points, bonus_points, penalty_points")
        .eq("user_id", user.id)
        .gte("points_date", startDate.toISOString().split("T")[0])
        .order("points_date", { ascending: true });

      if (error) throw error;

      // Fill in missing dates with zeros
      const historyMap = new Map<string, PointsHistoryEntry>();
      data?.forEach((d) => {
        historyMap.set(d.points_date, {
          date: d.points_date,
          total_points: d.total_points,
          ritual_points: d.ritual_points,
          task_points: d.task_points,
          journal_points: d.journal_points,
          scorecard_points: d.scorecard_points,
          bonus_points: d.bonus_points,
          penalty_points: d.penalty_points,
        });
      });

      // Generate all dates in range
      const allDates: PointsHistoryEntry[] = [];
      const current = new Date(startDate);
      const today = new Date();
      while (current <= today) {
        const dateStr = current.toISOString().split("T")[0];
        allDates.push(
          historyMap.get(dateStr) || {
            date: dateStr,
            total_points: 0,
            ritual_points: 0,
            task_points: 0,
            journal_points: 0,
            scorecard_points: 0,
            bonus_points: 0,
            penalty_points: 0,
          }
        );
        current.setDate(current.getDate() + 1);
      }

      setHistory(allDates);
    } catch (err) {
      console.error("Error fetching points history:", err);
    } finally {
      setLoading(false);
    }
  }, [user, days]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    refresh: fetchHistory,
  };
};
