import { useState, useEffect } from "react";
import { TrendingUp, BarChart3, Calendar, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface DailyData {
  date: string;
  displayDate: string;
  percentage: number;
  totalScore: number;
  maxScore: number;
}

interface TraitTrend {
  trait: string;
  avgScore: number;
  trend: "up" | "down" | "stable";
}

export function CharacterWeeklySummary() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [traitTrends, setTraitTrends] = useState<TraitTrend[]>([]);
  const [weeklyAverage, setWeeklyAverage] = useState(0);

  useEffect(() => {
    const fetchWeeklyData = async () => {
      if (!user) return;

      try {
        const sevenDaysAgo = subDays(new Date(), 7).toISOString().split("T")[0];

        const { data: scorecards } = await supabase
          .from("character_scorecards")
          .select("*")
          .eq("user_id", user.id)
          .gte("scorecard_date", sevenDaysAgo)
          .order("scorecard_date", { ascending: true });

        if (!scorecards || scorecards.length === 0) {
          setLoading(false);
          return;
        }

        // Build daily data for chart
        const chartData: DailyData[] = [];
        const traitScoreAccumulator: Record<string, { total: number; count: number }> = {};

        for (let i = 6; i >= 0; i--) {
          const date = subDays(new Date(), i);
          const dateStr = format(date, "yyyy-MM-dd");
          const displayDate = format(date, "EEE");

          const entry = scorecards.find(
            (s) => s.scorecard_date === dateStr
          );

          if (entry) {
            const percentage = entry.max_possible_score
              ? Math.round((entry.total_score! / entry.max_possible_score) * 100)
              : 0;

            chartData.push({
              date: dateStr,
              displayDate,
              percentage,
              totalScore: entry.total_score || 0,
              maxScore: entry.max_possible_score || 0,
            });

            // Accumulate trait scores
            const traitScores = entry.trait_scores as Record<string, number>;
            if (traitScores) {
              Object.entries(traitScores).forEach(([trait, score]) => {
                if (!traitScoreAccumulator[trait]) {
                  traitScoreAccumulator[trait] = { total: 0, count: 0 };
                }
                traitScoreAccumulator[trait].total += score;
                traitScoreAccumulator[trait].count += 1;
              });
            }
          } else {
            chartData.push({
              date: dateStr,
              displayDate,
              percentage: 0,
              totalScore: 0,
              maxScore: 0,
            });
          }
        }

        setDailyData(chartData);

        // Calculate trait trends
        const trends: TraitTrend[] = Object.entries(traitScoreAccumulator).map(
          ([trait, data]) => {
            const avgScore = data.total / data.count;
            return {
              trait,
              avgScore: Math.round(avgScore * 100) / 100,
              trend: avgScore >= 2 ? "up" : avgScore >= 1 ? "stable" : "down",
            };
          }
        );
        setTraitTrends(trends.sort((a, b) => b.avgScore - a.avgScore));

        // Calculate weekly average
        const validDays = chartData.filter((d) => d.maxScore > 0);
        const avgPercentage =
          validDays.length > 0
            ? Math.round(
                validDays.reduce((sum, d) => sum + d.percentage, 0) / validDays.length
              )
            : 0;
        setWeeklyAverage(avgPercentage);
      } catch (error) {
        console.error("Error fetching weekly data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyData();
  }, [user]);

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (dailyData.every((d) => d.maxScore === 0)) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-gold" />
            Weekly Character Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No character scorecard data for the last 7 days. Start tracking to see your trends!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-gold">{weeklyAverage}%</p>
            <p className="text-xs text-muted-foreground">7-Day Avg</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-foreground">
              {dailyData.filter(d => d.maxScore > 0).length}
            </p>
            <p className="text-xs text-muted-foreground">Days Tracked</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-green-400">
              {Math.max(...dailyData.map(d => d.percentage))}%
            </p>
            <p className="text-xs text-muted-foreground">Best Day</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-foreground">
              {traitTrends.length}
            </p>
            <p className="text-xs text-muted-foreground">Traits Tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Alignment Chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-gold" />
            Daily Alignment Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value}%`, "Alignment"]}
                />
                <Area
                  type="monotone"
                  dataKey="percentage"
                  stroke="hsl(var(--gold))"
                  fill="hsl(var(--gold)/0.2)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Trait Performance */}
      {traitTrends.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-gold" />
              Top Trait Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {traitTrends.slice(0, 5).map((trait, index) => (
                <div
                  key={trait.trait}
                  className="flex items-center gap-3"
                >
                  <span className="text-xs font-bold text-gold w-5">#{index + 1}</span>
                  <span className="text-sm truncate flex-1 min-w-0">{trait.trait}</span>
                  <div className="w-20 sm:w-32 h-2 bg-muted rounded-full overflow-hidden shrink-0">
                    <div
                      className="h-full bg-gradient-to-r from-gold to-amber-500 rounded-full transition-all"
                      style={{ width: `${(trait.avgScore / 3) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-10 text-right shrink-0">
                    {trait.avgScore.toFixed(1)}/3
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
