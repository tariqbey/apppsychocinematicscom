import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Wand2, Swords, Target, Zap, PenLine, Image as ImageIcon, Upload, X } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [challengeMode, setChallengeMode] = useState<"ai" | "custom">("ai");
  
  // AI-generated challenge state
  const [scenarioType, setScenarioType] = useState("");
  const [targetTrait, setTargetTrait] = useState("");
  const [generatedChallenge, setGeneratedChallenge] = useState<{
    situation: string;
    trigger: string;
  } | null>(null);

  // Custom challenge state
  const [customSituation, setCustomSituation] = useState("");
  const [customTrigger, setCustomTrigger] = useState("");
  const [customTrait, setCustomTrait] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  
  // Reference photo state
  const [referencePhoto, setReferencePhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/challenge-reference-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('generated-media')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('generated-media')
        .getPublicUrl(fileName);

      setReferencePhoto(publicUrl);
      toast.success("Reference photo uploaded!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

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
          referencePhotoUrl: referencePhoto,
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
    if (!user) return;

    const isCustom = challengeMode === "custom";
    const situation = isCustom ? customSituation : generatedChallenge?.situation;
    const trigger = isCustom ? customTrigger : generatedChallenge?.trigger;
    const trait = isCustom ? customTrait : targetTrait;
    const scenario = isCustom ? "custom" : scenarioType;

    if (!situation || !trigger || !trait) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("adversity_challenges")
        .insert({
          user_id: user.id,
          episode_id: activeEpisode?.id || null,
          scenario_type: scenario,
          target_trait: trait,
          situation_description: situation,
          emotional_trigger: trigger,
          challenge_date: new Date().toISOString().split('T')[0],
          completed: false,
          insight_gained: isCustom ? desiredOutcome : null
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
    setCustomSituation("");
    setCustomTrigger("");
    setCustomTrait("");
    setDesiredOutcome("");
    setChallengeMode("ai");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Swords className="w-5 h-5 text-red-500" />
            Adversity Challenge
          </DialogTitle>
        </DialogHeader>

        {/* Body wrapper with native scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 overscroll-contain">
          <div className="space-y-4 py-4">
            {/* Episode Context */}
            {activeEpisode && (
              <Card className="p-3 bg-primary/5 border-primary/20">
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>Linked to Episode: <strong>{activeEpisode.title}</strong></span>
                </div>
              </Card>
            )}

            {/* Mode Tabs */}
            <Tabs value={challengeMode} onValueChange={(v) => setChallengeMode(v as "ai" | "custom")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ai" className="gap-2">
                  <Wand2 className="w-4 h-4" />
                  AI Generated
                </TabsTrigger>
                <TabsTrigger value="custom" className="gap-2">
                  <PenLine className="w-4 h-4" />
                  Custom
                </TabsTrigger>
              </TabsList>

              {/* AI Generated Tab */}
              <TabsContent value="ai" className="space-y-4 mt-4">
                {/* Scenario Type Selection */}
                <div className="space-y-2">
                  <Label>Scenario Type</Label>
                  <Select value={scenarioType} onValueChange={setScenarioType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a scenario type..." />
                    </SelectTrigger>
                    <SelectContent 
                      className="z-[200] bg-popover border shadow-lg"
                      position="popper"
                      sideOffset={4}
                      align="start"
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
                      className="z-[200] bg-popover border shadow-lg"
                      position="popper"
                      sideOffset={4}
                      align="start"
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
              </TabsContent>

              {/* Custom Challenge Tab */}
              <TabsContent value="custom" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Your Challenge Situation *</Label>
                  <Textarea
                    value={customSituation}
                    onChange={(e) => setCustomSituation(e.target.value)}
                    placeholder="Describe the adversity or challenge you're facing..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Emotional Trigger *</Label>
                  <Input
                    value={customTrigger}
                    onChange={(e) => setCustomTrigger(e.target.value)}
                    placeholder="What emotion does this trigger in you?"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Trait to Develop *</Label>
                  <Select value={customTrait} onValueChange={setCustomTrait}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select the trait you'll strengthen..." />
                    </SelectTrigger>
                    <SelectContent 
                      className="z-[200] bg-popover border shadow-lg"
                      position="popper"
                      sideOffset={4}
                      align="start"
                    >
                      {TARGET_TRAITS.map((trait) => (
                        <SelectItem key={trait} value={trait} className="cursor-pointer">
                          {trait}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Desired Outcome / Reward</Label>
                  <Textarea
                    value={desiredOutcome}
                    onChange={(e) => setDesiredOutcome(e.target.value)}
                    placeholder="What will you gain from overcoming this challenge? What's your reward?"
                    rows={2}
                  />
                </div>

                <Button
                  variant="gold"
                  onClick={handleSaveChallenge}
                  disabled={saving || !customSituation || !customTrigger || !customTrait}
                  className="w-full"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Create Challenge"
                  )}
                </Button>
              </TabsContent>
            </Tabs>

            {/* Reference Photo Upload (for visualization) */}
            <Card className="p-4 border-dashed">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-gold" />
                  <Label className="text-sm font-medium">Best Self Reference Photo</Label>
                </div>
                {referencePhoto && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReferencePhoto(null)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Upload a photo of yourself to personalize all visualization images
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              {referencePhoto ? (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gold/30">
                  <img src={referencePhoto} alt="Reference" className="w-full h-full object-cover" />
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="w-full gap-2"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Upload Photo
                </Button>
              )}
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
