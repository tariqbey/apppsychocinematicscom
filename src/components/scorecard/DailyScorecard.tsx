import { useState } from "react";
import { Star, Trophy, Edit3, AlertTriangle, X, Sparkles, Coins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ScorecardCategory {
  id: string;
  title: string;
  description: string;
  score: number;
}

interface DailyScorecardProps {
  onClose: () => void;
  onSubmitSuccess?: () => void;
}

export const DailyScorecard = ({ onClose, onSubmitSuccess }: DailyScorecardProps) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ScorecardCategory[]>([
    {
      id: "identity",
      title: "Identity Alignment",
      description: "Did I embody the Director Character?",
      score: 0,
    },
    {
      id: "behavior",
      title: "Behavior Execution",
      description: "Did I hit my rituals?",
      score: 0,
    },
    {
      id: "emotional",
      title: "Emotional Regulation",
      description: 'Did I use the "CUT!" technique?',
      score: 0,
    },
    {
      id: "progress",
      title: "Forward Progress",
      description: "Did I move toward the Chief Aim?",
      score: 0,
    },
  ]);

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
    <div className="fixed inset-0 z-50 bg-cinematic-midnight/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg glass-card cinematic-border overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-gold/10 to-transparent">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-gold" />
            <div>
              <h2 className="text-2xl font-display tracking-wide">Daily Scorecard</h2>
              <p className="text-sm text-muted-foreground">That's a wrap. Let's review.</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {!submitted ? (
          <>
            {/* Categories */}
            <div className="p-6 space-y-6">
              {categories.map((category) => (
                <div key={category.id} className="space-y-3">
                  <div>
                    <h3 className="font-medium text-foreground">{category.title}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3].map((score) => (
                      <button
                        key={score}
                        onClick={() => updateScore(category.id, score)}
                        className={cn(
                          "flex-1 h-12 rounded-lg border transition-all duration-300 font-display text-xl",
                          category.score === score
                            ? "bg-gold border-gold text-primary-foreground shadow-lg"
                            : "bg-secondary/50 border-border hover:border-gold/50 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Total and Submit */}
            <div className="p-6 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground">Total Score</span>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-display text-gold">{totalScore}</span>
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
  );
};
