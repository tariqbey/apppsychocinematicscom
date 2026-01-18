import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Target, 
  Swords, 
  Brain, 
  Scissors, 
  Lightbulb, 
  CheckCircle2, 
  XCircle,
  ArrowRight,
  Flame,
  BookOpen,
  Loader2,
  Film,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { ChallengeVisualization } from "./ChallengeVisualization";

interface AdversityChallenge {
  id: string;
  scenario_type: string;
  target_trait: string;
  situation_description: string;
  emotional_trigger: string;
  challenge_date: string;
  completed: boolean;
  episode_id?: string | null;
  storyboard_scenes?: any[] | null;
  storyboard_reference_photo?: string | null;
  storyboard_created_at?: string | null;
}

interface ChallengeCardProps {
  challenge: AdversityChallenge;
  onComplete: () => void;
}

type ResponseStep = "feeling" | "cut" | "clarity" | "action" | "complete";

export function ChallengeCard({ challenge, onComplete }: ChallengeCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showResponse, setShowResponse] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [step, setStep] = useState<ResponseStep>("feeling");
  const [saving, setSaving] = useState(false);
  
  // Response state
  const [feeling, setFeeling] = useState("");
  const [partChallenged, setPartChallenged] = useState("");
  const [didCut, setDidCut] = useState<boolean | null>(null);
  const [cutNotes, setCutNotes] = useState("");
  const [insightGained, setInsightGained] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [atPeace, setAtPeace] = useState<boolean | null>(null);

  const calculateXP = () => {
    let xp = 10; // Base XP for completing
    if (didCut) xp += 15; // Bonus for using CUT technique
    if (insightGained.length > 50) xp += 10; // Bonus for meaningful insight
    if (atPeace) xp += 10; // Bonus for reaching peace
    return xp;
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setSaving(true);
    const earnedXP = calculateXP();
    
    try {
      const { error } = await supabase
        .from("adversity_challenges")
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          feeling,
          part_challenged: partChallenged,
          did_cut: didCut,
          cut_notes: cutNotes || null,
          insight_gained: insightGained,
          action_taken: actionTaken,
          at_peace: atPeace,
          trait_xp_earned: earnedXP,
          response_type: didCut ? "transformative" : "reactive"
        })
        .eq("id", challenge.id);

      if (error) throw error;

      toast.success(`Challenge completed! +${earnedXP} XP earned for ${challenge.target_trait}`);
      setShowResponse(false);
      onComplete();
    } catch (error) {
      console.error("Error completing challenge:", error);
      toast.error("Failed to save response");
    } finally {
      setSaving(false);
    }
  };

  const handleJournalReflection = () => {
    // Store context for journal and navigate to dashboard with journal open
    sessionStorage.setItem("adversityChallengeForJournal", JSON.stringify({
      id: challenge.id,
      trait: challenge.target_trait,
      situation: challenge.situation_description,
      trigger: challenge.emotional_trigger
    }));
    // Navigate to home page with query param to open journal
    navigate("/?openJournal=true");
  };

  const renderStep = () => {
    switch (step) {
      case "feeling":
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
                <Brain className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="font-display text-lg text-gold">Emotional Awareness</h3>
            </div>

            <div className="space-y-3">
              <div>
                <Label>What are you feeling?</Label>
                <Textarea
                  value={feeling}
                  onChange={(e) => setFeeling(e.target.value)}
                  placeholder="Describe your emotional state..."
                  rows={2}
                />
              </div>

              <div>
                <Label>What part of you is being challenged?</Label>
                <Textarea
                  value={partChallenged}
                  onChange={(e) => setPartChallenged(e.target.value)}
                  placeholder="My ego, my fear of failure, my need for control..."
                  rows={2}
                />
              </div>
            </div>

            <Button 
              onClick={() => setStep("cut")} 
              disabled={!feeling}
              className="w-full"
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      case "cut":
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                <Scissors className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="font-display text-lg text-red-400">Did You "CUT!"?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                When emotional, your IQ drops. Cutting means pausing to access higher thinking.
              </p>
            </div>

            <RadioGroup
              value={didCut === null ? "" : didCut ? "yes" : "no"}
              onValueChange={(v) => setDidCut(v === "yes")}
              className="space-y-3"
            >
              <div className="flex items-center gap-3 p-3 rounded-lg border border-green-500/30 hover:bg-green-500/10 cursor-pointer">
                <RadioGroupItem value="yes" id="cut-yes" />
                <Label htmlFor="cut-yes" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">Yes, I CUT the emotion</p>
                    <p className="text-xs text-muted-foreground">I paused and accessed higher thinking</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-red-500/30 hover:bg-red-500/10 cursor-pointer">
                <RadioGroupItem value="no" id="cut-no" />
                <Label htmlFor="cut-no" className="flex items-center gap-2 cursor-pointer flex-1">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="font-medium">No, I reacted</p>
                    <p className="text-xs text-muted-foreground">The emotion took control</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {didCut !== null && (
              <div className="space-y-2 animate-fade-in">
                <Label>
                  {didCut ? "How did you cut through the emotion?" : "What happened when you reacted?"}
                </Label>
                <Textarea
                  value={cutNotes}
                  onChange={(e) => setCutNotes(e.target.value)}
                  placeholder={didCut 
                    ? "I took a deep breath, reminded myself of my Chief Aim..." 
                    : "I snapped back, said something I regret..."
                  }
                  rows={2}
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("feeling")} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={() => setStep("clarity")} 
                disabled={didCut === null}
                className="flex-1"
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case "clarity":
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                <Lightbulb className="w-7 h-7 text-purple-500" />
              </div>
              <h3 className="font-display text-lg text-purple-400">Seeking Clarity</h3>
            </div>

            <div className="space-y-3">
              <Label>What insight or clarity did you receive?</Label>
              <Textarea
                value={insightGained}
                onChange={(e) => setInsightGained(e.target.value)}
                placeholder="I realized that... I understood that..."
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("cut")} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={() => setStep("action")} 
                className="flex-1"
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case "action":
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-3">
                <Flame className="w-7 h-7 text-gold" />
              </div>
              <h3 className="font-display text-lg text-gold">Choice Point</h3>
            </div>

            <div className="space-y-3">
              <Label>What action did you take (or will you take)?</Label>
              <Textarea
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                placeholder="Describe your transformative action..."
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label>Are you at peace with the outcome?</Label>
              <RadioGroup
                value={atPeace === null ? "" : atPeace ? "yes" : "no"}
                onValueChange={(v) => setAtPeace(v === "yes")}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="yes" id="peace-yes" />
                  <Label htmlFor="peace-yes">✅ At Peace</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="no" id="peace-no" />
                  <Label htmlFor="peace-no">⏳ Still Processing</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="p-3 rounded-lg bg-gold/10 border border-gold/30 text-center">
              <p className="text-sm">
                <span className="text-gold font-bold">+{calculateXP()} XP</span> for {challenge.target_trait}
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("clarity")} className="flex-1">
                Back
              </Button>
              <Button 
                variant="gold"
                onClick={handleComplete} 
                disabled={saving || !actionTaken}
                className="flex-1"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Complete Challenge"
                )}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Card className="p-5 hover:border-gold/30 transition-colors">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
            <Swords className="w-6 h-6 text-red-500" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="text-xs">{challenge.scenario_type}</Badge>
              <Badge className="bg-gold/20 text-gold border-gold/30 text-xs">
                {challenge.target_trait}
              </Badge>
            </div>
            
            <p className="text-sm mb-2">{challenge.situation_description}</p>
            
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 mb-3">
              <p className="text-xs text-muted-foreground">EMOTIONAL TRIGGER</p>
              <p className="text-sm italic text-amber-400">"{challenge.emotional_trigger}"</p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" variant="gold" onClick={() => setShowVisualization(true)}>
                <Film className="w-4 h-4 mr-1" />
                See Ideal Response
              </Button>
              <Button size="sm" variant="default" onClick={() => setShowResponse(true)}>
                <Scissors className="w-4 h-4 mr-1" />
                Respond
              </Button>
              <Button size="sm" variant="outline" onClick={handleJournalReflection}>
                <BookOpen className="w-4 h-4 mr-1" />
                Journal
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Visualization Modal */}
      <ChallengeVisualization
        open={showVisualization}
        onOpenChange={setShowVisualization}
        challenge={challenge}
        savedStoryboard={challenge.storyboard_scenes ? {
          scenes: challenge.storyboard_scenes,
          referencePhoto: challenge.storyboard_reference_photo || null
        } : null}
        onStoryboardSaved={onComplete}
      />

      {/* Response Dialog */}
      <Dialog open={showResponse} onOpenChange={setShowResponse}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Target className="w-5 h-5 text-gold" />
              Challenge Response
            </DialogTitle>
          </DialogHeader>
          
          {renderStep()}
        </DialogContent>
      </Dialog>
    </>
  );
}
