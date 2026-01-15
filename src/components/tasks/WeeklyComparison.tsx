import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";

interface WeeklyStats {
  completed: number;
  total: number;
  completionRate: number;
}

export function WeeklyComparison() {
  const { user } = useAuth();
  const [thisWeek, setThisWeek] = useState<WeeklyStats | null>(null);
  const [lastWeek, setLastWeek] = useState<WeeklyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWeeklyData();
    }
  }, [user]);

  const loadWeeklyData = async () => {
    if (!user) return;
    setIsLoading(true);

    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = subDays(thisWeekStart, 7);
    const lastWeekEnd = subDays(thisWeekStart, 1);

    // Fetch both weeks in parallel
    const [thisWeekData, lastWeekData] = await Promise.all([
      supabase
        .from("daily_tasks")
        .select("is_completed")
        .eq("user_id", user.id)
        .gte("task_date", format(thisWeekStart, "yyyy-MM-dd"))
        .lte("task_date", format(thisWeekEnd, "yyyy-MM-dd")),
      supabase
        .from("daily_tasks")
        .select("is_completed")
        .eq("user_id", user.id)
        .gte("task_date", format(lastWeekStart, "yyyy-MM-dd"))
        .lte("task_date", format(lastWeekEnd, "yyyy-MM-dd")),
    ]);

    if (!thisWeekData.error && thisWeekData.data) {
      const completed = thisWeekData.data.filter(t => t.is_completed).length;
      const total = thisWeekData.data.length;
      setThisWeek({
        completed,
        total,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      });
    }

    if (!lastWeekData.error && lastWeekData.data) {
      const completed = lastWeekData.data.filter(t => t.is_completed).length;
      const total = lastWeekData.data.length;
      setLastWeek({
        completed,
        total,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      });
    }

    setIsLoading(false);
  };

  if (isLoading || !thisWeek) {
    return null;
  }

  const rateDiff = lastWeek ? thisWeek.completionRate - lastWeek.completionRate : 0;
  const completedDiff = lastWeek ? thisWeek.completed - lastWeek.completed : 0;

  const getTrendIcon = (diff: number) => {
    if (diff > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (diff < 0) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = (diff: number) => {
    if (diff > 0) return "text-green-500";
    if (diff < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <Card className="glass-card border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Weekly Summary</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* This Week */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">This Week</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">{thisWeek.completionRate}%</span>
              <span className="text-xs text-muted-foreground">
                ({thisWeek.completed}/{thisWeek.total})
              </span>
            </div>
          </div>

          {/* Comparison */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">vs Last Week</p>
            {lastWeek && lastWeek.total > 0 ? (
              <div className="flex items-center gap-2">
                {getTrendIcon(rateDiff)}
                <span className={`text-lg font-bold ${getTrendColor(rateDiff)}`}>
                  {rateDiff > 0 ? "+" : ""}{rateDiff}%
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">No data</span>
            )}
          </div>
        </div>

        {/* Progress visualization */}
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Tasks Completed</span>
            <span className={getTrendColor(completedDiff)}>
              {completedDiff > 0 ? "+" : ""}{completedDiff} vs last week
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: Math.max(thisWeek.total, 7) }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  i < thisWeek.completed
                    ? "bg-primary"
                    : i < thisWeek.total
                    ? "bg-muted"
                    : "bg-muted/30"
                }`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
