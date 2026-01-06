import { Check, Circle, Film, Scissors, Play, Drama, BarChart3, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PhaseData {
  id: number;
  name: string;
  shortName: string;
  description: string;
  icon: React.ReactNode;
}

const PHASES: PhaseData[] = [
  {
    id: 1,
    name: "Pre-Production",
    shortName: "Pre-Prod",
    description: "Identity Engineering — Craft your Director Character and Definite Chief Aim",
    icon: <Circle className="w-4 h-4" />,
  },
  {
    id: 2,
    name: "Production",
    shortName: "Production",
    description: "Movie Creation — Create your Mind Movie using AI tools",
    icon: <Film className="w-4 h-4" />,
  },
  {
    id: 3,
    name: "Post-Production",
    shortName: "Post-Prod",
    description: "Refinement — Edit and polish your movie for maximum impact",
    icon: <Scissors className="w-4 h-4" />,
  },
  {
    id: 4,
    name: "Distribution",
    shortName: "Distribution",
    description: "Viewing Protocol — Daily immersive viewing of your Mind Movie",
    icon: <Play className="w-4 h-4" />,
  },
  {
    id: 5,
    name: "Performance",
    shortName: "Performance",
    description: "Living the Movie — Embody your Director Character daily",
    icon: <Drama className="w-4 h-4" />,
  },
  {
    id: 6,
    name: "Scoring",
    shortName: "Scoring",
    description: "Performance Tracking — Daily Director Scorecard",
    icon: <BarChart3 className="w-4 h-4" />,
  },
  {
    id: 7,
    name: "Editing",
    shortName: "Editing",
    description: "Adaptation — Update your script as your vision evolves",
    icon: <RefreshCw className="w-4 h-4" />,
  },
];

interface PhaseProgressProps {
  chiefAimComplete: boolean;
  hasMindMovie: boolean;
  hasViewingHistory: boolean;
  hasCompletedTasks: boolean;
  hasScorecard: boolean;
}

export function PhaseProgress({
  chiefAimComplete,
  hasMindMovie,
  hasViewingHistory,
  hasCompletedTasks,
  hasScorecard,
}: PhaseProgressProps) {
  // Determine phase completion status
  const getPhaseStatus = (phaseId: number): "complete" | "current" | "locked" => {
    switch (phaseId) {
      case 1: // Pre-Production
        return chiefAimComplete ? "complete" : "current";
      case 2: // Production
        if (!chiefAimComplete) return "locked";
        return hasMindMovie ? "complete" : "current";
      case 3: // Post-Production
        if (!hasMindMovie) return "locked";
        return hasMindMovie ? "complete" : "current"; // Auto-complete with mind movie
      case 4: // Distribution
        if (!hasMindMovie) return "locked";
        return hasViewingHistory ? "complete" : "current";
      case 5: // Performance
        if (!hasViewingHistory) return "locked";
        return hasCompletedTasks ? "complete" : "current";
      case 6: // Scoring
        if (!hasCompletedTasks) return "locked";
        return hasScorecard ? "complete" : "current";
      case 7: // Editing
        // Always available once you have a Chief Aim (continuous phase)
        return chiefAimComplete ? "current" : "locked";
      default:
        return "locked";
    }
  };

  const completedCount = PHASES.filter(p => getPhaseStatus(p.id) === "complete").length;
  const progressPercent = Math.round((completedCount / 6) * 100); // Phase 7 is ongoing

  return (
    <TooltipProvider>
      <div className="glass-card p-5 cinematic-border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-display tracking-wide">Production Progress</h3>
            <p className="text-sm text-muted-foreground">7-Phase Framework</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-display text-gold">{progressPercent}%</span>
            <p className="text-xs text-muted-foreground">{completedCount}/6 phases</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-gold to-amber-soft transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Phase Indicators */}
        <div className="flex justify-between items-start gap-1">
          {PHASES.map((phase) => {
            const status = getPhaseStatus(phase.id);
            return (
              <Tooltip key={phase.id}>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                        status === "complete" && "bg-gold border-gold text-primary-foreground",
                        status === "current" && "bg-gold/20 border-gold text-gold animate-pulse",
                        status === "locked" && "bg-muted/30 border-border text-muted-foreground/50"
                      )}
                    >
                      {status === "complete" ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        phase.icon
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] text-center leading-tight",
                        status === "complete" && "text-gold",
                        status === "current" && "text-foreground font-medium",
                        status === "locked" && "text-muted-foreground/50"
                      )}
                    >
                      {phase.id}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <div className="space-y-1">
                    <p className="font-semibold text-gold">Phase {phase.id}: {phase.name}</p>
                    <p className="text-xs text-muted-foreground">{phase.description}</p>
                    <p className={cn(
                      "text-xs font-medium",
                      status === "complete" && "text-green-400",
                      status === "current" && "text-gold",
                      status === "locked" && "text-muted-foreground"
                    )}>
                      {status === "complete" ? "✓ Complete" : status === "current" ? "→ In Progress" : "🔒 Locked"}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Current Phase Highlight */}
        {PHASES.map((phase) => {
          const status = getPhaseStatus(phase.id);
          if (status === "current" && phase.id !== 7) {
            return (
              <div key={phase.id} className="p-3 rounded-lg bg-gold/10 border border-gold/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gold">{phase.icon}</span>
                  <span className="text-sm font-medium text-gold">Phase {phase.id}: {phase.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{phase.description}</p>
              </div>
            );
          }
          return null;
        })}
      </div>
    </TooltipProvider>
  );
}
