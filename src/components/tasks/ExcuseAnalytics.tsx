import { useExcuseAnalytics } from "@/hooks/useExcuseAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, TrendingUp, AlertTriangle, Clock, Users, Zap, Target, Lightbulb, CheckCircle2 } from "lucide-react";
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

interface CoachingTip {
  title: string;
  tips: string[];
  affirmation: string;
}

const COACHING_TIPS: Record<string, CoachingTip> = {
  procrastinating: {
    title: "Overcoming Procrastination",
    tips: [
      "Break tasks into 2-minute micro-actions to reduce resistance",
      "Use the 'Director's Chair' technique: visualize completing the task before starting",
      "Set a timer for 25 minutes and commit to focused work (Pomodoro)",
      "Ask yourself: 'What would the future version of me do right now?'",
      "Remove distractions before starting—close tabs, silence notifications",
    ],
    affirmation: "You are the Director of your movie. Every scene you shoot moves your story forward. Action!",
  },
  others_movie: {
    title: "Staying in Your Own Movie",
    tips: [
      "Practice saying 'Let me check my schedule' before committing to requests",
      "Block 'Director Time' on your calendar for your priorities first",
      "Remember: helping others is noble, but not at the cost of your Chief Aim",
      "Use the CUT! technique when you feel pulled into someone else's drama",
      "Set clear boundaries with a simple script: 'I'd love to help, but I have commitments today'",
    ],
    affirmation: "Your movie matters. You can't direct someone else's film and your own at the same time. Stay on set.",
  },
  ran_out_of_time: {
    title: "Mastering Your Time",
    tips: [
      "Do your Three Things first thing in the morning before anything else",
      "Time-block your day—assign specific hours to your priority tasks",
      "Audit your day: where are the time leaks? Social media, meetings, browsing?",
      "Use Parkinson's Law: give tasks tighter deadlines to increase focus",
      "Plan tomorrow's Three Things the night before to hit the ground running",
    ],
    affirmation: "You have the same 24 hours as every successful director. It's not about finding time—it's about making time.",
  },
};

function getCoachingTip(mostCommonExcuse: string | null, excuseCounts: { reason: string; count: number }[]): CoachingTip | null {
  if (!mostCommonExcuse) return null;
  
  // Find the reason key from the label
  const excuseEntry = excuseCounts.find(e => 
    COACHING_TIPS[e.reason] && 
    (e.reason === "procrastinating" && mostCommonExcuse === "Procrastinating") ||
    (e.reason === "others_movie" && mostCommonExcuse === "Someone else's movie") ||
    (e.reason === "ran_out_of_time" && mostCommonExcuse === "Ran out of time")
  );
  
  if (!excuseEntry) return null;
  return COACHING_TIPS[excuseEntry.reason];
}

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

  const coachingTip = getCoachingTip(analytics.mostCommonExcuse, analytics.excuseCounts);

  return (
    <div className="space-y-4">
      {/* Personalized Coaching Tips */}
      {coachingTip && totalExcuses >= 3 && (
        <Card className="glass-card border-gold/30 bg-gradient-to-br from-gold/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display tracking-wide flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-gold" />
              Director's Coaching: {coachingTip.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Based on your patterns, here are personalized tips to help you stay on script:
            </p>
            <ul className="space-y-2">
              {coachingTip.tips.slice(0, 3).map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 p-3 rounded-lg bg-gold/10 border border-gold/20">
              <p className="text-sm italic text-gold">
                "{coachingTip.affirmation}"
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
