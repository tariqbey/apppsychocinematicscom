import { useState, useEffect } from "react";
import { Star, Crown, X, Sparkles, Loader2, Info, Check, Target, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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

// Score illustrations
import score0Image from "@/assets/icons/score-0-off-script.png";
import score1Image from "@/assets/icons/score-1-rehearsing.png";
import score2Image from "@/assets/icons/score-2-in-character.png";
import score3Image from "@/assets/icons/score-3-oscar-worthy.png";

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
  onClose?: () => void;
  onSubmitSuccess?: () => void;
  inline?: boolean;
}

const SCORE_RUBRIC = [
  { 
    score: 0, 
    label: "Off-Script", 
    description: "Did not embody this trait today",
    explanation: "You completely forgot your role. The old character took over and ran the show.",
    image: score0Image,
    color: "red"
  },
  { 
    score: 1, 
    label: "Rehearsing", 
    description: "Attempted but struggled to maintain",
    explanation: "You tried to stay in character but kept breaking. Still practicing the lines.",
    image: score1Image,
    color: "amber"
  },
  { 
    score: 2, 
    label: "In Character", 
    description: "Mostly embodied this trait",
    explanation: "You stayed in role most of the day. A few slips, but the performance was solid.",
    image: score2Image,
    color: "cyan"
  },
  { 
    score: 3, 
    label: "Oscar-Worthy", 
    description: "Fully lived this trait - performance was on point",
    explanation: "Standing ovation! You fully became the character your Chief Aim demands.",
    image: score3Image,
    color: "gold"
  },
];

