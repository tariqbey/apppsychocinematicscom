import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { usePointsHistory, PointsHistoryEntry } from "@/hooks/usePointsHistory";
import { format, parseISO } from "date-fns";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PointsHistoryChartProps {
  className?: string;
}

export const PointsHistoryChart = ({ className }: PointsHistoryChartProps) => {
  const [range, setRange] = useState<7 | 14 | 30>(14);
  const { history, loading } = usePointsHistory(range);

  const chartData = useMemo(() => {
    return history.slice(-range).map((entry) => ({
      date: entry.date,
      displayDate: format(parseISO(entry.date), "MMM d"),
      total: entry.total_points,
      rituals: entry.ritual_points,
      tasks: entry.task_points,
      journal: entry.journal_points,
      scorecard: entry.scorecard_points,
      bonus: entry.bonus_points,
      penalty: entry.penalty_points,
    }));
  }, [history, range]);

  const stats = useMemo(() => {
    if (chartData.length < 2) return { trend: 0, avg: 0, best: 0 };
    
    const totals = chartData.map((d) => d.total);
    const avg = Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);
    const best = Math.max(...totals);
    
    // Calculate trend (last 7 days vs previous 7 days)
    const recent = chartData.slice(-7);
    const previous = chartData.slice(-14, -7);
    const recentAvg = recent.length > 0 
      ? recent.reduce((a, b) => a + b.total, 0) / recent.length 
      : 0;
    const prevAvg = previous.length > 0 
      ? previous.reduce((a, b) => a + b.total, 0) / previous.length 
      : recentAvg;
    const trend = prevAvg > 0 ? Math.round(((recentAvg - prevAvg) / prevAvg) * 100) : 0;

    return { trend, avg, best };
  }, [chartData]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-48 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-display text-gold text-sm">Points Trend</h4>
          <div className="flex items-center gap-2 mt-1">
            {stats.trend > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : stats.trend < 0 ? (
              <TrendingDown className="w-4 h-4 text-red-400" />
            ) : (
              <Minus className="w-4 h-4 text-muted-foreground" />
            )}
            <span className={`text-xs ${stats.trend > 0 ? 'text-green-400' : stats.trend < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
              {stats.trend > 0 ? '+' : ''}{stats.trend}% vs previous week
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          {([7, 14, 30] as const).map((r) => (
            <Button
              key={r}
              variant={range === r ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setRange(r)}
            >
              {r}d
            </Button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary/30 rounded-lg p-2 text-center">
          <p className="text-lg font-display text-gold">{stats.avg}</p>
          <p className="text-[10px] text-muted-foreground">Daily Avg</p>
        </div>
        <div className="bg-secondary/30 rounded-lg p-2 text-center">
          <p className="text-lg font-display text-green-400">{stats.best}</p>
          <p className="text-[10px] text-muted-foreground">Best Day</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="pointsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  total: 'Total',
                  rituals: 'Rituals',
                  tasks: 'Tasks',
                  journal: 'Journal',
                  scorecard: 'Scorecard',
                  bonus: 'Bonus',
                  penalty: 'Penalty',
                };
                return [value, labels[name] || name];
              }}
              labelFormatter={(label) => `${label}`}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#D4AF37"
              strokeWidth={2}
              fill="url(#pointsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown legend */}
      <div className="flex flex-wrap justify-center gap-3 text-[10px]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400" /> Rituals
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-400" /> Tasks
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-400" /> Journal
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-gold" /> Bonus
        </span>
      </div>
    </div>
  );
};
