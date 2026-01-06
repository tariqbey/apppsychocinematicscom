import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardEntry {
  rank: number;
  display_name: string;
  credits: number;
  lifetime_credits: number;
  current_streak: number;
  best_streak: number;
}

export const useLeaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_leaderboard");

      if (error) throw error;

      setEntries(data || []);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return {
    entries,
    loading,
    error,
    refresh: fetchLeaderboard,
  };
};
