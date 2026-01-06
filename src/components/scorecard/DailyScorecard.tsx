import { useState } from "react";
import { Star, Trophy, Edit3, AlertTriangle, X, Sparkles, Coins, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ScoreRubric {
  score: number;
  label: string;
  description: string;
}

interface ScorecardCategory {
  id: string;
  title: string;
  description: string;
  score: number;
  rubric: ScoreRubric[];
}

interface DailyScorecardProps {
  onClose: () => void;
  onSubmitSuccess?: () => void;
}

const SCORECARD_CATEGORIES: Omit<ScorecardCategory, 'score'>[] = [
  {
    id: "identity",
    title: "Identity Alignment",
    description: "Did I embody my Director Character today?",
    rubric: [
      { score: 0, label: "Off-Script", description: "Felt like an 'extra' - reactive, unfocused, not in character" },
      { score: 1, label: "Rehearsing", description: "Remembered my Director Character but struggled to stay in role" },
      { score: 2, label: "In Character", description: "Mostly embodied my Director Character throughout the day" },
      { score: 3, label: "Oscar-Worthy", description: "Fully lived as my Director Character - every scene was intentional" },
    ],
  },
  {
    id: "behavior",
    title: "Behavior Execution",
    description: "Did I execute my daily rituals and commitments?",
    rubric: [
      { score: 0, label: "Missed", description: "Skipped rituals entirely - no Mind Movie viewing or key habits" },
      { score: 1, label: "Partial", description: "Completed some rituals but missed critical ones" },
      { score: 2, label: "Solid", description: "Hit most rituals including Mind Movie viewing" },
      { score: 3, label: "Flawless", description: "100% ritual execution - Mind Movie, all commitments honored" },
    ],
  },
  {
    id: "emotional",
    title: "Emotional Regulation",
    description: "Did I use the 'CUT!' technique when needed?",
    rubric: [
      { score: 0, label: "Spiraled", description: "Got triggered and stayed off-script - no reset attempted" },
      { score: 1, label: "Late CUT", description: "Eventually reset but spent too long in negative state" },
      { score: 2, label: "Quick CUT", description: "Caught myself and used CUT! technique effectively" },
      { score: 3, label: "Director Mode", description: "Stayed centered or immediately reset - full emotional mastery" },
    ],
  },
  {
    id: "progress",
    title: "Forward Progress",
    description: "Did I take action toward my Chief Aim (Final Scene)?",
    rubric: [
      { score: 0, label: "Stalled", description: "No meaningful action toward my Final Scene today" },
      { score: 1, label: "Minor", description: "Small steps but not significant movement" },
      { score: 2, label: "Advancing", description: "Clear progress on tasks aligned with my Chief Aim" },
      { score: 3, label: "Breakthrough", description: "Major advancement - moved the needle significantly" },
    ],
  },
];

export const DailyScorecard = ({ onClose, onSubmitSuccess }: DailyScorecardProps) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ScorecardCategory[]>(
    SCORECARD_CATEGORIES.map(cat => ({ ...cat, score: 0 }))
  );

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [creditsEarned, setCreditsEarned] = useState(0);

  const updateScore = (id: string, score: number) => {
    setCategories(prev =>
      prev.map(cat => (cat.id === id ? { ...cat, score } : cat))
    );
  };

  const totalScore = categories.reduce((sum, cat) => sum + cat.score, 0);

  const getResult = () => {
    if (totalScore >= 10) {
      return {
        title: "Star of the Show",
        icon: <Trophy className="w-12 h-12 text-gold" />,
        message: "Outstanding performance, Director! You're fully in character.",
        color: "gold",
      };
    } else if (totalScore >= 7) {
      return {
        title: "Scene Needs Editing",
        icon: <Edit3 className="w-12 h-12 text-amber-soft" />,
        message: "Good effort. Identify one thing to fix tomorrow.",
        color: "amber",
      };
    } else {
      return {
        title: "CUT! Reset Needed",
        icon: <AlertTriangle className="w-12 h-12 text-cinematic-red" />,
        message: "Time to rewatch your Mind Movie and reconnect with your vision.",
        color: "red",
      };
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to submit your scorecard");
      return;
    }

    setSubmitting(true);

    try {
      const identity = categories.find(c => c.id === "identity")?.score || 0;
      const behavior = categories.find(c => c.id === "behavior")?.score || 0;
      const emotional = categories.find(c => c.id === "emotional")?.score || 0;
      const progress = categories.find(c => c.id === "progress")?.score || 0;

      const { error } = await supabase.from("daily_scorecards").insert({
        user_id: user.id,
        identity_alignment: identity,
        behavior_execution: behavior,
        emotional_regulation: emotional,
        forward_progress: progress,
        total_score: totalScore,
      });

      if (error) {
        if (error.message.includes("duplicate")) {
          toast.error("You've already submitted a scorecard today!");
        } else {
          throw error;
        }
        return;
      }

      // Calculate credits earned
      let earned = totalScore * 10;
      if (totalScore === 12) earned += 50;
      setCreditsEarned(earned);

      setSubmitted(true);
      toast.success(`Scorecard submitted! +${earned} credits earned`);
      onSubmitSuccess?.();
    } catch (err) {
      console.error("Error submitting scorecard:", err);
      toast.error("Failed to submit scorecard");
    } finally {
      setSubmitting(false);
    }
  };

  const result = getResult();

  return (
    <TooltipProvider>
      <div className="fixed inset-0 z-50 bg-cinematic-midnight/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div className="w-full max-w-lg glass-card cinematic-border overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-gold/10 to-transparent shrink-0">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-gold" />
              <div>
                <h2 className="text-2xl font-display tracking-wide">Daily Director Scorecard</h2>
                <p className="text-sm text-muted-foreground">Phase 6: Scoring — Rate your performance</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {!submitted ? (
            <>
              {/* Categories */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {categories.map((category) => (
                  <div key={category.id} className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-foreground">{category.title}</h3>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                            <Info className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <div className="space-y-2 text-xs">
                            {category.rubric.map((r) => (
                              <div key={r.score}>
                                <span className="font-semibold text-gold">{r.score}</span>
                                <span className="text-foreground"> — {r.label}:</span>
                                <span className="text-muted-foreground"> {r.description}</span>
                              </div>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex gap-2">
                      {category.rubric.map((rubricItem) => (
                        <Tooltip key={rubricItem.score}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => updateScore(category.id, rubricItem.score)}
                              className={cn(
                                "flex-1 h-14 rounded-lg border transition-all duration-300 flex flex-col items-center justify-center gap-0.5",
                                category.score === rubricItem.score
                                  ? "bg-gold border-gold text-primary-foreground shadow-lg"
                                  : "bg-secondary/50 border-border hover:border-gold/50 text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <span className="font-display text-xl">{rubricItem.score}</span>
                              <span className="text-[10px] leading-tight opacity-80">{rubricItem.label}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-[200px] text-xs">{rubricItem.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total and Submit */}
              <div className="p-6 border-t border-border shrink-0 bg-background/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-muted-foreground text-sm">Total Score</span>
                    <p className="text-xs text-muted-foreground/70">
                      {totalScore >= 10 ? "🌟 Oscar-worthy!" : totalScore >= 7 ? "📝 Needs editing" : "🎬 Reset needed"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-4xl font-display text-gold">{totalScore}</span>
                    <span className="text-muted-foreground">/ 12</span>
                  </div>
                </div>
                <Button 
                  variant="gold" 
                  className="w-full" 
                  size="lg" 
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Scorecard"
                  )}
                </Button>
              </div>
            </>
          ) : (
            /* Result */
            <div className="p-8 text-center space-y-6">
              <div
                className={cn(
                  "w-24 h-24 rounded-full mx-auto flex items-center justify-center",
                  result.color === "gold" && "bg-gold/20 gold-glow",
                  result.color === "amber" && "bg-amber-soft/20",
                  result.color === "red" && "bg-cinematic-red/20"
                )}
              >
                {result.icon}
              </div>
              <div>
                <h3 className="text-3xl font-display mb-2">{result.title}</h3>
                <p className="text-muted-foreground">{result.message}</p>
              </div>
              {creditsEarned > 0 && (
                <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-gold/20 border border-gold/30">
                  <Coins className="w-5 h-5 text-gold" />
                  <span className="font-display text-gold">+{creditsEarned} Credits Earned!</span>
                </div>
              )}
              
              {/* Category Breakdown */}
              <div className="grid grid-cols-2 gap-3 text-left">
                {categories.map((cat) => {
                  const rubricLabel = cat.rubric.find(r => r.score === cat.score)?.label || "";
                  return (
                    <div key={cat.id} className="p-3 rounded-lg bg-secondary/30 border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{cat.title}</span>
                        <span className="font-display text-gold">{cat.score}/3</span>
                      </div>
                      <span className="text-sm font-medium">{rubricLabel}</span>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex items-center justify-center gap-1">
                {[...Array(4)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-8 h-8",
                      i < Math.ceil(totalScore / 3)
                        ? "text-gold fill-gold"
                        : "text-muted"
                    )}
                  />
                ))}
              </div>
              <Button variant="cinematic" className="w-full" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
