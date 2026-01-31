import { useState } from "react";
import { X, Zap, Calendar, Target, CheckCircle, AlertTriangle, Loader2, Sparkles, User, Film, Lightbulb, ListChecks, Play, ChevronRight, ChevronLeft, Rocket, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEpisodes, CreateEpisodeInput } from "@/hooks/useEpisodes";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, addWeeks } from "date-fns";
import { toast } from "sonner";
import { EpisodeTransformationCard, EpisodeCharacterTransformation } from "./EpisodeTransformationCard";

interface EpisodeWizardProps {
  onClose: () => void;
  onSuccess?: (episodeId: string) => void;
  onCreateMindMovie?: (episodeId: string, episode: {
    id: string;
    title: string;
    objective: string;
    deadline: string;
    alignment_score: number | null;
  }, characterAnalysis: EpisodeCharacterTransformation) => void;
}

interface EpisodeStrategy {
  title: string;
  battlePlan: {
    overview: string;
    phases: Array<{
      name: string;
      duration: string;
      actions: string[];
      deliverable: string;
    }>;
    quickWins: string[];
    potentialBlockers: Array<{
      blocker: string;
      solution: string;
    }>;
  };
  requiredCharacter: {
    name: string;
    coreIdentity: string;
    nonNegotiables: string[];
    cutMoments: string[];
  };
  visualizationScript: {
    openingScene: string;
    actionMontage: Array<{
      scene: string;
      affirmation: string;
    }>;
    victoryScene: string;
    closingAffirmation: string;
  };
  dailyTasks: string[];
  successMetrics: string[];
}

type Step = "describe" | "planning" | "strategy" | "create";

