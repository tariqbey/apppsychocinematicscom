import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TimePeriod = "weekly" | "monthly" | "yearly" | "all_time";

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_points: number;
  current_streak: number;
  best_streak: number;
}

export const usePointsLeaderboard = (initialPeriod: TimePeriod = "all_time") => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<TimePeriod>(initialPeriod);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLeaderboard = useCallback(async (timePeriod: TimePeriod) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc("get_points_leaderboard", {
        time_period: timePeriod,
      });

      if (rpcError) throw rpcError;

      // Map the data to our interface with proper typing
      const mappedEntries: LeaderboardEntry[] = (data || []).map((entry: {
        rank: number;
        user_id: string;
        display_name: string;
        avatar_url: string | null;
        total_points: number;
        current_streak: number;
        best_streak: number;
      }) => ({
        rank: Number(entry.rank),
        user_id: entry.user_id,
        display_name: entry.display_name,
        avatar_url: entry.avatar_url,
        total_points: Number(entry.total_points),
        current_streak: entry.current_streak,
        best_streak: entry.best_streak,
      }));

      setEntries(mappedEntries);
    } catch (err) {
      console.error("Error fetching points leaderboard:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(period);
  }, [period, fetchLeaderboard]);

  const changePeriod = (newPeriod: TimePeriod) => {
    setPeriod(newPeriod);
  };

  const refresh = () => {
    fetchLeaderboard(period);
  };

  return {
    entries,
    period,
    loading,
    error,
    changePeriod,
    refresh,
  };
};
