import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Card } from "@/components/ui/card";
import { JournalEntry, MOOD_OPTIONS } from "@/hooks/useJournal";
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";

interface MoodTrendChartProps {
  entries: JournalEntry[];
  days?: number;
}

// Map moods to numerical scores for visualization
const MOOD_SCORES: Record<string, number> = {
  excited: 5,
  breakthrough: 5,
  focused: 4,
  grateful: 4,
  reflective: 3,
  challenged: 2,
  struggling: 1,
};

const MOOD_COLORS: Record<string, string> = {
  excited: "hsl(35, 90%, 55%)",
  breakthrough: "hsl(43, 74%, 49%)",
  focused: "hsl(200, 70%, 50%)",
  grateful: "hsl(140, 70%, 45%)",
  reflective: "hsl(260, 50%, 60%)",
  challenged: "hsl(25, 80%, 50%)",
  struggling: "hsl(0, 60%, 50%)",
};

export function MoodTrendChart({ entries, days = 30 }: MoodTrendChartProps) {
  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const startDate = subDays(today, days - 1);
    
    // Create array of all days in range
    const dateRange = eachDayOfInterval({ start: startDate, end: today });
    
    // Group entries by date
    const entriesByDate = entries.reduce((acc, entry) => {
      const date = format(new Date(entry.created_at), "yyyy-MM-dd");
      if (!acc[date]) acc[date] = [];
      acc[date].push(entry);
      return acc;
    }, {} as Record<string, JournalEntry[]>);
    
    // Create chart data with mood scores
    return dateRange.map(date => {
      const dateStr = format(date, "yyyy-MM-dd");
      const dayEntries = entriesByDate[dateStr] || [];
      
      // Calculate average mood score for the day
      const moodsWithScores = dayEntries
        .filter(e => e.mood && MOOD_SCORES[e.mood])
        .map(e => MOOD_SCORES[e.mood!]);
      
      const avgScore = moodsWithScores.length > 0
        ? moodsWithScores.reduce((a, b) => a + b, 0) / moodsWithScores.length
        : null;
      
      // Get most common mood for the day
      const moodCounts = dayEntries.reduce((acc, e) => {
        if (e.mood) acc[e.mood] = (acc[e.mood] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      
      return {
        date: dateStr,
        displayDate: format(date, "MMM d"),
        score: avgScore,
        entries: dayEntries.length,
        mood: dominantMood,
        moodLabel: dominantMood ? MOOD_OPTIONS.find(m => m.value === dominantMood)?.label : null,
        moodEmoji: dominantMood ? MOOD_OPTIONS.find(m => m.value === dominantMood)?.emoji : null,
      };
    });
  }, [entries, days]);

  // Calculate mood distribution
  const moodDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    entries.forEach(entry => {
      if (entry.mood) {
        distribution[entry.mood] = (distribution[entry.mood] || 0) + 1;
      }
    });
    
    return MOOD_OPTIONS.map(mood => ({
      ...mood,
      count: distribution[mood.value] || 0,
      percentage: entries.length > 0 
        ? Math.round((distribution[mood.value] || 0) / entries.length * 100) 
        : 0,
    })).sort((a, b) => b.count - a.count);
  }, [entries]);

  const hasData = chartData.some(d => d.score !== null);

  if (!hasData) {
    return (
      <Card className="p-6">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          📊 Mood Trends
        </h3>
        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
          Start adding moods to your journal entries to see your emotional patterns
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="font-medium mb-2 flex items-center gap-2">
          📊 Mood Trends
        </h3>
        <p className="text-sm text-muted-foreground">
          Your emotional patterns over the last {days} days
        </p>
      </div>

      {/* Chart */}
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(43, 74%, 49%)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(43, 74%, 49%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="displayDate" 
              tick={{ fill: 'hsl(40, 10%, 60%)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={[0, 5]}
              tick={{ fill: 'hsl(40, 10%, 60%)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              ticks={[1, 2, 3, 4, 5]}
              tickFormatter={(value) => {
                const labels: Record<number, string> = { 1: '😔', 2: '💪', 3: '🪞', 4: '🎯', 5: '🔥' };
                return labels[value] || '';
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                if (data.score === null) return null;
                
                return (
                  <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-medium text-sm">{data.displayDate}</p>
                    {data.moodEmoji && (
                      <p className="text-sm mt-1">
                        {data.moodEmoji} {data.moodLabel}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {data.entries} {data.entries === 1 ? 'entry' : 'entries'}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="hsl(43, 74%, 49%)"
              strokeWidth={2}
              fill="url(#moodGradient)"
              connectNulls
              dot={(props: any) => {
                if (props.payload.score === null) return null;
                const mood = props.payload.mood;
                const color = mood ? MOOD_COLORS[mood] : "hsl(43, 74%, 49%)";
                return (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={4}
                    fill={color}
                    stroke="hsl(0, 0%, 4%)"
                    strokeWidth={2}
                  />
                );
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Mood Distribution */}
      <div>
        <h4 className="text-sm font-medium mb-3">Mood Distribution</h4>
        <div className="space-y-2">
          {moodDistribution.slice(0, 5).map(mood => (
            <div key={mood.value} className="flex items-center gap-2">
              <span className="text-lg w-6">{mood.emoji}</span>
              <span className="text-sm flex-1">{mood.label}</span>
              <div className="flex-1 max-w-[120px] h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${mood.percentage}%`,
                    backgroundColor: MOOD_COLORS[mood.value] || 'hsl(43, 74%, 49%)'
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-10 text-right">
                {mood.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
