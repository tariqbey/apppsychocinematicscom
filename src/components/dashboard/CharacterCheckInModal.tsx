import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEpisodes, Episode } from "@/hooks/useEpisodes";
import { toast } from "sonner";
import { Brain, Heart, Scissors, Lightbulb, CheckCircle2, XCircle, ArrowRight, Sparkles } from "lucide-react";
import { EpisodeCharacterTransformation } from "@/components/episodes/EpisodeTransformationCard";

interface CharacterCheckInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "awareness" | "cut" | "clarity" | "choice" | "complete";

export function CharacterCheckInModal({ open, onOpenChange }: CharacterCheckInModalProps) {
  const { user } = useAuth();
  const { activeEpisode } = useEpisodes();
  const [step, setStep] = useState<Step>("awareness");
  const [saving, setSaving] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  
  // Form state
  const [hitMidpointConflict, setHitMidpointConflict] = useState<boolean | null>(null);
  const [midpointDescription, setMidpointDescription] = useState("");
  const [emotionalAwareness, setEmotionalAwareness] = useState("");
  const [oldPatternTriggered, setOldPatternTriggered] = useState<boolean | null>(null);
  const [oldPatternDescription, setOldPatternDescription] = useState("");
  const [didCut, setDidCut] = useState<boolean | null>(null);
  const [clarityReceived, setClarityReceived] = useState("");
  const [choseTransformation, setChoseTransformation] = useState<boolean | null>(null);
  const [transformationAction, setTransformationAction] = useState("");
  const [characterRating, setCharacterRating] = useState(5);
  const [reflectionNotes, setReflectionNotes] = useState("");

  // Get transformation data from active episode
  const transformation = activeEpisode?.character_transformation as unknown as EpisodeCharacterTransformation | null;
  const narrativeArc = transformation?.narrativeArc;

  // Check if today's check-in already exists
  useEffect(() => {
    const checkExisting = async () => {
      if (!user || !open) return;
      
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from("daily_character_checkins")
        .select("id")
        .eq("user_id", user.id)
        .eq("checkin_date", today)
        .maybeSingle();
      
      setAlreadyCompleted(!!data);
    };
    checkExisting();
  }, [user, open]);

  const resetForm = () => {
    setStep("awareness");
    setHitMidpointConflict(null);
    setMidpointDescription("");
    setEmotionalAwareness("");
    setOldPatternTriggered(null);
    setOldPatternDescription("");
    setDidCut(null);
    setClarityReceived("");
    setChoseTransformation(null);
    setTransformationAction("");
    setCharacterRating(5);
    setReflectionNotes("");
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from("daily_character_checkins")
        .upsert({
          user_id: user.id,
          episode_id: activeEpisode?.id || null,
          checkin_date: today,
          hit_midpoint_conflict: hitMidpointConflict,
          midpoint_description: midpointDescription || null,
          emotional_awareness: emotionalAwareness || null,
          old_pattern_triggered: oldPatternTriggered,
          old_pattern_description: oldPatternDescription || null,
          did_cut: didCut,
          clarity_received: clarityReceived || null,
          chose_transformation: choseTransformation,
          transformation_action: transformationAction || null,
          character_rating: characterRating,
          reflection_notes: reflectionNotes || null,
        }, { onConflict: "user_id,checkin_date" });

      if (error) throw error;

      toast.success("Character check-in complete! Great self-awareness work.");
      setStep("complete");
    } catch (error) {
      console.error("Error saving check-in:", error);
      toast.error("Failed to save check-in");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const renderStep = () => {
    switch (step) {
      case "awareness":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-display text-gold mb-2">Emotional Awareness</h3>
              <p className="text-sm text-muted-foreground">
                Let's check in on today's character performance
              </p>
            </div>

            {/* Midpoint Conflict Check */}
            {narrativeArc?.midpointConflict && (
              <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 mb-4">
                <p className="text-xs text-amber-500 font-medium mb-2">YOUR MIDPOINT CONFLICT</p>
                <p className="text-sm italic">"{narrativeArc.midpointConflict}"</p>
              </div>
            )}

            <div className="space-y-4">
              <Label>Did you encounter your midpoint conflict today?</Label>
              <RadioGroup
                value={hitMidpointConflict === null ? "" : hitMidpointConflict ? "yes" : "no"}
                onValueChange={(v) => setHitMidpointConflict(v === "yes")}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="yes" id="conflict-yes" />
                  <Label htmlFor="conflict-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="no" id="conflict-no" />
                  <Label htmlFor="conflict-no" className="cursor-pointer">No</Label>
                </div>
              </RadioGroup>

              {hitMidpointConflict && (
                <div className="space-y-2 animate-fade-in">
                  <Label>Describe what happened</Label>
                  <Textarea
                    value={midpointDescription}
                    onChange={(e) => setMidpointDescription(e.target.value)}
                    placeholder="What was the situation? How did it challenge you?"
                    rows={3}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>What are you feeling right now?</Label>
                <Textarea
                  value={emotionalAwareness}
                  onChange={(e) => setEmotionalAwareness(e.target.value)}
                  placeholder="What emotions are present? What part of you was challenged today?"
                  rows={3}
                />
              </div>
            </div>

            <Button 
              onClick={() => setStep("cut")} 
              className="w-full"
              disabled={hitMidpointConflict === null}
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      case "cut":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center mx-auto mb-4">
                <Scissors className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-display text-red-400 mb-2">Did You "CUT!"?</h3>
              <p className="text-sm text-muted-foreground">
                When emotional, your IQ drops. Cutting means pausing to access higher thinking.
              </p>
            </div>

            <div className="space-y-4">
              <Label>Was an old pattern triggered today?</Label>
              <RadioGroup
                value={oldPatternTriggered === null ? "" : oldPatternTriggered ? "yes" : "no"}
                onValueChange={(v) => setOldPatternTriggered(v === "yes")}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="yes" id="pattern-yes" />
                  <Label htmlFor="pattern-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="no" id="pattern-no" />
                  <Label htmlFor="pattern-no" className="cursor-pointer">No</Label>
                </div>
              </RadioGroup>

              {oldPatternTriggered && (
                <div className="space-y-2 animate-fade-in">
                  <Label>What old pattern showed up?</Label>
                  <Textarea
                    value={oldPatternDescription}
                    onChange={(e) => setOldPatternDescription(e.target.value)}
                    placeholder="Describe the reactive behavior or old identity that was triggered..."
                    rows={2}
                  />
                </div>
              )}

              <div className="pt-4">
                <Label>Did you consciously "cut" the emotion before reacting?</Label>
                <RadioGroup
                  value={didCut === null ? "" : didCut ? "yes" : "no"}
                  onValueChange={(v) => setDidCut(v === "yes")}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="yes" id="cut-yes" />
                    <Label htmlFor="cut-yes" className="cursor-pointer flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Yes, I cut
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="no" id="cut-no" />
                    <Label htmlFor="cut-no" className="cursor-pointer flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      No, I reacted
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("awareness")} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep("clarity")} className="flex-1">
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case "clarity":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-violet-600/20 flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-display text-purple-400 mb-2">Seeking Clarity</h3>
              <p className="text-sm text-muted-foreground">
                Did insight come once you moved past the emotion?
              </p>
            </div>

            <div className="space-y-4">
              <Label>What clarity or insight did you receive?</Label>
              <Textarea
                value={clarityReceived}
                onChange={(e) => setClarityReceived(e.target.value)}
                placeholder="What did you realize? What 'answer' came to you?"
                rows={3}
              />

              {narrativeArc?.climacticShift && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-primary font-medium mb-2">YOUR CLIMACTIC SHIFT</p>
                  <p className="text-sm italic">"{narrativeArc.climacticShift}"</p>
                </div>
              )}

              <div className="pt-4">
                <Label>Did you choose transformation over comfort?</Label>
                <RadioGroup
                  value={choseTransformation === null ? "" : choseTransformation ? "yes" : "no"}
                  onValueChange={(v) => setChoseTransformation(v === "yes")}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="yes" id="transform-yes" />
                    <Label htmlFor="transform-yes" className="cursor-pointer flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gold" />
                      Yes, I transformed
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="no" id="transform-no" />
                    <Label htmlFor="transform-no" className="cursor-pointer">
                      No, not today
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {choseTransformation && (
                <div className="space-y-2 animate-fade-in">
                  <Label>What action did you take?</Label>
                  <Textarea
                    value={transformationAction}
                    onChange={(e) => setTransformationAction(e.target.value)}
                    placeholder="Describe the transformative action you chose..."
                    rows={2}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("cut")} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep("choice")} className="flex-1">
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case "choice":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold/20 to-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-display text-gold mb-2">Final Reflection</h3>
              <p className="text-sm text-muted-foreground">
                Rate your character alignment for today
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Character Alignment Score</Label>
                  <span className="text-2xl font-display text-gold">{characterRating}/10</span>
                </div>
                <Slider
                  value={[characterRating]}
                  onValueChange={([v]) => setCharacterRating(v)}
                  min={0}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Off-Script</span>
                  <span>Oscar-Worthy</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Any final notes or reflections?</Label>
                <Textarea
                  value={reflectionNotes}
                  onChange={(e) => setReflectionNotes(e.target.value)}
                  placeholder="What will you carry forward from today?"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("clarity")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Saving..." : "Complete Check-In"}
              </Button>
            </div>
          </div>
        );

      case "complete":
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-display text-gold mb-2">Check-In Complete!</h3>
            <p className="text-muted-foreground mb-6">
              Great work reflecting on your character performance today.
            </p>
            <Button onClick={handleClose}>Close</Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Daily Character Check-In
          </DialogTitle>
        </DialogHeader>

        {alreadyCompleted && step !== "complete" ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-display mb-2">Already Checked In Today</h3>
            <p className="text-muted-foreground mb-6">
              You've already completed your character check-in for today. Come back tomorrow!
            </p>
            <Button onClick={handleClose}>Close</Button>
          </div>
        ) : (
          renderStep()
        )}
      </DialogContent>
    </Dialog>
  );
}