import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCycleTracking } from "@/hooks/useCycleTracking";
import { Map, CheckCircle2, Circle, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export function TransformationRoadmap() {
  const { cycleInfo, getActName } = useCycleTracking();

  const acts = [
    {
      number: 1,
      name: "The Awakening",
      cycles: 3,
      startCycle: 1,
      description: "Establish your foundation",
      color: "from-amber-500/20 to-yellow-500/20",
      borderColor: "border-amber-500/50",
      textColor: "text-amber-400",
    },
    {
      number: 2,
      name: "The Integration",
      cycles: 4,
      startCycle: 4,
      description: "Deep work & transformation",
      color: "from-gold/20 to-amber-500/20",
      borderColor: "border-gold/50",
      textColor: "text-gold",
    },
    {
      number: 3,
      name: "The Mastery",
      cycles: 3,
      startCycle: 8,
      description: "Embody your new identity",
      color: "from-emerald-500/20 to-teal-500/20",
      borderColor: "border-emerald-500/50",
      textColor: "text-emerald-400",
    },
  ];

  const getCycleStatus = (cycleNumber: number) => {
    if (!cycleInfo?.transformationStartDate) return "locked";
    if (cycleNumber < cycleInfo.currentCycle) return "completed";
    if (cycleNumber === cycleInfo.currentCycle) return "active";
    return "upcoming";
  };

  const getCycleName = (cycleIndex: number, actNumber: number) => {
    const cyclesInAct = acts.find(a => a.number === actNumber)?.cycles || 3;
    if (cycleIndex === 0) return "Foundation";
    if (cycleIndex === cyclesInAct - 1) return "Mastery";
    if (actNumber === 2 && cycleIndex === 1) return "Deep Work";
    return "Integration";
  };

  return (
    <Card className="glass-card border-gold/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display tracking-wide flex items-center gap-2">
          <Map className="h-5 w-5 text-gold" />
          Transformation Roadmap
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          210 days • 10 cycles • 3 acts
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timeline visualization */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/30 via-gold/30 to-emerald-500/30" />
          
          {/* Acts */}
          <div className="relative flex justify-between">
            {acts.map((act, actIndex) => {
              const actCycles = Array.from({ length: act.cycles }, (_, i) => act.startCycle + i);
              const isActComplete = cycleInfo?.currentCycle ? act.startCycle + act.cycles <= cycleInfo.currentCycle : false;
              const isActActive = cycleInfo?.currentCycle ? 
                cycleInfo.currentCycle >= act.startCycle && cycleInfo.currentCycle < act.startCycle + act.cycles : false;
              
              return (
                <div 
                  key={act.number} 
                  className={cn(
                    "flex-1 relative",
                    actIndex < acts.length - 1 && "mr-2"
                  )}
                >
                  {/* Act header */}
                  <div className={cn(
                    "rounded-lg p-3 mb-3 border bg-gradient-to-br",
                    act.color,
                    act.borderColor,
                    isActActive && "ring-2 ring-gold/50"
                  )}>
                    <div className="flex items-center justify-between mb-1">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", act.textColor, act.borderColor)}
                      >
                        Act {act.number}
                      </Badge>
                      {isActComplete && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      )}
                      {isActActive && (
                        <Play className="h-4 w-4 text-gold fill-gold" />
                      )}
                    </div>
                    <h4 className={cn("font-semibold text-sm", act.textColor)}>
                      {act.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {act.cycles} cycles • {act.cycles * 21} days
                    </p>
                  </div>
                  
                  {/* Cycle nodes */}
                  <div className="flex gap-1">
                    {actCycles.map((cycleNum, i) => {
                      const status = getCycleStatus(cycleNum);
                      const cycleName = getCycleName(i, act.number);
                      
                      return (
                        <div 
                          key={cycleNum}
                          className="flex-1 group relative"
                        >
                          {/* Cycle indicator */}
                          <div className={cn(
                            "h-10 rounded-md border flex items-center justify-center transition-all",
                            status === "completed" && "bg-gold/20 border-gold/50",
                            status === "active" && "bg-gold/30 border-gold ring-2 ring-gold/50 animate-pulse",
                            status === "upcoming" && "bg-muted/30 border-border",
                            status === "locked" && "bg-muted/10 border-border/50 opacity-50"
                          )}>
                            {status === "completed" ? (
                              <CheckCircle2 className="h-4 w-4 text-gold" />
                            ) : status === "active" ? (
                              <span className="text-xs font-bold text-gold">
                                {cycleInfo?.currentCycleDay}
                              </span>
                            ) : (
                              <Circle className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          
                          {/* Cycle label */}
                          <div className="mt-1 text-center">
                            <p className={cn(
                              "text-[10px] font-medium leading-tight",
                              status === "active" ? "text-gold" : "text-muted-foreground"
                            )}>
                              C{cycleNum}
                            </p>
                          </div>
                          
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                            <p className="text-xs font-medium">Cycle {cycleNum}: {cycleName}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {status === "completed" && "Completed ✓"}
                              {status === "active" && `Day ${cycleInfo?.currentCycleDay}/21`}
                              {status === "upcoming" && "Upcoming"}
                              {status === "locked" && "Start your journey"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gold/20 border border-gold/50" />
            <span className="text-xs text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gold/30 border border-gold ring-1 ring-gold/50" />
            <span className="text-xs text-muted-foreground">Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-muted/30 border border-border" />
            <span className="text-xs text-muted-foreground">Upcoming</span>
          </div>
        </div>

        {/* Progress summary */}
        {cycleInfo?.transformationStartDate && (
          <div className="text-center p-3 rounded-lg bg-muted/20 border border-border">
            <p className="text-sm">
              <span className="text-gold font-semibold">{getActName(cycleInfo.currentAct)}</span>
              {" • "}
              <span className="text-muted-foreground">
                Day {cycleInfo.totalDaysInProgram} of 210
              </span>
            </p>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 via-gold to-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min((cycleInfo.totalDaysInProgram / 210) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}