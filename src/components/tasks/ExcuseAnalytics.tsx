import { useExcuseAnalytics } from "@/hooks/useExcuseAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, TrendingUp, AlertTriangle, Clock, Users, Zap, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";

const EXCUSE_COLORS = {
  procrastinating: "hsl(var(--destructive))",
  others_movie: "hsl(var(--gold))",
  ran_out_of_time: "hsl(var(--muted-foreground))",
};

const EXCUSE_ICONS = {
  procrastinating: <Zap className="h-4 w-4" />,
  others_movie: <Users className="h-4 w-4" />,
  ran_out_of_time: <Clock className="h-4 w-4" />,
};

export function ExcuseAnalytics() {
  const { analytics, isLoading } = useExcuseAnalytics(30);

  if (isLoading) {
    return (
      <Card className="glass-card cinematic-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  const totalExcuses = analytics.excuseCounts.reduce((sum, e) => sum + e.count, 0);
  
  const pieData = analytics.excuseCounts
    .filter(e => e.count > 0)
    .map(e => ({
      name: e.label,
      value: e.count,
      color: EXCUSE_COLORS[e.reason as keyof typeof EXCUSE_COLORS],
    }));

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              <span className="text-xs">Completion Rate</span>
            </div>
            <p className="text-2xl font-bold text-gold">{analytics.completionRate}%</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Tasks Completed</span>
            </div>
            <p className="text-2xl font-bold text-primary">{analytics.totalCompleted}</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">Tasks Incomplete</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{analytics.totalIncomplete}</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Zap className="h-4 w-4" />
              <span className="text-xs">Top Excuse</span>
            </div>
            <p className="text-sm font-medium truncate">
              {analytics.mostCommonExcuse || "None yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Excuse Breakdown */}
        <Card className="glass-card cinematic-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display tracking-wide">
              Excuse Patterns (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {totalExcuses === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No excuses recorded yet</p>
                <p className="text-xs">Keep completing your tasks!</p>
              </div>
            ) : (
              <>
                {analytics.excuseCounts.map((excuse) => {
                  const percentage = totalExcuses > 0 
                    ? Math.round((excuse.count / totalExcuses) * 100) 
                    : 0;
                  
                  return (
                    <div key={excuse.reason} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {EXCUSE_ICONS[excuse.reason as keyof typeof EXCUSE_ICONS]}
                          <span>{excuse.label}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {excuse.count} ({percentage}%)
                        </span>
                      </div>
                      <Progress 
                        value={percentage} 
                        className="h-2"
                        style={{
                          ["--progress-color" as string]: EXCUSE_COLORS[excuse.reason as keyof typeof EXCUSE_COLORS]
                        }}
                      />
                    </div>
                  );
                })}
              </>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="glass-card cinematic-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display tracking-wide">
              Excuse Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No data to display</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trends */}
      <Card className="glass-card cinematic-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display tracking-wide">
            Weekly Excuse Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.weeklyTrends}>
              <XAxis 
                dataKey="week" 
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar 
                dataKey="procrastinating" 
                name="Procrastinating" 
                fill={EXCUSE_COLORS.procrastinating} 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="others_movie" 
                name="Someone else's movie" 
                fill={EXCUSE_COLORS.others_movie}
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="ran_out_of_time" 
                name="Ran out of time" 
                fill={EXCUSE_COLORS.ran_out_of_time}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
