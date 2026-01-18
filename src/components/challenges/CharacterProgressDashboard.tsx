import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Episode } from "@/hooks/useEpisodes";
import { 
  TrendingUp, 
  Target, 
  Flame, 
  Shield, 
  Zap,
  Award,
  ArrowUp
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { format, subDays } from "date-fns";

interface AdversityChallenge {
  id: string;
  target_trait: string;
  trait_xp_earned: number | null;
  completed: boolean;
  did_cut: boolean | null;
  challenge_date: string;
  created_at: string;
}

interface CharacterProgressDashboardProps {
  challenges: AdversityChallenge[];
  activeEpisode: Episode | null;
}

export function CharacterProgressDashboard({ 
  challenges, 
  activeEpisode 
}: CharacterProgressDashboardProps) {
  // Calculate XP per trait
  const traitXP = useMemo(() => {
    const xpMap: Record<string, number> = {};
    challenges.forEach(c => {
      if (c.trait_xp_earned && c.completed) {
        xpMap[c.target_trait] = (xpMap[c.target_trait] || 0) + c.trait_xp_earned;
      }
    });
    return Object.entries(xpMap)
      .map(([trait, xp]) => ({ trait, xp }))
      .sort((a, b) => b.xp - a.xp);
  }, [challenges]);

  // Calculate XP over time for chart
  const xpOverTime = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return {
        date: format(date, "MMM d"),
        xp: 0,
        cumulative: 0
      };
    });

    let cumulative = 0;
    challenges
      .filter(c => c.completed && c.trait_xp_earned)
      .sort((a, b) => new Date(a.challenge_date).getTime() - new Date(b.challenge_date).getTime())
      .forEach(c => {
        const dateStr = format(new Date(c.challenge_date), "MMM d");
        const dayData = last30Days.find(d => d.date === dateStr);
        if (dayData) {
          dayData.xp += c.trait_xp_earned || 0;
        }
      });

    // Calculate cumulative
    last30Days.forEach((day, i) => {
      cumulative += day.xp;
      day.cumulative = cumulative;
    });

    return last30Days;
  }, [challenges]);

  // Calculate transformation arc metrics
  const transformationMetrics = useMemo(() => {
    const completedChallenges = challenges.filter(c => c.completed);
    const cutCount = completedChallenges.filter(c => c.did_cut).length;
    const totalXP = completedChallenges.reduce((sum, c) => sum + (c.trait_xp_earned || 0), 0);
    
    // Calculate "mastery level" (0-100)
    const masteryLevel = Math.min(100, Math.floor(totalXP / 10));
    
    // Calculate cut rate
    const cutRate = completedChallenges.length > 0 
      ? Math.round((cutCount / completedChallenges.length) * 100) 
      : 0;

    return {
      totalXP,
      masteryLevel,
      cutRate,
      completedCount: completedChallenges.length,
      cutCount
    };
  }, [challenges]);

  // Get XP level title
  const getLevelTitle = (xp: number) => {
    if (xp < 100) return "Apprentice Director";
    if (xp < 250) return "Rising Director";
    if (xp < 500) return "Seasoned Director";
    if (xp < 1000) return "Master Director";
    return "Legendary Director";
  };

  return (
    <div className="space-y-6">
      {/* Transformation Arc Overview */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-amber-500/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h3 className="font-display text-xl">Transformation Arc</h3>
            <p className="text-sm text-muted-foreground">Your character evolution over time</p>
          </div>
        </div>

        {/* Level Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-gold" />
              <span className="font-medium">{getLevelTitle(transformationMetrics.totalXP)}</span>
            </div>
            <span className="text-gold font-bold">{transformationMetrics.totalXP} XP</span>
          </div>
          <Progress value={transformationMetrics.masteryLevel} className="h-3" />
          <p className="text-xs text-muted-foreground mt-1">
            {100 - transformationMetrics.masteryLevel}% to next level
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-muted/50">
            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{transformationMetrics.completedCount}</p>
            <p className="text-xs text-muted-foreground">Challenges</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <Shield className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{transformationMetrics.cutRate}%</p>
            <p className="text-xs text-muted-foreground">CUT Rate</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <Target className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{traitXP.length}</p>
            <p className="text-xs text-muted-foreground">Traits Trained</p>
          </div>
        </div>
      </Card>

      {/* XP Over Time Chart */}
      <Card className="p-6">
        <h3 className="font-display text-lg mb-4 flex items-center gap-2">
          <ArrowUp className="w-5 h-5 text-green-500" />
          Growth Timeline
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={xpOverTime}>
              <defs>
                <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--gold))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--gold))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip 
                contentStyle={{ 
                  background: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="cumulative" 
                stroke="hsl(var(--gold))" 
                fill="url(#xpGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Trait XP Breakdown */}
      <Card className="p-6">
        <h3 className="font-display text-lg mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Trait Development
        </h3>
        
        {traitXP.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Complete challenges to develop your traits
          </p>
        ) : (
          <div className="space-y-4">
            {traitXP.map(({ trait, xp }) => {
              const level = Math.floor(xp / 50) + 1;
              const progressToNext = (xp % 50) * 2;
              
              return (
                <div key={trait} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{trait}</Badge>
                      <span className="text-xs text-muted-foreground">Level {level}</span>
                    </div>
                    <span className="text-sm font-medium text-gold">{xp} XP</span>
                  </div>
                  <Progress value={progressToNext} className="h-2" />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Active Episode Context */}
      {activeEpisode && (
        <Card className="p-4 border-primary/30 bg-primary/5">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Active Episode</p>
              <p className="text-xs text-muted-foreground">
                Challenges are linked to: {activeEpisode.title}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