export function EpisodeWizard({ onClose, onSuccess, onCreateMindMovie }: EpisodeWizardProps) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { validateAlignment, createEpisode, updateEpisode, validating } = useEpisodes();
  
  const [step, setStep] = useState<Step>("describe");
  const [objective, setObjective] = useState("");
  const [context, setContext] = useState("");
  const [durationType, setDurationType] = useState<"week" | "two-weeks" | "30-days" | "custom">("week");
  const [customDeadline, setCustomDeadline] = useState("");
  
  // AI Strategy state
  const [strategy, setStrategy] = useState<EpisodeStrategy | null>(null);
  const [planningAI, setPlanningAI] = useState(false);
  const [planningError, setPlanningError] = useState<string | null>(null);
  
  // Creation state
  const [creating, setCreating] = useState(false);
  const [createdEpisode, setCreatedEpisode] = useState<{
    id: string;
    title: string;
    objective: string;
    deadline: string;
  } | null>(null);
  const [characterAnalysis, setCharacterAnalysis] = useState<EpisodeCharacterTransformation | null>(null);

  const chiefAim = {
    what: profile?.chief_aim_what || "",
    byWhen: profile?.chief_aim_by_when || "",
    exchange: profile?.chief_aim_exchange || "",
    plan: profile?.chief_aim_plan || ""
  };

  const getDeadline = (): string => {
    const today = new Date();
    switch (durationType) {
      case "week":
        return format(addWeeks(today, 1), "yyyy-MM-dd");
      case "two-weeks":
        return format(addWeeks(today, 2), "yyyy-MM-dd");
      case "30-days":
        return format(addDays(today, 30), "yyyy-MM-dd");
      case "custom":
        return customDeadline;
      default:
        return format(addWeeks(today, 1), "yyyy-MM-dd");
    }
  };

  // AI Strategy Planning
  const handlePlanStrategy = async () => {
    if (!objective.trim()) return;
    
    setStep("planning");
    setPlanningAI(true);
    setPlanningError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("plan-episode-strategy", {
        body: {
          objective: objective.trim(),
          context: context.trim() || undefined,
          deadline: getDeadline(),
          chiefAim
        }
      });
      
      if (error) throw error;
      
      setStrategy(data as EpisodeStrategy);
      setStep("strategy");
    } catch (error) {
      console.error("Error planning strategy:", error);
      setPlanningError(error instanceof Error ? error.message : "Failed to plan strategy");
      toast.error("Failed to generate strategy. Please try again.");
    } finally {
      setPlanningAI(false);
    }
  };

  const analyzeEpisodeCharacter = async (episodeObjective: string): Promise<EpisodeCharacterTransformation | null> => {
    try {
      const { data: characterProfile } = await supabase
        .from("character_profiles")
        .select("archetype, transformation_analysis")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const { data, error } = await supabase.functions.invoke("analyze-episode-character", {
        body: {
          episodeObjective,
          chiefAim,
          archetype: characterProfile?.archetype || "Unknown"
        }
      });

      if (error) throw error;
      return data as EpisodeCharacterTransformation;
    } catch (error) {
      console.error("Error analyzing episode character:", error);
      // Convert strategy character to transformation format if available
      if (strategy?.requiredCharacter) {
        return {
          requiredCharacter: {
            name: strategy.requiredCharacter.name,
            traits: strategy.requiredCharacter.nonNegotiables,
            behaviors: strategy.battlePlan.quickWins,
            mindset: strategy.requiredCharacter.coreIdentity
          },
          transformationGap: {
            whatMustDie: strategy.requiredCharacter.cutMoments,
            whatMustEmerge: strategy.requiredCharacter.nonNegotiables
          },
          dailyPractice: {
            morningActivation: "Ask: Who must I become today?",
            midDayReset: "Am I acting as my required character?",
            eveningReflection: "Did I show up as the person I committed to be?",
            mantra: strategy.visualizationScript.closingAffirmation
          }
        };
      }
      return null;
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    
    const episodeTitle = strategy?.title || objective.slice(0, 50);
    
    const input: CreateEpisodeInput = {
      title: episodeTitle,
      objective: objective.trim(),
      deadline: getDeadline(),
      duration_type: durationType,
      vision_answers: strategy ? {
        battlePlan: JSON.stringify(strategy.battlePlan),
        visualizationScript: JSON.stringify(strategy.visualizationScript),
        dailyTasks: JSON.stringify(strategy.dailyTasks),
        successMetrics: JSON.stringify(strategy.successMetrics)
      } : undefined
    };

    const episode = await createEpisode(input);
    
    if (episode) {
      // Validate alignment in background
      const alignmentResult = await validateAlignment(objective, chiefAim);
      if (alignmentResult) {
        await updateEpisode(episode.id, {
          alignment_score: alignmentResult.score,
          alignment_reasoning: alignmentResult.reasoning
        });
      }
      
      setCreatedEpisode({
        id: episode.id,
        title: episode.title,
        objective: episode.objective,
        deadline: episode.deadline
      });
      
      // Analyze character
      const analysis = await analyzeEpisodeCharacter(episode.objective);
      setCharacterAnalysis(analysis);
      
      if (analysis) {
        await updateEpisode(episode.id, {
          character_transformation: JSON.parse(JSON.stringify(analysis))
        });
      }
      
      // Add daily tasks from strategy
      if (strategy?.dailyTasks && strategy.dailyTasks.length > 0) {
        const today = format(new Date(), "yyyy-MM-dd");
        for (let i = 0; i < Math.min(3, strategy.dailyTasks.length); i++) {
          await supabase.from("daily_tasks").insert({
            user_id: user?.id,
            task_text: strategy.dailyTasks[i],
            task_date: today,
            priority: i + 1
          });
        }
        toast.success("Action steps added to today's tasks!");
      }
      
      setStep("create");
    }
    
    setCreating(false);
  };

  const handleCreateMindMovie = () => {
    if (createdEpisode && characterAnalysis && onCreateMindMovie) {
      onCreateMindMovie(createdEpisode.id, {
        ...createdEpisode,
        alignment_score: null
      }, characterAnalysis);
    }
    onClose();
  };

  const handleFinish = () => {
    if (createdEpisode) {
      onSuccess?.(createdEpisode.id);
    }
    onClose();
  };

  const getStepNumber = () => {
    switch (step) {
      case "describe": return 1;
      case "planning": return 2;
      case "strategy": return 2;
      case "create": return 3;
      default: return 1;
    }
  };

  const stepLabels = {
    describe: "Tell Me What You Need",
    planning: "Planning...",
    strategy: "Your Battle Plan",
    create: "Episode Created"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-background border border-border rounded-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-amber-500/10 to-orange-600/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-display tracking-wide">New Episode</h2>
              <p className="text-xs text-muted-foreground">
                Step {getStepNumber()} of 3 • {stepLabels[step]}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="h-12 w-12 bg-gold/20 hover:bg-gold/30 border border-gold/40 rounded-full"
          >
            <X className="w-6 h-6 text-gold" />
          </Button>
        </div>
        
        {/* Floating close button for mobile */}
        <Button
          variant="default"
          size="lg"
          onClick={onClose}
          className="fixed bottom-24 right-4 z-50 h-14 w-14 rounded-full bg-gold/90 hover:bg-gold text-black shadow-lg shadow-gold/30 sm:hidden"
        >
          <X className="w-7 h-7" />
        </Button>

        {/* Progress Bar */}
        <div className="px-4 pt-3 shrink-0">
          <Progress value={(getStepNumber() / 3) * 100} className="h-1" />
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Step 1: Describe */}
            {step === "describe" && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-display mb-2">What Do You Need to Pull Off?</h3>
                  <p className="text-sm text-muted-foreground">
                    Tell me what you're trying to accomplish. Be specific - I'll help you plan it out.
                  </p>
                </div>

                {/* Objective */}
                <div className="space-y-2">
                  <Label htmlFor="objective">What's the goal?</Label>
                  <Textarea
                    id="objective"
                    placeholder="e.g., Set up a sales funnel and get my first 10 paying customers this week"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="bg-muted/50 min-h-[100px]"
                  />
                </div>

                {/* Context */}
                <div className="space-y-2">
                  <Label htmlFor="context">Any context I should know? (optional)</Label>
                  <Textarea
                    id="context"
                    placeholder="e.g., I have a coaching offer priced at $500. I already have an email list of 200 people. I've never launched a funnel before."
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    className="bg-muted/50 min-h-[80px]"
                  />
                </div>

                {/* Duration */}
                <div className="space-y-3">
                  <Label>How long do you have?</Label>
                  <RadioGroup
                    value={durationType}
                    onValueChange={(v) => setDurationType(v as typeof durationType)}
                    className="grid grid-cols-2 gap-3"
                  >
                    <Label
                      htmlFor="week"
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                        durationType === "week" ? "border-amber-500 bg-amber-500/10" : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <RadioGroupItem value="week" id="week" />
                      <div>
                        <p className="font-medium">1 Week</p>
                        <p className="text-xs text-muted-foreground">Sprint mode</p>
                      </div>
                    </Label>
                    <Label
                      htmlFor="two-weeks"
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                        durationType === "two-weeks" ? "border-amber-500 bg-amber-500/10" : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <RadioGroupItem value="two-weeks" id="two-weeks" />
                      <div>
                        <p className="font-medium">2 Weeks</p>
                        <p className="text-xs text-muted-foreground">Standard</p>
                      </div>
                    </Label>
                    <Label
                      htmlFor="30-days"
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                        durationType === "30-days" ? "border-amber-500 bg-amber-500/10" : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <RadioGroupItem value="30-days" id="30-days" />
                      <div>
                        <p className="font-medium">30 Days</p>
                        <p className="text-xs text-muted-foreground">Deep work</p>
                      </div>
                    </Label>
                    <Label
                      htmlFor="custom"
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                        durationType === "custom" ? "border-amber-500 bg-amber-500/10" : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <RadioGroupItem value="custom" id="custom" />
                      <div>
                        <p className="font-medium">Custom</p>
                        <p className="text-xs text-muted-foreground">Pick date</p>
                      </div>
                    </Label>
                  </RadioGroup>

                  {durationType === "custom" && (
                    <Input
                      type="date"
                      value={customDeadline}
                      onChange={(e) => setCustomDeadline(e.target.value)}
                      min={format(new Date(), "yyyy-MM-dd")}
                      className="bg-muted/50"
                    />
                  )}
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  onClick={handlePlanStrategy}
                  disabled={!objective.trim()}
                  size="lg"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Plan My Strategy
                </Button>
              </>
            )}

            {/* Step 2: Planning (Loading) */}
            {step === "planning" && (
              <div className="text-center py-12">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-amber-500/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
                  <Brain className="absolute inset-0 m-auto w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-display mb-2">Building Your Battle Plan...</h3>
                <p className="text-muted-foreground mb-4">
                  Breaking down your objective into actionable steps
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="animate-pulse">• Analyzing your objective...</p>
                  <p className="animate-pulse" style={{ animationDelay: "0.2s" }}>• Creating tactical phases...</p>
                  <p className="animate-pulse" style={{ animationDelay: "0.4s" }}>• Generating visualization script...</p>
                </div>
              </div>
            )}

            {/* Step 2b: Strategy Review */}
            {step === "strategy" && strategy && (
              <div className="space-y-6">
                {/* Title */}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center mx-auto mb-4">
                    <Lightbulb className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-display text-gold mb-1">{strategy.title}</h3>
                  <p className="text-sm text-muted-foreground">{strategy.battlePlan.overview}</p>
                </div>

                {/* Required Character */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-amber-500" />
                    <h4 className="font-medium">Who You Must Become</h4>
                  </div>
                  <p className="text-lg font-display text-gold mb-2">{strategy.requiredCharacter.name}</p>
                  <p className="text-sm italic text-muted-foreground mb-3">
                    "{strategy.requiredCharacter.coreIdentity}"
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {strategy.requiredCharacter.nonNegotiables.map((item, i) => (
                      <span key={i} className="px-2 py-1 text-xs rounded-full bg-amber-500/20 text-amber-300">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Battle Plan Phases */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-amber-500" />
                    The Battle Plan
                  </h4>
                  {strategy.battlePlan.phases.map((phase, index) => (
                    <div key={index} className="p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{phase.name}</span>
                        <span className="text-xs text-muted-foreground">{phase.duration}</span>
                      </div>
                      <ul className="space-y-1 mb-2">
                        {phase.actions.map((action, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            {action}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-green-400">
                        ✓ Deliverable: {phase.deliverable}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Quick Wins */}
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <h4 className="font-medium text-green-400 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Do TODAY (Quick Wins)
                  </h4>
                  <ul className="space-y-2">
                    {strategy.battlePlan.quickWins.map((win, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                        {win}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Success Metrics */}
                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-gold" />
                    You'll Know It's Done When...
                  </h4>
                  <ul className="space-y-1">
                    {strategy.successMetrics.map((metric, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        • {metric}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visualization Preview */}
                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
                  <h4 className="font-medium text-purple-400 mb-2 flex items-center gap-2">
                    <Film className="w-4 h-4" />
                    Mind Movie Script Ready
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {strategy.visualizationScript.openingScene}
                  </p>
                  <p className="text-xs text-purple-300">
                    + {strategy.visualizationScript.actionMontage.length} action scenes • Victory scene included
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep("describe");
                      setStrategy(null);
                    }}
                    className="shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                    onClick={handleCreate}
                    disabled={creating}
                    size="lg"
                  >
                    {creating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        Let's Go!
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Strategy Error */}
            {step === "planning" && planningError && (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">{planningError}</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("describe");
                    setPlanningError(null);
                  }}
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* Step 3: Created */}
            {step === "create" && createdEpisode && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-display mb-2">You're Locked In!</h3>
                  <p className="text-muted-foreground">
                    Episode created. Action steps added to today's tasks.
                  </p>
                </div>

                {/* Character Card */}
                {characterAnalysis && (
                  <EpisodeTransformationCard 
                    transformation={characterAnalysis} 
                    variant="compact" 
                  />
                )}

                {/* Next Steps */}
                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <h4 className="font-medium mb-3">What's Next?</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>✓ Your action steps have been added to today's tasks</p>
                    <p>✓ Your battle plan is saved to this episode</p>
                    {strategy?.visualizationScript && (
                      <p>✓ Mind Movie script ready - create it now or later</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                    onClick={handleCreateMindMovie}
                    size="lg"
                  >
                    <Film className="w-5 h-5 mr-2" />
                    Create Mind Movie Now
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleFinish}
                  >
                    Start Working - I'll Make the Movie Later
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
