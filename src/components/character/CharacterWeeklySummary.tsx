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
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-gold" />
            Weekly Character Summary
          </CardTitle>
          <div className="text-right">
            <p className="text-2xl font-bold text-gold">{weeklyAverage}%</p>
            <p className="text-xs text-muted-foreground">7-day avg</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alignment Chart */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Daily Alignment
          </h4>
          <div className="h-40">
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
        </div>

        {/* Trait Performance */}
        {traitTrends.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trait Performance (Avg Score)
            </h4>
            <div className="space-y-2">
              {traitTrends.slice(0, 5).map((trait) => (
                <div
                  key={trait.trait}
                  className="flex items-center justify-between p-2 rounded bg-secondary/30"
                >
                  <span className="text-sm truncate max-w-[200px]">{trait.trait}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gold rounded-full transition-all"
                        style={{ width: `${(trait.avgScore / 3) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">
                      {trait.avgScore.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
