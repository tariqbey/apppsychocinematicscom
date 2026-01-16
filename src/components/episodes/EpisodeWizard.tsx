import { useState } from "react";
import { X, Zap, Calendar, Target, CheckCircle, AlertTriangle, Loader2, Sparkles, User, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { useEpisodes, CreateEpisodeInput } from "@/hooks/useEpisodes";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, addWeeks } from "date-fns";
import { toast } from "sonner";

interface EpisodeWizardProps {
  onClose: () => void;
  onSuccess?: (episodeId: string) => void;
  onCreateMindMovie?: (episodeId: string, episode: {
    id: string;
    title: string;
    objective: string;
    deadline: string;
    alignment_score: number | null;
  }, characterAnalysis: EpisodeCharacterAnalysis) => void;
}

interface EpisodeCharacterAnalysis {
  requiredCharacter: {
    name: string;
    traits: string[];
    behaviors: string[];
    mindset: string;
  };
  gap: {
    whatMustDie: string[];
    whatMustEmerge: string[];
  };
  dailyFocus: string;
}

type Step = "define" | "validate" | "character" | "complete";

export function EpisodeWizard({ onClose, onSuccess, onCreateMindMovie }: EpisodeWizardProps) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { validateAlignment, createEpisode, updateEpisode, validating } = useEpisodes();
  
  const [step, setStep] = useState<Step>("define");
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [durationType, setDurationType] = useState<"week" | "two-weeks" | "30-days" | "custom">("week");
  const [customDeadline, setCustomDeadline] = useState("");
  const [alignmentResult, setAlignmentResult] = useState<{ score: number; reasoning: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [createdEpisode, setCreatedEpisode] = useState<{
    id: string;
    title: string;
    objective: string;
    deadline: string;
  } | null>(null);
  const [characterAnalysis, setCharacterAnalysis] = useState<EpisodeCharacterAnalysis | null>(null);
  const [analyzingCharacter, setAnalyzingCharacter] = useState(false);

  const chiefAim = {
    what: profile?.chief_aim_what || "",
    byWhen: profile?.chief_aim_by_when || "",
    exchange: profile?.chief_aim_exchange || "",
    plan: profile?.chief_aim_plan || ""
  };

  const hasChiefAim = Boolean(chiefAim.what);

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

  const handleValidate = async () => {
    if (!objective.trim()) return;
    
    setStep("validate");
    const result = await validateAlignment(objective, chiefAim);
    if (result) {
      setAlignmentResult(result);
    }
  };

  const analyzeEpisodeCharacter = async (episodeObjective: string): Promise<EpisodeCharacterAnalysis | null> => {
    try {
      // Fetch user's archetype for context
      const { data: characterProfile } = await supabase
        .from("character_profiles")
        .select("archetype, transformation_analysis")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || ""}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a character transformation coach for the Psycho-Cinematics™ methodology. For this SPECIFIC EPISODE/SPRINT, determine what character the user must embody to succeed. Be specific and action-oriented.`
            },
            {
              role: "user",
              content: `EPISODE OBJECTIVE: ${episodeObjective}

CHIEF AIM: ${chiefAim.what}
CURRENT ARCHETYPE: ${characterProfile?.archetype || "Not determined"}

For THIS SPECIFIC EPISODE, determine:
1. What character must they become to achieve this episode objective?
2. What specific traits and behaviors must they exhibit?
3. What must they let go of to succeed in this sprint?

Return JSON:
{
  "requiredCharacter": {
    "name": "A specific character name for this episode (e.g., 'The Focused Executor', 'The Bold Networker')",
    "traits": ["3-4 specific traits needed for THIS episode"],
    "behaviors": ["3-4 specific daily behaviors for THIS episode"],
    "mindset": "One sentence on how they must think during this sprint"
  },
  "gap": {
    "whatMustDie": ["2-3 behaviors/patterns to eliminate for this sprint"],
    "whatMustEmerge": ["2-3 new patterns to adopt for this sprint"]
  },
  "dailyFocus": "One sentence daily mantra for this episode"
}`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7
        })
      });

      if (!response.ok) {
        // Fall back to edge function
        const { data, error } = await supabase.functions.invoke("analyze-character-transformation", {
          body: {
            archetype: { name: characterProfile?.archetype || "Unknown" },
            chiefAim,
            episodeObjective
          }
        });
        if (error) throw error;
        return data?.analysis as EpisodeCharacterAnalysis;
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error("Error analyzing episode character:", error);
      // Return a default analysis if AI fails
      return {
        requiredCharacter: {
          name: "The Focused Executor",
          traits: ["Disciplined", "Action-oriented", "Resilient", "Focused"],
          behaviors: ["Start each day with the #1 priority", "Block distractions ruthlessly", "Review progress nightly"],
          mindset: "I am the person who gets this done, no matter what."
        },
        gap: {
          whatMustDie: ["Procrastination", "Overthinking", "Distraction"],
          whatMustEmerge: ["Immediate action", "Single-task focus", "Daily accountability"]
        },
        dailyFocus: "Execute today. Tomorrow doesn't exist."
      };
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    
    const input: CreateEpisodeInput = {
      title: title.trim() || objective.slice(0, 50),
      objective: objective.trim(),
      deadline: getDeadline(),
      duration_type: durationType
    };

    const episode = await createEpisode(input);
    
    if (episode && alignmentResult) {
      // Update with alignment data
      await updateEpisode(episode.id, {
        alignment_score: alignmentResult.score,
        alignment_reasoning: alignmentResult.reasoning
      });
    }

    setCreating(false);
    
    if (episode) {
      setCreatedEpisode({
        id: episode.id,
        title: episode.title,
        objective: episode.objective,
        deadline: episode.deadline
      });
      
      // Move to character analysis step
      setStep("character");
      setAnalyzingCharacter(true);
      
      const analysis = await analyzeEpisodeCharacter(episode.objective);
      setCharacterAnalysis(analysis);
      setAnalyzingCharacter(false);
    }
  };

  const handleCreateMindMovie = () => {
    if (createdEpisode && characterAnalysis && onCreateMindMovie) {
      onCreateMindMovie(createdEpisode.id, {
        ...createdEpisode,
        alignment_score: alignmentResult?.score || null
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

  const getScoreColor = (score: number): string => {
    if (score >= 70) return "text-green-400";
    if (score >= 50) return "text-gold";
    if (score >= 30) return "text-amber-500";
    return "text-red-400";
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return "Critical Path";
    if (score >= 70) return "Strategic Value";
    if (score >= 50) return "Supporting Role";
    if (score >= 30) return "Loosely Connected";
    return "Potential Distraction";
  };

  const getStepNumber = () => {
    switch (step) {
      case "define": return 1;
      case "validate": return 2;
      case "character": return 3;
      case "complete": return 4;
      default: return 1;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-background border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-amber-500/10 to-orange-600/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-display tracking-wide">New Episode</h2>
              <p className="text-xs text-muted-foreground">
                Step {getStepNumber()} of 3 • {step === "define" ? "Define" : step === "validate" ? "Validate" : "Character"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pt-3">
          <Progress value={(getStepNumber() / 3) * 100} className="h-1" />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {step === "define" && (
            <>
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Episode Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder="e.g., Product Launch Sprint"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-muted/50"
                />
              </div>

              {/* Objective */}
              <div className="space-y-2">
                <Label htmlFor="objective">What are you accomplishing?</Label>
                <Textarea
                  id="objective"
                  placeholder="Be specific about your mini-goal. What does done look like?"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="bg-muted/50 min-h-[100px]"
                />
              </div>

              {/* Duration */}
              <div className="space-y-3">
                <Label>Sprint Duration</Label>
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
                      <p className="text-xs text-muted-foreground">Quick win</p>
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
                      <p className="text-xs text-muted-foreground">Standard sprint</p>
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
                      <p className="text-xs text-muted-foreground">Deep focus</p>
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
                      <p className="text-xs text-muted-foreground">Set date</p>
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

              {/* Chief Aim Preview */}
              {hasChiefAim && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Your Main Objective:</p>
                  <p className="text-sm text-gold line-clamp-2">{chiefAim.what}</p>
                </div>
              )}

              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                onClick={handleValidate}
                disabled={!objective.trim() || !hasChiefAim}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {hasChiefAim ? "Check Alignment" : "Set Chief Aim First"}
              </Button>

              {!hasChiefAim && (
                <p className="text-xs text-center text-muted-foreground">
                  You need a Definite Chief Aim to create episodes
                </p>
              )}
            </>
          )}

          {step === "validate" && (
            <div className="space-y-6">
              {validating ? (
                <div className="text-center py-8">
                  <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Analyzing alignment with your Chief Aim...</p>
                </div>
              ) : alignmentResult ? (
                <>
                  {/* Alignment Score */}
                  <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 border-2 border-border">
                      <span className={`text-3xl font-bold ${getScoreColor(alignmentResult.score)}`}>
                        {alignmentResult.score}
                      </span>
                    </div>
                    <div>
                      <p className={`text-lg font-medium ${getScoreColor(alignmentResult.score)}`}>
                        {getScoreLabel(alignmentResult.score)}
                      </p>
                      <Progress 
                        value={alignmentResult.score} 
                        className="h-2 mt-2"
                      />
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-start gap-2">
                      {alignmentResult.score >= 50 ? (
                        <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      <p className="text-sm">{alignmentResult.reasoning}</p>
                    </div>
                  </div>

                  {/* Episode Summary */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Objective:</span>
                      <span className="text-foreground">{objective}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Deadline:</span>
                      <span className="text-foreground">
                        {format(new Date(getDeadline()), "MMMM d, yyyy")}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setStep("define");
                        setAlignmentResult(null);
                      }}
                    >
                      Edit Episode
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                      onClick={handleCreate}
                      disabled={creating}
                    >
                      {creating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Create & Analyze Character
                        </>
                      )}
                    </Button>
                  </div>

                  {alignmentResult.score < 30 && (
                    <p className="text-xs text-center text-amber-500">
                      ⚠️ This episode may distract from your main goal. Consider revising.
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">Failed to validate alignment. Try again?</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setStep("define")}
                  >
                    Go Back
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === "character" && (
            <div className="space-y-6">
              {analyzingCharacter ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-amber-500 animate-pulse mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Analyzing Your Required Character...</p>
                  <p className="text-sm text-muted-foreground">
                    Determining who you must become to achieve this episode objective.
                  </p>
                </div>
              ) : characterAnalysis ? (
                <>
                  {/* Success Header */}
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-lg font-medium">Episode Created!</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Here's the character you must embody:
                    </p>
                  </div>

                  {/* Character Card */}
                  <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/30">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-xs text-amber-500 uppercase tracking-wide">Your Episode Character</p>
                        <p className="font-display text-lg">{characterAnalysis.requiredCharacter.name}</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 italic">
                      "{characterAnalysis.requiredCharacter.mindset}"
                    </p>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-amber-500">Key Traits:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {characterAnalysis.requiredCharacter.traits.map((trait, i) => (
                          <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400">
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Daily Focus */}
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-center">
                    <p className="text-xs text-primary uppercase tracking-wide mb-1">Daily Mantra</p>
                    <p className="font-medium">{characterAnalysis.dailyFocus}</p>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <Button
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                      onClick={handleCreateMindMovie}
                    >
                      <Film className="w-4 h-4 mr-2" />
                      Create Episode Mind Movie
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleFinish}
                    >
                      Finish Without Movie
                    </Button>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    You can always create the Mind Movie later from your Episodes list
                  </p>
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">Failed to analyze character. You can still proceed.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleFinish}
                  >
                    Finish Episode
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
