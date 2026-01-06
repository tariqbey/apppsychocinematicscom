import { useState } from "react";
import { TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";

interface ScorecardData {
  scorecard_date: string;
  total_score: number;
}

interface DirectorScoreGraphProps {
  scorecards: ScorecardData[];
}

type TimeRange = 30 | 60 | 90;

export const DirectorScoreGraph = ({ scorecards }: DirectorScoreGraphProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>(30);

  const getFilteredData = () => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);

    return scorecards
      .filter((s) => new Date(s.scorecard_date) >= cutoffDate)
      .map((s) => ({
        date: new Date(s.scorecard_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        score: s.total_score || 0,
        fullDate: s.scorecard_date,
      }));
  };

  const data = getFilteredData();
  const avgScore = data.length > 0
    ? (data.reduce((sum, d) => sum + d.score, 0) / data.length).toFixed(1)
    : "0";
  const perfectDays = data.filter((d) => d.score === 12).length;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-secondary/95 border border-border p-3 rounded-lg shadow-lg">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-lg font-display text-gold">
            Score: {payload[0].value}/12
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-6 cinematic-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/30 to-amber-soft/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h3 className="font-display text-lg">Director Score Trend</h3>
            <p className="text-sm text-muted-foreground">
              Track your performance over time
            </p>
          </div>
        </div>

        <div className="flex gap-1">
          {([30, 60, 90] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "gold" : "ghost"}
              size="sm"
              onClick={() => setTimeRange(range)}
              className="text-xs"
            >
              {range}D
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 rounded-lg bg-secondary/30 border border-border">
          <p className="text-2xl font-display text-gold">{avgScore}</p>
          <p className="text-xs text-muted-foreground">Avg Score</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-secondary/30 border border-border">
          <p className="text-2xl font-display text-foreground">{data.length}</p>
          <p className="text-xs text-muted-foreground">Days Logged</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-secondary/30 border border-border">
          <p className="text-2xl font-display text-gold">{perfectDays}</p>
          <p className="text-xs text-muted-foreground">Perfect Days</p>
        </div>
      </div>

      {/* Chart */}
      {data.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 12]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                ticks={[0, 3, 6, 9, 12]}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={9}
                stroke="hsl(var(--gold))"
                strokeDasharray="5 5"
                strokeOpacity={0.5}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--gold))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--gold))", strokeWidth: 0, r: 3 }}
                activeDot={{ r: 6, fill: "hsl(var(--gold))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No scorecard data yet</p>
          <p className="text-sm text-muted-foreground">
            Submit your daily scorecard to start tracking
          </p>
        </div>
      )}
    </div>
  );
};
