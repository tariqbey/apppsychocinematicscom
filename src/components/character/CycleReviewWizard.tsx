import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, ArrowRight, Trophy, Target, Sparkles, BarChart3, Brain, X, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCycleTracking } from "@/hooks/useCycleTracking";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subDays } from "date-fns";

interface CycleReviewWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type ReviewStep = "intro" | "scorecard-review" | "character-check" | "ai-analysis" | "reflection" | "complete";

export function CycleReviewWizard({ isOpen, onClose, onComplete }: CycleReviewWizardProps) {
  const { user } = useAuth();
  const { cycleInfo, completeCycleReview, getActName, getCycleName } = useCycleTracking();
  const [currentStep, setCurrentStep] = useState<ReviewStep>("intro");
  const [loading, setLoading] = useState(false);
  
  // Scorecard data
  const [scorecardAverages, setScorecardAverages] = useState<{
    identity_alignment: number;
    behavior_execution: number;
    emotional_regulation: number;
    forward_progress: number;
    total: number;
    daysLogged: number;
  } | null>(null);
  
  // Character data
  const [characterData, setCharacterData] = useState<{
    startArchetype: string;
    currentArchetype: string;
    traitAverages: Record<string, number>;
    shifted: boolean;
  } | null>(null);
  
  // AI Analysis
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [generatingAi, setGeneratingAi] = useState(false);
  
  // User reflections
  const [biggestWin, setBiggestWin] = useState("");
  const [biggestChallenge, setBiggestChallenge] = useState("");
  const [commitment, setCommitment] = useState("");
  
  // Current streak
  const [streakDuringCycle, setStreakDuringCycle] = useState(0);

  // Fetch scorecard data for the cycle
  useEffect(() => {
    const fetchScorecardData = async () => {
      if (!user || !cycleInfo) return;
      
      const cycleStartDate = format(subDays(new Date(), cycleInfo.currentCycleDay - 1), "yyyy-MM-dd");
      
      const { data: scorecards } = await supabase
        .from("daily_scorecards")
        .select("*")
        .eq("user_id", user.id)
        .gte("scorecard_date", cycleStartDate)
        .order("scorecard_date", { ascending: true });
        
      if (scorecards && scorecards.length > 0) {
        const avg = {
          identity_alignment: scorecards.reduce((a, s) => a + s.identity_alignment, 0) / scorecards.length,
          behavior_execution: scorecards.reduce((a, s) => a + s.behavior_execution, 0) / scorecards.length,
          emotional_regulation: scorecards.reduce((a, s) => a + s.emotional_regulation, 0) / scorecards.length,
          forward_progress: scorecards.reduce((a, s) => a + s.forward_progress, 0) / scorecards.length,
          total: scorecards.reduce((a, s) => a + (s.total_score || 0), 0) / scorecards.length,
          daysLogged: scorecards.length,
        };
        setScorecardAverages(avg);
      }
      
      // Fetch character data
      const { data: profiles } = await supabase
        .from("character_profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
        
      if (profiles && profiles.length > 0) {
        const oldest = profiles[0];
        const newest = profiles[profiles.length - 1];
        
        setCharacterData({
          startArchetype: oldest.archetype,
          currentArchetype: newest.archetype,
          traitAverages: {},
          shifted: oldest.archetype !== newest.archetype,
        });
      }
      
      // Fetch character scorecard averages
      const { data: charScorecards } = await supabase
        .from("character_scorecards")
        .select("trait_scores")
        .eq("user_id", user.id)
        .gte("scorecard_date", cycleStartDate);
        
      if (charScorecards && charScorecards.length > 0) {
        const traitTotals: Record<string, { sum: number; count: number }> = {};
        
        charScorecards.forEach(sc => {
          const scores = sc.trait_scores as Record<string, number> | null;
          if (scores) {
            Object.entries(scores).forEach(([trait, score]) => {
              if (!traitTotals[trait]) traitTotals[trait] = { sum: 0, count: 0 };
              traitTotals[trait].sum += score;
              traitTotals[trait].count += 1;
            });
          }
        });
        
        const averages: Record<string, number> = {};
        Object.entries(traitTotals).forEach(([trait, data]) => {
          averages[trait] = data.sum / data.count;
        });
        
        if (characterData) {
          setCharacterData(prev => prev ? { ...prev, traitAverages: averages } : null);
        }
      }
      
      // Fetch user streak
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("current_streak")
        .eq("user_id", user.id)
        .single();
        
      if (profile) {
        setStreakDuringCycle(profile.current_streak || 0);
      }
    };
    
    if (isOpen) {
      fetchScorecardData();
    }
  }, [isOpen, user, cycleInfo]);

  const generateAIAnalysis = async () => {
    if (!user || !cycleInfo) return;
    
    setGeneratingAi(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("director-ai", {
        body: {
          messages: [{
            role: "user",
            content: `Generate a 21-day cycle progress report for me. Here's my data:
            
Cycle: ${cycleInfo.currentCycle} (${getCycleName(cycleInfo.currentCycle, cycleInfo.currentAct)})
Act: ${getActName(cycleInfo.currentAct)}
Days Completed: ${cycleInfo.currentCycleDay}

Scorecard Averages (0-3 scale):
- Identity Alignment: ${scorecardAverages?.identity_alignment.toFixed(2) || "N/A"}
- Behavior Execution: ${scorecardAverages?.behavior_execution.toFixed(2) || "N/A"}
- Emotional Regulation: ${scorecardAverages?.emotional_regulation.toFixed(2) || "N/A"}
- Forward Progress: ${scorecardAverages?.forward_progress.toFixed(2) || "N/A"}
- Average Total: ${scorecardAverages?.total.toFixed(2) || "N/A"}/12
- Days Logged: ${scorecardAverages?.daysLogged || 0}/21

Current Archetype: ${characterData?.currentArchetype || "Unknown"}
Started As: ${characterData?.startArchetype || "Unknown"}
Archetype Shifted: ${characterData?.shifted ? "Yes" : "No"}

Character Trait Alignment: ${JSON.stringify(characterData?.traitAverages || {})}

Give me a direct, honest assessment of my transformation progress. What patterns do you see? What's working? What needs to change for the next cycle? Be specific and actionable. Write like a coach who genuinely cares but won't sugarcoat the truth. Keep it under 300 words.`
          }],
          personalityStyle: "swag_coach"
        }
      });
      
      if (error) throw error;
      setAiAnalysis(data.response);
    } catch (error) {
      console.error("Error generating AI analysis:", error);
      toast.error("Failed to generate AI analysis");
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleComplete = async () => {
    if (!scorecardAverages || !characterData) {
      toast.error("Missing required data");
      return;
    }
    
    setLoading(true);
    
    const error = await completeCycleReview({
      avgScores: scorecardAverages,
      characterTraitAverages: characterData.traitAverages,
      archetypeAtStart: characterData.startArchetype,
      archetypeAtEnd: characterData.currentArchetype,
      aiProgressReport: aiAnalysis || "",
      biggestWin,
      biggestChallenge,
      commitmentForNextCycle: commitment,
      streakDuringCycle,
    });
    
    setLoading(false);
    
    if (error) {
      toast.error("Failed to save cycle review");
    } else {
      toast.success(`Cycle ${cycleInfo?.currentCycle} complete! 🎬`);
      setCurrentStep("complete");
    }
  };

  if (!isOpen || !cycleInfo) return null;

  const renderStep = () => {
    switch (currentStep) {
      case "intro":
        return (
          <div className="text-center space-y-6 py-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold/30 to-amber-500/30 flex items-center justify-center mx-auto">
              <Trophy className="w-12 h-12 text-gold" />
            </div>
            <div>
              <h2 className="text-3xl font-display tracking-wide text-gold-gradient mb-2">
                Cycle {cycleInfo.currentCycle} Complete!
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                You've completed 21 days of intentional transformation. 
                Let's review your progress and set the stage for your next cycle.
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <Badge variant="outline" className="border-gold/50">
                {getCycleName(cycleInfo.currentCycle, cycleInfo.currentAct)}
              </Badge>
              <span>•</span>
              <Badge variant="outline">
                {getActName(cycleInfo.currentAct)}
              </Badge>
            </div>
            <Button 
              variant="gold" 
              size="lg" 
              onClick={() => setCurrentStep("scorecard-review")}
              className="gap-2"
            >
              Begin Review <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        );
        
      case "scorecard-review":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <BarChart3 className="h-10 w-10 text-primary mx-auto mb-2" />
              <h3 className="text-xl font-display">Daily Scorecard Summary</h3>
              <p className="text-sm text-muted-foreground">Your performance averages over 21 days</p>
            </div>
            
            {scorecardAverages ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Identity Alignment", value: scorecardAverages.identity_alignment, color: "from-blue-500 to-cyan-500" },
                    { label: "Behavior Execution", value: scorecardAverages.behavior_execution, color: "from-green-500 to-emerald-500" },
                    { label: "Emotional Regulation", value: scorecardAverages.emotional_regulation, color: "from-purple-500 to-pink-500" },
                    { label: "Forward Progress", value: scorecardAverages.forward_progress, color: "from-orange-500 to-amber-500" },
                  ].map((item) => (
                    <div key={item.label} className="p-4 rounded-lg bg-muted/30 border border-border">
                      <p className="text-xs text-muted-foreground mb-2">{item.label}</p>
                      <div className="flex items-center gap-2">
                        <Progress value={(item.value / 3) * 100} className="flex-1 h-2" />
                        <span className="text-lg font-bold">{item.value.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 rounded-lg bg-gold/10 border border-gold/30 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Average Daily Score</p>
                  <p className="text-4xl font-bold text-gold">{scorecardAverages.total.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">out of 12</p>
                  <p className="text-sm mt-2">
                    {scorecardAverages.daysLogged} of 21 days logged ({Math.round((scorecardAverages.daysLogged / 21) * 100)}% consistency)
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No scorecard data found for this cycle.</p>
                <p className="text-sm">Complete daily scorecards to track your progress!</p>
              </div>
            )}
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep("intro")}>Back</Button>
              <Button variant="gold" onClick={() => setCurrentStep("character-check")} className="gap-2">
                Next: Character Check <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
        
      case "character-check":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Target className="h-10 w-10 text-cyan-400 mx-auto mb-2" />
              <h3 className="text-xl font-display">Character Evolution</h3>
              <p className="text-sm text-muted-foreground">Has your archetype or trait alignment shifted?</p>
            </div>
            
            {characterData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border text-center">
                    <p className="text-xs text-muted-foreground mb-1">Started As</p>
                    <p className="font-medium">{characterData.startArchetype}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border text-center">
                    <p className="text-xs text-muted-foreground mb-1">Current Archetype</p>
                    <p className="font-medium">{characterData.currentArchetype}</p>
                  </div>
                </div>
                
                {characterData.shifted && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                    <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                    <p className="font-medium text-green-400">Archetype Shift Detected!</p>
                    <p className="text-sm text-muted-foreground">Your character is evolving</p>
                  </div>
                )}
                
                {Object.keys(characterData.traitAverages).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Character Trait Alignment (avg)</p>
                    {Object.entries(characterData.traitAverages).slice(0, 5).map(([trait, score]) => (
                      <div key={trait} className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground flex-1 truncate">{trait}</span>
                        <Progress value={(score / 3) * 100} className="w-24 h-2" />
                        <span className="text-sm font-medium w-8">{score.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="p-4 rounded-lg bg-muted/20 border border-border">
                  <p className="text-sm text-center text-muted-foreground">
                    Want to re-take the full Character Survey to see if your archetype has truly shifted?
                  </p>
                  <p className="text-xs text-center text-muted-foreground mt-1">
                    (You can do this from the Archetype tab after completing this review)
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No character profile found.</p>
                <p className="text-sm">Complete the Character Survey to start tracking!</p>
              </div>
            )}
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep("scorecard-review")}>Back</Button>
              <Button variant="gold" onClick={() => setCurrentStep("ai-analysis")} className="gap-2">
                Next: AI Analysis <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
        
      case "ai-analysis":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Brain className="h-10 w-10 text-purple-400 mx-auto mb-2" />
              <h3 className="text-xl font-display">AI Transformation Review</h3>
              <p className="text-sm text-muted-foreground">Get personalized insights on your 21-day progress</p>
            </div>
            
            {aiAnalysis ? (
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <p className="whitespace-pre-wrap text-sm">{aiAnalysis}</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Button 
                  variant="gold" 
                  onClick={generateAIAnalysis}
                  disabled={generatingAi}
                  className="gap-2"
                >
                  {generatingAi ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing your progress...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate AI Progress Report
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {aiAnalysis && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generateAIAnalysis}
                disabled={generatingAi}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${generatingAi ? "animate-spin" : ""}`} />
                Regenerate
              </Button>
            )}
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep("character-check")}>Back</Button>
              <Button variant="gold" onClick={() => setCurrentStep("reflection")} className="gap-2">
                Next: Reflection <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
        
      case "reflection":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Sparkles className="h-10 w-10 text-gold mx-auto mb-2" />
              <h3 className="text-xl font-display">Your Reflection</h3>
              <p className="text-sm text-muted-foreground">Capture your insights and set intentions</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  🏆 Biggest Win This Cycle
                </label>
                <Textarea
                  placeholder="What was your greatest achievement or breakthrough?"
                  value={biggestWin}
                  onChange={(e) => setBiggestWin(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  💪 Biggest Challenge
                </label>
                <Textarea
                  placeholder="What was the hardest part? What almost derailed you?"
                  value={biggestChallenge}
                  onChange={(e) => setBiggestChallenge(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  🎯 Commitment for Next Cycle
                </label>
                <Textarea
                  placeholder="What will you do differently? What's your focus?"
                  value={commitment}
                  onChange={(e) => setCommitment(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep("ai-analysis")}>Back</Button>
              <Button 
                variant="gold" 
                onClick={handleComplete}
                disabled={loading || !biggestWin || !commitment}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Complete Cycle <CheckCircle className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );
        
      case "complete":
        return (
          <div className="text-center space-y-6 py-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center mx-auto animate-pulse">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <div>
              <h2 className="text-3xl font-display tracking-wide text-green-400 mb-2">
                Cycle Complete! 🎬
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                You've finished Cycle {cycleInfo.currentCycle}. Your next 21-day transformation begins now.
              </p>
            </div>
            <Button 
              variant="gold" 
              size="lg" 
              onClick={() => {
                onComplete();
                onClose();
              }}
            >
              Continue to Next Cycle
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="min-h-screen py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-end mb-4">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Progress Steps */}
            {currentStep !== "intro" && currentStep !== "complete" && (
              <div className="flex justify-center gap-2 mb-8">
                {["scorecard-review", "character-check", "ai-analysis", "reflection"].map((step, i) => (
                  <div 
                    key={step}
                    className={`w-3 h-3 rounded-full ${
                      currentStep === step 
                        ? "bg-gold" 
                        : ["scorecard-review", "character-check", "ai-analysis", "reflection"].indexOf(currentStep) > i
                          ? "bg-gold/50"
                          : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            )}
            
            <Card className="glass-card">
              <CardContent className="py-6">
                {renderStep()}
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
