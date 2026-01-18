import { useState } from "react";
import { X, XCircle, Play, RefreshCw, Brain, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CutResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWatchMindMovie: () => void;
  chiefAim?: {
    what?: string;
    byWhen?: string;
    exchange?: string;
    plan?: string;
  };
}

const RESET_QUESTIONS = [
  {
    id: "breathe",
    title: "Take 3 Deep Breaths",
    description: "Inhale for 4 seconds, hold for 4, exhale for 4. Reset your nervous system.",
    icon: RefreshCw,
  },
  {
    id: "recognize",
    title: "Recognize the Old Character",
    description: "What just happened? What old pattern or reaction showed up?",
    icon: Brain,
  },
  {
    id: "remember",
    title: "Remember Your Chief Aim",
    description: "You are the Director. What is the person who achieves your Chief Aim doing right now?",
    icon: Sparkles,
  },
];

export const CutResetModal = ({ isOpen, onClose, onWatchMindMovie, chiefAim }: CutResetModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleStepComplete = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
    if (currentStep < RESET_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleWatchMovie = () => {
    onWatchMindMovie();
    onClose();
    setCurrentStep(0);
    setCompletedSteps([]);
  };

  const handleClose = () => {
    onClose();
    setCurrentStep(0);
    setCompletedSteps([]);
  };

  const allStepsComplete = completedSteps.length >= RESET_QUESTIONS.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg mx-4 bg-card border border-red-500/30 rounded-2xl shadow-2xl shadow-red-500/20 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-center relative">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
            <XCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-display tracking-wider text-white mb-2">CUT!</h2>
          <p className="text-red-100/80 text-sm">
            Time to reset. The old character just showed up. Let's get you back in the Director's chair.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Reset Steps */}
          <div className="space-y-3">
            {RESET_QUESTIONS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isComplete = completedSteps.includes(step.id);

              return (
                <button
                  key={step.id}
                  onClick={() => handleStepComplete(step.id)}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all duration-300",
                    isComplete
                      ? "bg-green-500/10 border-green-500/30"
                      : isActive
                      ? "bg-red-500/10 border-red-500/30 ring-2 ring-red-500/20"
                      : "bg-secondary/50 border-border hover:border-muted-foreground/30"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                        isComplete
                          ? "bg-green-500 text-white"
                          : isActive
                          ? "bg-red-500 text-white"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isComplete ? (
                        <span className="text-lg">✓</span>
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4
                        className={cn(
                          "font-medium mb-1 transition-colors",
                          isComplete ? "text-green-400" : isActive ? "text-red-400" : ""
                        )}
                      >
                        {index + 1}. {step.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Chief Aim Reminder */}
          {chiefAim?.what && (
            <div className="p-4 rounded-xl bg-gold/10 border border-gold/30">
              <h4 className="text-sm font-medium text-gold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Your Chief Aim
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-2">{chiefAim.what}</p>
            </div>
          )}

          {/* Watch Mind Movie Button */}
          <Button
            onClick={handleWatchMovie}
            className={cn(
              "w-full h-14 text-lg font-semibold transition-all duration-300",
              allStepsComplete
                ? "bg-gradient-to-r from-gold to-amber-500 text-black hover:from-gold/90 hover:to-amber-500/90 shadow-lg shadow-gold/30"
                : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600"
            )}
          >
            <Play className="w-5 h-5 mr-2" />
            {allStepsComplete ? "Watch Mind Movie & Reset" : "Skip to Mind Movie"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Remember: You are the Director. The old character is just an actor who went off-script.
          </p>
        </div>
      </div>
    </div>
  );
};