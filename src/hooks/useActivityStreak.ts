import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface ActivityStreakData {
  currentStreak: number;
  bestStreak: number;
  lastActivityDate: string | null;
  daysInactive: number;
  isLoading: boolean;
  refetch: () => void;
}

export const useActivityStreak = (): ActivityStreakData => {
  const { user } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lastActivityDate, setLastActivityDate] = useState<string | null>(null);
  const [daysInactive, setDaysInactive] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStreakData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Call the database function to calculate streak
      const { data, error } = await supabase.rpc('calculate_activity_streak', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error calculating streak:', error);
        // Fallback to profile data
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('current_streak, best_streak, last_viewing_date')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          setCurrentStreak(profile.current_streak || 0);
          setBestStreak(profile.best_streak || 0);
          setLastActivityDate(profile.last_viewing_date || null);
          
          // Calculate days inactive
          if (profile.last_viewing_date) {
            const lastDate = new Date(profile.last_viewing_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            lastDate.setHours(0, 0, 0, 0);
            const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
            setDaysInactive(diffDays);
          }
        }
      } else if (data && data.length > 0) {
        const result = data[0];
        setCurrentStreak(result.current_streak || 0);
        setBestStreak(result.best_streak || 0);
        setLastActivityDate(result.last_activity_date || null);
        setDaysInactive(result.days_inactive || 0);
      }
    } catch (err) {
      console.error('Error fetching streak data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStreakData();
  }, [fetchStreakData]);

  return {
    currentStreak,
    bestStreak,
    lastActivityDate,
    daysInactive,
    isLoading,
    refetch: fetchStreakData,
  };
};
