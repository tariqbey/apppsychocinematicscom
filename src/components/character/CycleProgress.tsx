import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCycleTracking } from "@/hooks/useCycleTracking";
import { Calendar, Flame, RotateCcw, Target, Trophy, Zap, Play, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CycleProgressProps {
  onStartReview?: () => void;
  compact?: boolean;
}

export function CycleProgress({ onStartReview, compact = false }: CycleProgressProps) {
  const { 
    cycleInfo, 
    loading, 
    startTransformation, 
    getActName, 
    getCycleName,
    DAYS_PER_CYCLE,
    CYCLES_PER_ACT
  } = useCycleTracking();

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="py-6">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!cycleInfo?.transformationStartDate) {
    return (
      <Card className="glass-card border-gold/30 bg-gradient-to-br from-gold/5 via-transparent to-amber-500/5">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold/20 to-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-gold" />
          </div>
          <CardTitle className="text-xl font-display">Begin Your 21-Day Transformation</CardTitle>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Start your journey with 21-day cycles of intentional character development. 
            Every 3 cycles completes an Act in your transformation story.
          </p>
        </CardHeader>
        <CardContent className="text-center pb-6">
          <Button 
            variant="gold" 
            size="lg" 
            onClick={startTransformation}
            className="gap-2"
          >
            <Zap className="h-5 w-5" />
            Start Day 1
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="glass-card cinematic-border">
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/20 to-amber-500/20 flex items-center justify-center">
                <span className="text-lg font-bold text-gold">{cycleInfo.currentCycleDay}</span>
              </div>
              <div>
                <p className="text-sm font-medium">
                  Day {cycleInfo.currentCycleDay} of {DAYS_PER_CYCLE}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getCycleName(cycleInfo.currentCycle, cycleInfo.currentAct)} • {getActName(cycleInfo.currentAct)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={cycleInfo.cycleProgress} className="w-24 h-2" />
              {cycleInfo.isReviewDue && (
                <Button variant="gold" size="sm" onClick={onStartReview} className="gap-1">
                  Review <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const cycleWithinAct = ((cycleInfo.currentCycle - 1) % CYCLES_PER_ACT) + 1;

  return (
    <Card className="glass-card border-gold/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display tracking-wide flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-gold" />
            21-Day Transformation Cycle
          </CardTitle>
          <Badge variant="outline" className="border-gold/50 text-gold">
            {getActName(cycleInfo.currentAct)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Cycle Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold/30 to-amber-500/30 flex items-center justify-center border-2 border-gold/50">
                <span className="text-2xl font-bold text-gold">{cycleInfo.currentCycleDay}</span>
              </div>
              <div>
                <p className="font-medium">
                  Cycle {cycleInfo.currentCycle}: {getCycleName(cycleInfo.currentCycle, cycleInfo.currentAct)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {cycleInfo.daysUntilCycleEnd > 0 
                    ? `${cycleInfo.daysUntilCycleEnd} days until cycle review`
                    : "Cycle complete! Time for review"
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gold">{Math.round(cycleInfo.cycleProgress)}%</p>
              <p className="text-xs text-muted-foreground">cycle progress</p>
            </div>
          </div>
          <Progress value={cycleInfo.cycleProgress} className="h-3" />
        </div>

        {/* Act Progress */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium">{getActName(cycleInfo.currentAct)}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Cycle {cycleWithinAct} of {CYCLES_PER_ACT}
            </span>
          </div>
          
          {/* Act cycle indicators */}
          <div className="flex gap-2">
            {Array.from({ length: CYCLES_PER_ACT }).map((_, i) => (
              <div 
                key={i} 
                className={`flex-1 h-2 rounded-full ${
                  i < cycleWithinAct - 1 
                    ? "bg-gold" 
                    : i === cycleWithinAct - 1 
                      ? "bg-gradient-to-r from-gold to-gold/30" 
                      : "bg-muted"
                }`}
                style={i === cycleWithinAct - 1 ? { 
                  background: `linear-gradient(to right, hsl(var(--gold)) ${cycleInfo.cycleProgress}%, hsl(var(--muted)) ${cycleInfo.cycleProgress}%)` 
                } : undefined}
              />
            ))}
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Foundation</span>
            <span>Integration</span>
            <span>Mastery</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-muted/20">
            <Calendar className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{cycleInfo.totalDaysInProgram}</p>
            <p className="text-xs text-muted-foreground">Total Days</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/20">
            <Flame className="h-4 w-4 mx-auto mb-1 text-orange-400" />
            <p className="text-lg font-bold">{cycleInfo.cyclesCompleted}</p>
            <p className="text-xs text-muted-foreground">Cycles Done</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/20">
            <Target className="h-4 w-4 mx-auto mb-1 text-green-400" />
            <p className="text-lg font-bold">{Math.floor(cycleInfo.cyclesCompleted / CYCLES_PER_ACT)}</p>
            <p className="text-xs text-muted-foreground">Acts Complete</p>
          </div>
        </div>

        {/* Review CTA */}
        {cycleInfo.isReviewDue && (
          <Button 
            variant="gold" 
            className="w-full gap-2"
            onClick={onStartReview}
          >
            <Trophy className="h-4 w-4" />
            Complete Cycle {cycleInfo.currentCycle} Review
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
