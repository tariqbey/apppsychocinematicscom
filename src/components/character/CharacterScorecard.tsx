import { useState, useEffect } from "react";
import { Star, Crown, X, Sparkles, Loader2, Info, Check, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

interface TransformationAnalysis {
  currentSelf: {
    archetype: string;
    strengths: string[];
    liabilities: string[];
    blindSpots: string[];
  };
  requiredCharacter: {
    name: string;
    traits: string[];
    behaviors: string[];
    mindset: string;
  };
  gap: {
    whatMustDie: string[];
    whatMustEmerge: string[];
    dailyPractices: string[];
  };
  script: {
    role: string;
    motivation: string;
    arc: string;
  };
}

interface CharacterScorecardProps {
  onClose: () => void;
  onSubmitSuccess?: () => void;
}

const SCORE_RUBRIC = [
  { score: 0, label: "Off-Script", description: "Did not embody this trait today" },
  { score: 1, label: "Rehearsing", description: "Attempted but struggled to maintain" },
  { score: 2, label: "In Character", description: "Mostly embodied this trait" },
  { score: 3, label: "Oscar-Worthy", description: "Fully lived this trait - performance was on point" },
];

export function CharacterScorecard({ onClose, onSubmitSuccess }: CharacterScorecardProps) {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [analysis, setAnalysis] = useState<TransformationAnalysis | null>(null);
  const [traitScores, setTraitScores] = useState<Record<string, number>>({});
  const [reflection, setReflection] = useState("");
  const [existingEntry, setExistingEntry] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch transformation analysis from character_profiles
        const { data: profileData } = await supabase
          .from("character_profiles")
          .select("transformation_analysis")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (profileData?.transformation_analysis) {
          const transformationAnalysis = profileData.transformation_analysis as unknown as TransformationAnalysis;
          setAnalysis(transformationAnalysis);
          
          // Initialize scores for each trait
          const initialScores: Record<string, number> = {};
          transformationAnalysis.requiredCharacter.traits.forEach((trait) => {
            initialScores[trait] = 0;
          });
          setTraitScores(initialScores);
        }

        // Check if already submitted today
        const today = new Date().toISOString().split('T')[0];
        const { data: existingData } = await supabase
          .from("character_scorecards")
          .select("id")
          .eq("user_id", user.id)
          .eq("scorecard_date", today)
          .maybeSingle();

        if (existingData) {
          setExistingEntry(true);
        }
      } catch (error) {
        console.error("Error fetching transformation analysis:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const updateTraitScore = (trait: string, score: number) => {
    setTraitScores(prev => ({ ...prev, [trait]: score }));
  };

  const totalScore = Object.values(traitScores).reduce((sum, score) => sum + score, 0);
  const maxScore = Object.keys(traitScores).length * 3;
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const getResult = () => {
    if (percentage >= 80) {
      return {
        title: "Character Alignment: Strong",
        message: "You're becoming the character your Final Scene demands. Keep this up!",
        color: "gold",
      };
    } else if (percentage >= 50) {
      return {
        title: "Character Alignment: Developing",
        message: "Progress is happening. Focus on the traits you scored lowest on tomorrow.",
        color: "amber",
      };
    } else {
      return {
        title: "Character Alignment: Needs Work",
        message: "The old character is still running the show. Review your transformation analysis.",
        color: "red",
      };
    }
  };

  const handleSubmit = async () => {
    if (!user || !session || !analysis) return;
    
    setSubmitting(true);

    try {
      const { error } = await supabase.from("character_scorecards").insert({
        user_id: user.id,
        required_character_name: analysis.requiredCharacter.name,
        traits: analysis.requiredCharacter.traits,
        trait_scores: traitScores,
        total_score: totalScore,
        max_possible_score: maxScore,
        reflection: reflection.trim() || null,
      });

      if (error) {
        if (error.message.includes("duplicate") || error.code === "23505") {
          toast.error("You've already submitted a character scorecard today!");
        } else {
          toast.error(`Failed to submit: ${error.message}`);
        }
        return;
      }

      setSubmitted(true);
      toast.success("Character scorecard submitted!");
      onSubmitSuccess?.();
    } catch (err) {
      console.error("Error submitting character scorecard:", err);
      toast.error("Failed to submit character scorecard");
    } finally {
      setSubmitting(false);
    }
  };

  const result = getResult();

  if (loading) {
    return (
      <TooltipProvider>
        <div className="fixed inset-0 z-50 bg-cinematic-midnight/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <p className="text-muted-foreground">Loading your character profile...</p>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  if (!analysis) {
    return (
      <TooltipProvider>
        <div className="fixed inset-0 z-50 bg-cinematic-midnight/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg glass-card cinematic-border p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
              <Target className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-xl font-display">No Character Analysis Found</h2>
            <p className="text-muted-foreground text-sm">
              You need to complete a Character Transformation Analysis first. 
              Go to Character Central, take the archetype survey, and click "Reveal My Required Character" to get your personalized traits to track.
            </p>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  if (existingEntry && !submitted) {
    return (
      <TooltipProvider>
        <div className="fixed inset-0 z-50 bg-cinematic-midnight/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg glass-card cinematic-border p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-display">Already Submitted Today</h2>
            <p className="text-muted-foreground text-sm">
              You've already tracked your character alignment for today. 
              Come back tomorrow to continue your transformation journey.
            </p>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="fixed inset-0 z-50 bg-cinematic-midnight/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div className="w-full max-w-lg glass-card cinematic-border overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-gold/10 to-transparent shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
              <div>
                <h2 className="text-lg sm:text-xl font-display tracking-wide">Character Scorecard</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Track alignment with: {analysis.requiredCharacter.name}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 sm:h-10 sm:w-10">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>

          {!submitted ? (
            <>
              {/* Traits */}
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
                <p className="text-sm text-muted-foreground">
                  Rate how well you embodied each required character trait today.
                </p>
                
                {analysis.requiredCharacter.traits.map((trait, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-sm sm:text-base text-foreground">{trait}</h3>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6 shrink-0">
                            <Info className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <div className="space-y-2 text-xs">
                            {SCORE_RUBRIC.map((r) => (
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
                    <div className="flex gap-1.5 sm:gap-2">
                      {SCORE_RUBRIC.map((rubricItem) => (
                        <Tooltip key={rubricItem.score}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => updateTraitScore(trait, rubricItem.score)}
                              className={cn(
                                "flex-1 h-10 sm:h-12 rounded-lg border transition-all duration-300 flex flex-col items-center justify-center",
                                traitScores[trait] === rubricItem.score
                                  ? "bg-gold border-gold text-primary-foreground shadow-lg"
                                  : "bg-secondary/50 border-border hover:border-gold/50 text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <span className="font-display text-base sm:text-lg">{rubricItem.score}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-[200px] text-xs">{rubricItem.label}: {rubricItem.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Reflection */}
                <div className="pt-2">
                  <label className="text-sm font-medium mb-2 block">Daily Reflection (optional)</label>
                  <Textarea
                    placeholder="How did it feel to embody your required character today? What worked? What needs adjustment?"
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                </div>
              </div>

              {/* Total and Submit */}
              <div className="p-4 sm:p-6 border-t border-border shrink-0 bg-background/50">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div>
                    <span className="text-muted-foreground text-xs sm:text-sm">Character Alignment</span>
                    <p className="text-[10px] sm:text-xs text-muted-foreground/70">
                      {percentage >= 80 ? "🎭 In character!" : percentage >= 50 ? "📝 Developing" : "🎬 More rehearsal needed"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-3xl sm:text-4xl font-display text-gold">{percentage}%</span>
                  </div>
                </div>
                <Button 
                  variant="gold" 
                  className="w-full" 
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Character Scorecard"
                  )}
                </Button>
              </div>
            </>
          ) : (
            /* Result */
            <div className="p-6 sm:p-8 text-center space-y-4 sm:space-y-6 overflow-y-auto flex-1">
              <div
                className={cn(
                  "w-16 h-16 sm:w-24 sm:h-24 rounded-full mx-auto flex items-center justify-center shrink-0",
                  result.color === "gold" && "bg-gold/20 gold-glow",
                  result.color === "amber" && "bg-amber-500/20",
                  result.color === "red" && "bg-red-500/20"
                )}
              >
                <Crown className={cn(
                  "w-8 h-8 sm:w-12 sm:h-12",
                  result.color === "gold" && "text-gold",
                  result.color === "amber" && "text-amber-400",
                  result.color === "red" && "text-red-400"
                )} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-display mb-1 sm:mb-2">{result.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">{result.message}</p>
              </div>
              
              <div className="p-4 rounded-lg bg-gold/10 border border-gold/30">
                <p className="text-sm text-gold font-display">The Role: {analysis.requiredCharacter.name}</p>
                <p className="text-2xl font-display text-gold mt-1">{percentage}% Alignment</p>
              </div>

              {/* Trait Breakdown */}
              <div className="space-y-2 text-left">
                {analysis.requiredCharacter.traits.map((trait, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded bg-secondary/30">
                    <span className="text-sm">{trait}</span>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((score) => (
                        <Star
                          key={score}
                          className={cn(
                            "w-4 h-4",
                            score < traitScores[trait]
                              ? "text-gold fill-gold"
                              : "text-muted"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <Button variant="cinematic" className="w-full shrink-0" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}