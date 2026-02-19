import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

const RITUAL_FIELDS = [
  "morning_screening",
  "script_review",
  "action_execution",
  "evening_review",
  "journal_entry",
] as const;

export function useRitualProgress() {
  const { user } = useAuth();
  const [completedCount, setCompletedCount] = useState(0);
  const totalRituals = 5;

  const refresh = useCallback(async () => {
    if (!user) return;
    const today = format(new Date(), "yyyy-MM-dd");

    const { data } = await supabase
      .from("daily_rituals")
      .select("morning_screening, script_review, action_execution, evening_review, journal_entry")
      .eq("user_id", user.id)
      .eq("ritual_date", today)
      .maybeSingle();

    // Also check action_execution from tasks
    const { data: tasks } = await supabase
      .from("daily_tasks")
      .select("id, is_completed, incomplete_reason")
      .eq("user_id", user.id)
      .eq("task_date", today);

    const actionsComplete =
      tasks && tasks.length > 0
        ? tasks.every(
            (t) => t.is_completed || (t.incomplete_reason && t.incomplete_reason.trim() !== "")
          )
        : false;

    if (data) {
      let count = 0;
      if (data.morning_screening) count++;
      if (data.script_review) count++;
      if (actionsComplete) count++;
      if (data.evening_review) count++;
      if (data.journal_entry) count++;
      setCompletedCount(count);
    } else {
      setCompletedCount(actionsComplete ? 1 : 0);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    completedCount,
    totalRituals,
    ritualProgress: totalRituals > 0 ? Math.round((completedCount / totalRituals) * 100) : 0,
    refresh,
  };
}
