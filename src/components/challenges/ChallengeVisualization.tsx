import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  Film, 
  Play, 
  Wand2, 
  Loader2, 
  Sparkles,
  Eye,
  Target,
  Scissors,
  Flame,
  CheckCircle2,
  BookOpen,
  Quote,
  Save
} from "lucide-react";

interface ChallengeVisualizationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challenge: {
    id: string;
    situation_description: string;
    emotional_trigger: string;
    target_trait: string;
    scenario_type: string;
  };
  idealResponse?: string;
  affirmation?: string;
  visualizationScript?: string;
  onJournalEntry?: (notes: string) => void;
}

export function ChallengeVisualization({
  open,
  onOpenChange,
  challenge,
  idealResponse,
  affirmation,
  visualizationScript,
  onJournalEntry
}: ChallengeVisualizationProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("script");
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{
    idealResponse?: string;
    affirmation?: string;
    visualizationScript?: string;
  }>({
    idealResponse,
    affirmation,
    visualizationScript
  });
  const [journalNotes, setJournalNotes] = useState("");
  const [savingJournal, setSavingJournal] = useState(false);

  const handleGenerateVisualization = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-adversity-challenge", {
        body: {
          scenarioType: challenge.scenario_type,
          targetTrait: challenge.target_trait,
          generateVisualization: true
        }
      });

      if (error) throw error;

      setGeneratedContent({
        idealResponse: data.idealResponse,
        affirmation: data.affirmation,
        visualizationScript: data.visualizationScript
      });
      
      toast.success("Visualization generated!");
    } catch (error) {
      console.error("Error generating visualization:", error);
      toast.error("Failed to generate visualization");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveJournal = async () => {
    if (!user || !journalNotes.trim()) return;
    
    setSavingJournal(true);
    try {
      const { error } = await supabase
        .from("journal_entries")
        .insert({
          user_id: user.id,
          title: `Challenge Reflection: ${challenge.target_trait}`,
          content: `## Challenge Scenario
${challenge.situation_description}

## Emotional Trigger
${challenge.emotional_trigger}

## My Reflection
${journalNotes}

## Ideal Response Pattern
${generatedContent.idealResponse || "Not yet generated"}

## Personal Affirmation
${generatedContent.affirmation || "Not yet generated"}`,
          mood: "reflective",
          tags: ["challenge", challenge.target_trait.toLowerCase(), "adversity"]
        });

      if (error) throw error;

      toast.success("Reflection saved to journal!");
      onJournalEntry?.(journalNotes);
      setJournalNotes("");
    } catch (error) {
      console.error("Error saving journal:", error);
      toast.error("Failed to save reflection");
    } finally {
      setSavingJournal(false);
    }
  };

  // Handle visualizationScript as either string or array
  const parseVisualizationScript = () => {
    const script = generatedContent.visualizationScript;
    if (!script) return [];
    
    // If it's already an array, return it
    if (Array.isArray(script)) {
      return script.map(item => typeof item === 'string' ? item : item.description || item.scene || JSON.stringify(item));
    }
    
    // If it's a string, split by numbered list pattern
    if (typeof script === 'string') {
      return script.split(/\d\)/).filter(Boolean);
    }
    
    // If it's an object, try to extract values
    if (typeof script === 'object') {
      return Object.values(script).map(v => typeof v === 'string' ? v : JSON.stringify(v));
    }
    
    return [];
  };
  
  const scriptSteps = parseVisualizationScript();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Film className="w-5 h-5 text-gold" />
            Challenge Visualization
          </DialogTitle>
          <DialogDescription>
            See how your best self responds to this challenge
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="script" className="text-xs sm:text-sm">
              <Film className="w-4 h-4 mr-1 hidden sm:block" />
              Script
            </TabsTrigger>
            <TabsTrigger value="response" className="text-xs sm:text-sm">
              <Target className="w-4 h-4 mr-1 hidden sm:block" />
              Response
            </TabsTrigger>
            <TabsTrigger value="affirmation" className="text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 mr-1 hidden sm:block" />
              Affirm
            </TabsTrigger>
            <TabsTrigger value="journal" className="text-xs sm:text-sm">
              <BookOpen className="w-4 h-4 mr-1 hidden sm:block" />
              Reflect
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="script" className="mt-0 space-y-4 pr-4">
              <Card className="p-4 bg-muted/50">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{challenge.situation_description}</p>
                    <p className="text-xs text-amber-400 mt-1 italic">Trigger: "{challenge.emotional_trigger}"</p>
                  </div>
                </div>
                <Badge className="bg-gold/20 text-gold border-gold/30">{challenge.target_trait}</Badge>
              </Card>

              {!generatedContent.visualizationScript && (
                <Button
                  onClick={handleGenerateVisualization}
                  disabled={generating}
                  className="w-full"
                  variant="gold"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Visualization...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate Visualization Script
                    </>
                  )}
                </Button>
              )}

              {generatedContent.visualizationScript && (
                <div className="space-y-3">
                  <h4 className="font-display text-lg flex items-center gap-2">
                    <Play className="w-4 h-4 text-gold" />
                    Your Mind Movie Scene
                  </h4>
                  
                  <div className="space-y-3">
                    {scriptSteps.map((step, index) => {
                      const icons = [Target, Scissors, Flame, CheckCircle2];
                      const colors = ["red", "amber", "purple", "green"];
                      const labels = ["The Challenge", "The CUT! Moment", "Transformed Response", "Victory"];
                      const Icon = icons[index] || Target;
                      const color = colors[index] || "gold";
                      const label = labels[index] || "Scene";

                      return (
                        <Card 
                          key={index} 
                          className={`p-3 border-${color}-500/30 bg-${color}-500/5`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-${color}-500/20 flex items-center justify-center flex-shrink-0`}>
                              <Icon className={`w-4 h-4 text-${color}-500`} />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase">{label}</p>
                              <p className="text-sm mt-1">{step.trim()}</p>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="response" className="mt-0 space-y-4 pr-4">
              {generatedContent.idealResponse ? (
                <Card className="p-4 border-green-500/30 bg-green-500/5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Target className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">The Ideal Response</h4>
                      <p className="text-sm text-muted-foreground">{generatedContent.idealResponse}</p>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-8 text-center">
                  <Eye className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Generate a visualization to see the ideal response</p>
                  <Button onClick={handleGenerateVisualization} disabled={generating} variant="gold">
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
                  </Button>
                </Card>
              )}

              <Card className="p-4 bg-primary/5 border-primary/20">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Napoleon Hill's Principle
                </h4>
                <p className="text-sm text-muted-foreground">
                  Based on the Laws of Success: When facing {challenge.scenario_type.replace("_", " ")}, 
                  apply Self-Control and the principle of {challenge.target_trait}. 
                  Remember: "The person who cannot control themselves cannot lead others or achieve lasting success."
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="affirmation" className="mt-0 space-y-4 pr-4">
              {generatedContent.affirmation ? (
                <Card className="p-6 border-gold/30 bg-gradient-to-br from-gold/10 to-amber-500/5">
                  <Quote className="w-8 h-8 text-gold/50 mb-4" />
                  <p className="text-lg font-medium italic text-center">
                    "{generatedContent.affirmation}"
                  </p>
                  <div className="flex justify-center mt-4">
                    <Badge className="bg-gold/20 text-gold border-gold/30">
                      {challenge.target_trait}
                    </Badge>
                  </div>
                </Card>
              ) : (
                <Card className="p-8 text-center">
                  <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Generate a visualization to receive your personal affirmation</p>
                  <Button onClick={handleGenerateVisualization} disabled={generating} variant="gold">
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
                  </Button>
                </Card>
              )}

              <Card className="p-4 bg-muted/50">
                <h4 className="font-medium mb-2">How to Use This Affirmation</h4>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li>1. Read it aloud morning and evening</li>
                  <li>2. Visualize yourself embodying it</li>
                  <li>3. When the trigger occurs, recall this affirmation</li>
                  <li>4. Use it as your "CUT!" replacement thought</li>
                </ol>
              </Card>
            </TabsContent>

            <TabsContent value="journal" className="mt-0 space-y-4 pr-4">
              <Card className="p-4 bg-muted/50">
                <h4 className="font-medium mb-2">Reflection Prompts</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• How did you feel when facing this challenge?</li>
                  <li>• Did you use the CUT! technique? What happened?</li>
                  <li>• What did you learn about yourself?</li>
                  <li>• How will you respond differently next time?</li>
                </ul>
              </Card>

              <div className="space-y-2">
                <Label>Your Reflection</Label>
                <Textarea
                  value={journalNotes}
                  onChange={(e) => setJournalNotes(e.target.value)}
                  placeholder="Write about how you handled or will handle this challenge..."
                  rows={6}
                />
              </div>

              <Button
                onClick={handleSaveJournal}
                disabled={savingJournal || !journalNotes.trim()}
                className="w-full"
                variant="gold"
              >
                {savingJournal ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save to Journal
                  </>
                )}
              </Button>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
