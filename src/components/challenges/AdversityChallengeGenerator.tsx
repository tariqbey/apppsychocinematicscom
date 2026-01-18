import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Wand2, Swords, Target, Zap } from "lucide-react";
import { Episode } from "@/hooks/useEpisodes";

interface AdversityChallengeGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChallengeCreated: () => void;
  activeEpisode: Episode | null;
}

const SCENARIO_TYPES = [
  { value: "betrayal", label: "Betrayal Before Success", desc: "Trust is broken at a critical moment" },
  { value: "rejection", label: "Sudden Rejection", desc: "An admired person dismisses you" },
  { value: "praise", label: "Unexpected Praise", desc: "Tests humility and ego management" },
  { value: "loyalty_conflict", label: "Loyalty vs Truth", desc: "Integrity is tested by relationships" },
  { value: "temptation", label: "Temptation", desc: "Old habits or easy paths call you back" },
  { value: "public_failure", label: "Public Failure", desc: "Exposed vulnerability in front of others" },
  { value: "resource_loss", label: "Resource Loss", desc: "Money, time, or tools suddenly gone" },
  { value: "health_setback", label: "Health Setback", desc: "Physical or mental challenges arise" },
];

const TARGET_TRAITS = [
  "Patience", "Decisiveness", "Humility", "Courage", "Resilience",
  "Emotional Regulation", "Strategic Thinking", "Self-Worth", "Integrity",
  "Focus", "Discipline", "Compassion", "Confidence", "Adaptability"
];

export function AdversityChallengeGenerator({
  open,
  onOpenChange,
  onChallengeCreated,
  activeEpisode
}: AdversityChallengeGeneratorProps) {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scenarioType, setScenarioType] = useState("");
  const [targetTrait, setTargetTrait] = useState("");
  const [generatedChallenge, setGeneratedChallenge] = useState<{
    situation: string;
    trigger: string;
  } | null>(null);

  const handleGenerate = async () => {
    if (!scenarioType || !targetTrait) {
      toast.error("Please select a scenario type and target trait");
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-adversity-challenge", {
        body: {
          scenarioType,
          targetTrait,
          episodeContext: activeEpisode ? {
            title: activeEpisode.title,
            objective: activeEpisode.objective,
            characterTransformation: activeEpisode.character_transformation
          } : null
        }
      });

      if (error) throw error;

      setGeneratedChallenge({
        situation: data.situation,
        trigger: data.trigger
      });
    } catch (error) {
      console.error("Error generating challenge:", error);
      toast.error("Failed to generate challenge. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveChallenge = async () => {
    if (!user || !generatedChallenge) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("adversity_challenges")
        .insert({
          user_id: user.id,
          episode_id: activeEpisode?.id || null,
          scenario_type: scenarioType,
          target_trait: targetTrait,
          situation_description: generatedChallenge.situation,
          emotional_trigger: generatedChallenge.trigger,
          challenge_date: new Date().toISOString().split('T')[0],
          completed: false
        });

      if (error) throw error;

      toast.success("Challenge created! Face your adversity with courage.");
      onChallengeCreated();
      handleClose();
    } catch (error) {
      console.error("Error saving challenge:", error);
      toast.error("Failed to save challenge");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setScenarioType("");
    setTargetTrait("");
    setGeneratedChallenge(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Swords className="w-5 h-5 text-red-500" />
            Generate Adversity Challenge
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Episode Context */}
          {activeEpisode && (
            <Card className="p-3 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-primary" />
                <span>Linked to Episode: <strong>{activeEpisode.title}</strong></span>
              </div>
            </Card>
          )}

          {/* Scenario Type Selection */}
          <div className="space-y-2">
            <Label>Scenario Type</Label>
            <Select value={scenarioType} onValueChange={setScenarioType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a scenario type..." />
              </SelectTrigger>
              <SelectContent 
                className="max-h-[280px] bg-popover border shadow-lg"
                position="popper"
                sideOffset={4}
              >
                {SCENARIO_TYPES.map((type) => (
                  <SelectItem 
                    key={type.value} 
                    value={type.value}
                    className="cursor-pointer py-2"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-muted-foreground">{type.desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Trait Selection */}
          <div className="space-y-2">
            <Label>Target Trait to Develop</Label>
            <Select value={targetTrait} onValueChange={setTargetTrait}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a trait to train..." />
              </SelectTrigger>
              <SelectContent 
                className="max-h-[280px] bg-popover border shadow-lg"
                position="popper"
                sideOffset={4}
              >
                {TARGET_TRAITS.map((trait) => (
                  <SelectItem 
                    key={trait} 
                    value={trait}
                    className="cursor-pointer"
                  >
                    {trait}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button */}
          {!generatedChallenge && (
            <Button
              onClick={handleGenerate}
              disabled={generating || !scenarioType || !targetTrait}
              className="w-full"
              variant="gold"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Challenge...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Challenge
                </>
              )}
            </Button>
          )}

          {/* Generated Challenge Preview */}
          {generatedChallenge && (
            <Card className="p-4 space-y-4 border-gold/30 bg-gold/5">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-gold" />
                <h3 className="font-display text-lg">Your Challenge</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">SITUATION</Label>
                  <p className="text-sm mt-1">{generatedChallenge.situation}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">EMOTIONAL TRIGGER</Label>
                  <p className="text-sm mt-1 italic text-amber-400">
                    "{generatedChallenge.trigger}"
                  </p>
                </div>

                <div className="flex gap-2">
                  <Badge variant="outline">{scenarioType}</Badge>
                  <Badge className="bg-gold/20 text-gold border-gold/30">{targetTrait}</Badge>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setGeneratedChallenge(null)}
                  className="flex-1"
                >
                  Regenerate
                </Button>
                <Button
                  variant="gold"
                  onClick={handleSaveChallenge}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Accept Challenge"
                  )}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
