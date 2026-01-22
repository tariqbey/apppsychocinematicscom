import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays } from "date-fns";
import { 
  Loader2, 
  Activity, 
  Zap, 
  TrendingUp,
  Flame
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell
} from "recharts";

interface TraitData {
  trait: string;
  score: number;
  fullMark: number;
}

interface DailyProgress {
  day: string;
  score: number;
  tasks: number;
}

export function AnimatedCharacterCharts() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [traitData, setTraitData] = useState<TraitData[]>([]);
  const [progressData, setProgressData] = useState<DailyProgress[]>([]);
  const [weeklyComparison, setWeeklyComparison] = useState<{ label: string; thisWeek: number; lastWeek: number }[]>([]);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchChartData();
  }, [user]);

  const fetchChartData = async () => {
    if (!user) return;

    try {
      const fourteenDaysAgo = subDays(new Date(), 14).toISOString().split("T")[0];
      const sevenDaysAgo = subDays(new Date(), 7).toISOString().split("T")[0];

      const [{ data: scorecards }, { data: tasks }] = await Promise.all([
        supabase
          .from("character_scorecards")
          .select("*")
          .eq("user_id", user.id)
          .gte("scorecard_date", fourteenDaysAgo)
          .order("scorecard_date", { ascending: true }),
        supabase
          .from("daily_tasks")
          .select("*")
          .eq("user_id", user.id)
          .gte("task_date", fourteenDaysAgo)
      ]);

      // Process trait data for radar chart
      const traitAccumulator: Record<string, { total: number; count: number }> = {};
      scorecards?.forEach(sc => {
        const traits = sc.trait_scores as Record<string, number>;
        if (traits) {
          Object.entries(traits).forEach(([trait, score]) => {
            if (!traitAccumulator[trait]) {
              traitAccumulator[trait] = { total: 0, count: 0 };
            }
            traitAccumulator[trait].total += score;
            traitAccumulator[trait].count += 1;
          });
        }
      });

      const radarData: TraitData[] = Object.entries(traitAccumulator)
        .slice(0, 6)
        .map(([trait, data]) => ({
          trait: trait.length > 12 ? trait.substring(0, 12) + '...' : trait,
          score: Math.round((data.total / data.count) * 33.33),
          fullMark: 100
        }));

      setTraitData(radarData);

      // Process daily progress data
      const dailyProgress: DailyProgress[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, "yyyy-MM-dd");
        const dayLabel = format(date, "EEE");

        const dayScorecard = scorecards?.find(s => s.scorecard_date === dateStr);
        const dayTasks = tasks?.filter(t => t.task_date === dateStr && t.is_completed) || [];

        dailyProgress.push({
          day: dayLabel,
          score: dayScorecard?.total_score || 0,
          tasks: dayTasks.length
        });
      }
      setProgressData(dailyProgress);

      // Weekly comparison
      const thisWeekCards = scorecards?.filter(s => s.scorecard_date >= sevenDaysAgo) || [];
      const lastWeekCards = scorecards?.filter(s => s.scorecard_date < sevenDaysAgo) || [];

      const thisWeekAvg = thisWeekCards.length 
        ? Math.round(thisWeekCards.reduce((sum, s) => sum + (s.total_score || 0), 0) / thisWeekCards.length)
        : 0;
      const lastWeekAvg = lastWeekCards.length
        ? Math.round(lastWeekCards.reduce((sum, s) => sum + (s.total_score || 0), 0) / lastWeekCards.length)
        : 0;

      const thisWeekTasks = tasks?.filter(t => t.task_date >= sevenDaysAgo && t.is_completed).length || 0;
      const lastWeekTasks = tasks?.filter(t => t.task_date < sevenDaysAgo && t.is_completed).length || 0;

      setWeeklyComparison([
        { label: "Avg Score", thisWeek: thisWeekAvg, lastWeek: lastWeekAvg },
        { label: "Tasks Done", thisWeek: thisWeekTasks, lastWeek: lastWeekTasks },
        { label: "Days Active", thisWeek: thisWeekCards.length, lastWeek: lastWeekCards.length }
      ]);

      setAnimationKey(prev => prev + 1);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  const chartColors = {
    gold: "hsl(var(--gold))",
    purple: "#9333ea",
    green: "#22c55e",
    amber: "#f59e0b"
  };

  return (
    <div className="space-y-6">
      {/* Radar Chart - Trait Mastery */}
      {traitData.length > 0 && (
        <Card className="bg-card/50 border-border overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-5 h-5 text-gold" />
              Trait Mastery Radar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart key={`radar-${animationKey}`} data={traitData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid 
                    stroke="hsl(var(--muted))" 
                    strokeOpacity={0.3}
                  />
                  <PolarAngleAxis 
                    dataKey="trait" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10 }}
                    tickCount={4}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke={chartColors.gold}
                    fill={chartColors.gold}
                    fillOpacity={0.4}
                    strokeWidth={2}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Area Chart */}
      <Card className="bg-card/50 border-border overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-5 h-5 text-gold" />
            7-Day Performance Wave
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart key={`area-${animationKey}`} data={progressData}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColors.gold} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={chartColors.gold} stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="tasksGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColors.purple} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={chartColors.purple} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" strokeOpacity={0.3} />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--muted))' }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--muted))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  name="Score"
                  stroke={chartColors.gold}
                  fill="url(#scoreGradient)"
                  strokeWidth={3}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
                <Area
                  type="monotone"
                  dataKey="tasks"
                  name="Tasks"
                  stroke={chartColors.purple}
                  fill="url(#tasksGradient)"
                  strokeWidth={2}
                  animationDuration={1800}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Comparison Bar Chart */}
      <Card className="bg-card/50 border-border overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="w-5 h-5 text-gold" />
            Week-Over-Week Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 sm:h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart key={`bar-${animationKey}`} data={weeklyComparison} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" strokeOpacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis 
                  type="category" 
                  dataKey="label" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar 
                  dataKey="lastWeek" 
                  name="Last Week" 
                  fill={chartColors.amber}
                  opacity={0.5}
                  animationDuration={1200}
                  radius={[0, 4, 4, 0]}
                />
                <Bar 
                  dataKey="thisWeek" 
                  name="This Week" 
                  fill={chartColors.gold}
                  animationDuration={1500}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-500/50" />
              <span className="text-muted-foreground">Last Week</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gold" />
              <span className="text-muted-foreground">This Week</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Streak Flame Animation */}
      <Card className="bg-gradient-to-r from-orange-500/10 via-background to-red-500/10 border-orange-500/30 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Flame className="w-12 h-12 text-orange-500 animate-pulse" />
              <div className="absolute inset-0 w-12 h-12 bg-orange-500/30 rounded-full blur-xl animate-pulse" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Consistency Score</p>
              <p className="text-2xl font-bold text-orange-400">
                {progressData.filter(d => d.score > 0 || d.tasks > 0).length}/7 days active
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
