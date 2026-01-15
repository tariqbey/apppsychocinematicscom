import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";

export interface ExcuseCount {
  reason: string;
  count: number;
  label: string;
}

export interface WeeklyExcuseData {
  week: string;
  procrastinating: number;
  others_movie: number;
  ran_out_of_time: number;
}

export interface ExcuseAnalytics {
  totalIncomplete: number;
  totalCompleted: number;
  completionRate: number;
  excuseCounts: ExcuseCount[];
  weeklyTrends: WeeklyExcuseData[];
  mostCommonExcuse: string | null;
}

const EXCUSE_LABELS: Record<string, string> = {
  procrastinating: "Procrastinating",
  others_movie: "Someone else's movie",
  ran_out_of_time: "Ran out of time",
};

export function useExcuseAnalytics(days: number = 30) {
  const [analytics, setAnalytics] = useState<ExcuseAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, days]);

  const fetchAnalytics = async () => {
    if (!user) return;
    setIsLoading(true);

    const startDate = format(subDays(new Date(), days), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("daily_tasks")
      .select("is_completed, incomplete_reason, task_date")
      .eq("user_id", user.id)
      .gte("task_date", startDate)
      .order("task_date");

    if (error) {
      console.error("Error fetching excuse analytics:", error);
      setIsLoading(false);
      return;
    }

    const tasks = data || [];
    
    // Calculate totals
    const totalCompleted = tasks.filter(t => t.is_completed).length;
    const totalIncomplete = tasks.filter(t => !t.is_completed).length;
    const completionRate = tasks.length > 0 
      ? Math.round((totalCompleted / tasks.length) * 100) 
      : 0;

    // Count excuses
    const excuseMap: Record<string, number> = {
      procrastinating: 0,
      others_movie: 0,
      ran_out_of_time: 0,
    };

    tasks.forEach(task => {
      if (!task.is_completed && task.incomplete_reason) {
        if (excuseMap[task.incomplete_reason] !== undefined) {
          excuseMap[task.incomplete_reason]++;
        }
      }
    });

    const excuseCounts: ExcuseCount[] = Object.entries(excuseMap).map(([reason, count]) => ({
      reason,
      count,
      label: EXCUSE_LABELS[reason] || reason,
    }));

    // Find most common excuse
    const maxCount = Math.max(...excuseCounts.map(e => e.count));
    const mostCommonExcuse = maxCount > 0 
      ? excuseCounts.find(e => e.count === maxCount)?.label || null
      : null;

    // Calculate weekly trends (last 4 weeks)
    const weeklyTrends: WeeklyExcuseData[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekEnd = subDays(new Date(), i * 7);
      const weekStart = subDays(weekEnd, 6);
      const weekLabel = `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")}`;

      const weekTasks = tasks.filter(t => {
        const taskDate = new Date(t.task_date);
        return taskDate >= weekStart && taskDate <= weekEnd;
      });

      const weekData: WeeklyExcuseData = {
        week: weekLabel,
        procrastinating: 0,
        others_movie: 0,
        ran_out_of_time: 0,
      };

      weekTasks.forEach(task => {
        if (!task.is_completed && task.incomplete_reason) {
          if (task.incomplete_reason === "procrastinating") weekData.procrastinating++;
          if (task.incomplete_reason === "others_movie") weekData.others_movie++;
          if (task.incomplete_reason === "ran_out_of_time") weekData.ran_out_of_time++;
        }
      });

      weeklyTrends.push(weekData);
    }

    setAnalytics({
      totalIncomplete,
      totalCompleted,
      completionRate,
      excuseCounts,
      weeklyTrends,
      mostCommonExcuse,
    });

    setIsLoading(false);
  };

  return { analytics, isLoading, refetch: fetchAnalytics };
}