export function CharacterScorecard({ onClose, onSubmitSuccess, inline = false }: CharacterScorecardProps) {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [analysis, setAnalysis] = useState<TransformationAnalysis | null>(null);
  const [allTraits, setAllTraits] = useState<string[]>([]);
  const [customTraits, setCustomTraits] = useState<string[]>([]);
  const [newCustomTrait, setNewCustomTrait] = useState("");
  const [traitScores, setTraitScores] = useState<Record<string, number>>({});
  const [reflection, setReflection] = useState("");
  const [existingEntry, setExistingEntry] = useState(false);
  const [showAddTrait, setShowAddTrait] = useState(false);

  // Load saved custom traits from localStorage
  useEffect(() => {
    const savedCustomTraits = localStorage.getItem("character_custom_traits");
    if (savedCustomTraits) {
      try {
        setCustomTraits(JSON.parse(savedCustomTraits));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

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
          
          // Combine AI traits with custom traits
          const aiTraits = transformationAnalysis.requiredCharacter.traits || [];
          const savedCustomTraits = localStorage.getItem("character_custom_traits");
          const parsedCustomTraits = savedCustomTraits ? JSON.parse(savedCustomTraits) : [];
          
          const combinedTraits = [...aiTraits, ...parsedCustomTraits];
          setAllTraits(combinedTraits);
          
          // Initialize scores for each trait
          const initialScores: Record<string, number> = {};
          combinedTraits.forEach((trait) => {
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

  const addCustomTrait = () => {
    const trimmedTrait = newCustomTrait.trim();
    if (!trimmedTrait) return;
    if (allTraits.includes(trimmedTrait)) {
      toast.error("This trait already exists");
      return;
    }

    const updatedCustomTraits = [...customTraits, trimmedTrait];
    setCustomTraits(updatedCustomTraits);
    localStorage.setItem("character_custom_traits", JSON.stringify(updatedCustomTraits));

    setAllTraits(prev => [...prev, trimmedTrait]);
    setTraitScores(prev => ({ ...prev, [trimmedTrait]: 0 }));
    setNewCustomTrait("");
    setShowAddTrait(false);
    toast.success("Custom trait added!");
  };

  const removeCustomTrait = (trait: string) => {
    const updatedCustomTraits = customTraits.filter(t => t !== trait);
    setCustomTraits(updatedCustomTraits);
    localStorage.setItem("character_custom_traits", JSON.stringify(updatedCustomTraits));

    setAllTraits(prev => prev.filter(t => t !== trait));
    setTraitScores(prev => {
      const updated = { ...prev };
      delete updated[trait];
      return updated;
    });
    toast.success("Custom trait removed");
  };

  const isCustomTrait = (trait: string) => customTraits.includes(trait);

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
        traits: allTraits,
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

  const wrapperClass = inline 
    ? "w-full" 
    : "fixed inset-0 z-50 bg-cinematic-midnight/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in";
  
  const cardWrapperClass = inline 
    ? "" 
    : "flex items-center justify-center";

  if (loading) {
    return (
      <TooltipProvider>
        <div className={wrapperClass}>
          <div className={cn(cardWrapperClass, "flex flex-col items-center gap-4 py-16")}>
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
        <div className={wrapperClass}>
          <div className={cn(cardWrapperClass, "w-full")}>
            <div className="w-full max-w-lg mx-auto glass-card cinematic-border p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
                <Target className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-xl font-display">No Character Analysis Found</h2>
              <p className="text-muted-foreground text-sm">
                You need to complete a Character Transformation Analysis first. 
                Go to the Transform tab, and click "Reveal My Required Character" to get your personalized traits to track.
              </p>
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  if (existingEntry && !submitted) {
    return (
      <TooltipProvider>
        <div className={wrapperClass}>
          <div className={cn(cardWrapperClass, "w-full")}>
            <div className="w-full max-w-lg mx-auto glass-card cinematic-border p-6 text-center space-y-4 relative">
              {/* Close Button */}
              {!inline && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose} 
                  className="absolute top-3 right-3 h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-display">Already Submitted Today</h2>
              <p className="text-muted-foreground text-sm">
                You've already tracked your character alignment for today. 
                Come back tomorrow to continue your transformation journey.
              </p>
              {!inline && (
                <Button variant="cinematic" onClick={onClose} className="mt-4">
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className={wrapperClass}>
        <div className={cn(cardWrapperClass, "w-full")}>
          <div className={cn(
            "w-full max-w-lg mx-auto glass-card cinematic-border overflow-hidden flex flex-col",
            inline ? "" : "max-h-[90vh]"
          )}>
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
              {!inline && onClose && (
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 sm:h-10 sm:w-10">
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              )}
            </div>

          {!submitted ? (
            <>
              {/* Traits */}
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Rate how well you embodied each required character trait today.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddTrait(!showAddTrait)}
                    className="text-gold hover:text-gold h-7 px-2"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Trait
                  </Button>
                </div>

                {/* Add Custom Trait Form */}
                {showAddTrait && (
                  <div className="flex gap-2 p-3 rounded-lg bg-gold/10 border border-gold/30">
                    <Input
                      placeholder="Enter custom trait to track..."
                      value={newCustomTrait}
                      onChange={(e) => setNewCustomTrait(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCustomTrait()}
                      className="flex-1 h-9"
                    />
                    <Button size="sm" onClick={addCustomTrait} className="h-9">
                      Add
                    </Button>
                  </div>
                )}
                
                {allTraits.map((trait, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm sm:text-base text-foreground">{trait}</h3>
                        {isCustomTrait(trait) && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/20 text-gold border border-gold/30">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {isCustomTrait(trait) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCustomTrait(trait)}
                            className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6 shrink-0">
                              <Info className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-sm p-0 overflow-hidden">
                            <div className="space-y-0">
                              {SCORE_RUBRIC.map((r) => (
                                <div key={r.score} className={cn(
                                  "flex items-center gap-3 p-3 border-b border-border last:border-0",
                                  r.color === "red" && "bg-red-500/10",
                                  r.color === "amber" && "bg-amber-500/10",
                                  r.color === "cyan" && "bg-cyan-500/10",
                                  r.color === "gold" && "bg-gold/10"
                                )}>
                                  <img src={r.image} alt={r.label} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className={cn(
                                        "font-display text-lg",
                                        r.color === "red" && "text-red-400",
                                        r.color === "amber" && "text-amber-400",
                                        r.color === "cyan" && "text-cyan-400",
                                        r.color === "gold" && "text-gold"
                                      )}>{r.score}</span>
                                      <span className="font-semibold text-foreground text-sm">{r.label}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-tight">{r.explanation}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
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
                {allTraits.map((trait, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded bg-secondary/30">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{trait}</span>
                      {isCustomTrait(trait) && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-gold/20 text-gold">Custom</span>
                      )}
                    </div>
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
              
              {!inline && onClose && (
                <Button variant="cinematic" className="w-full shrink-0" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}