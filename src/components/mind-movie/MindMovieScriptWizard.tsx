import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Sparkles, Save, Clapperboard, Palette, Layout, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StoryboardGrid } from "./StoryboardGrid";
import { useMindMovieScript, type Scene } from "@/hooks/useMindMovieScript";
import { toast } from "sonner";

interface MindMovieScriptWizardProps {
  isOpen: boolean;
  onClose: () => void;
  chiefAim: {
    what?: string;
    byWhen?: string;
    exchange?: string;
    plan?: string;
  };
  onOpenEditBay?: (prompt: string) => void;
}

const VISUAL_STYLES = [
  { value: "cinematic", label: "Cinematic", description: "Hollywood film quality with dramatic lighting" },
  { value: "vibrant", label: "Vibrant & Colorful", description: "Bright, energetic, and uplifting" },
  { value: "elegant", label: "Elegant & Refined", description: "Sophisticated, luxurious aesthetics" },
  { value: "natural", label: "Natural & Organic", description: "Warm, earthy, authentic feel" },
  { value: "futuristic", label: "Futuristic", description: "Modern, tech-forward, innovative" },
  { value: "dreamy", label: "Dreamy & Ethereal", description: "Soft, magical, inspirational" },
];

export function MindMovieScriptWizard({ 
  isOpen, 
  onClose, 
  chiefAim,
  onOpenEditBay,
}: MindMovieScriptWizardProps) {
  const [step, setStep] = useState(1);
  const [visualStyle, setVisualStyle] = useState("cinematic");
  const [userDescription, setUserDescription] = useState("");
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [generatedScenes, setGeneratedScenes] = useState<Scene[]>([]);
  
  const { 
    isGenerating, 
    isLoading,
    currentScript,
    generateStoryboard, 
    saveScript,
    fetchLatestScript,
  } = useMindMovieScript();

  useEffect(() => {
    if (isOpen) {
      fetchLatestScript().then((script) => {
        if (script && script.scenes.length > 0) {
          setGeneratedTitle(script.title || "");
          setGeneratedScenes(script.scenes);
          setVisualStyle(script.visual_style || "cinematic");
          setStep(3);
        }
      });
    }
  }, [isOpen, fetchLatestScript]);

  const handleGenerateStoryboard = async () => {
    const result = await generateStoryboard(chiefAim, visualStyle, userDescription);
    if (result) {
      setGeneratedTitle(result.title);
      setGeneratedScenes(result.scenes);
      setStep(3);
    }
  };

  const handleSaveStoryboard = async () => {
    await saveScript(
      generatedTitle,
      generatedScenes,
      chiefAim,
      visualStyle,
      currentScript?.id
    );
  };

  const handleUpdateScene = (order: number, updates: Partial<Scene>) => {
    setGeneratedScenes((prev) =>
      prev.map((scene) => (scene.order === order ? { ...scene, ...updates } : scene))
    );
  };

  const handleGenerateInEditBay = (prompt: string) => {
    if (onOpenEditBay) {
      onOpenEditBay(prompt);
      onClose();
    } else {
      navigator.clipboard.writeText(prompt);
      toast.success("Prompt copied! Open Edit Bay to generate.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Clapperboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Mind Movie Script Writer</h1>
              <p className="text-sm text-muted-foreground">
                Create your visual storyboard from your Definite Chief Aim
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress */}
        <div className="px-4 py-3 border-b border-border/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-6">
              {[
                { num: 1, label: "Foundation", icon: Palette },
                { num: 2, label: "Generate", icon: Wand2 },
                { num: 3, label: "Storyboard", icon: Layout },
              ].map(({ num, label, icon: Icon }) => (
                <div
                  key={num}
                  className={`flex items-center gap-2 ${
                    step >= num ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step >= num
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <Progress value={(step / 3) * 100} className="h-1" />
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 max-w-4xl mx-auto">
            {/* Step 1: Foundation */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Set Your Visual Foundation</h2>
                  <p className="text-muted-foreground">
                    We'll use your Definite Chief Aim to create a personalized storyboard.
                  </p>
                </div>

                {/* Chief Aim Reference */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-primary mb-2">Your Definite Chief Aim</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">What:</span> {chiefAim.what || "Not set"}</p>
                      <p><span className="text-muted-foreground">By When:</span> {chiefAim.byWhen || "Not set"}</p>
                      <p><span className="text-muted-foreground">Exchange:</span> {chiefAim.exchange || "Not set"}</p>
                      <p><span className="text-muted-foreground">Plan:</span> {chiefAim.plan || "Not set"}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Visual Style Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Choose Your Visual Style</Label>
                  <RadioGroup
                    value={visualStyle}
                    onValueChange={setVisualStyle}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {VISUAL_STYLES.map((style) => (
                      <Label
                        key={style.value}
                        htmlFor={style.value}
                        className={`flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          visualStyle === style.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <RadioGroupItem
                          value={style.value}
                          id={style.value}
                          className="sr-only"
                        />
                        <span className="font-medium">{style.label}</span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {style.description}
                        </span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                {/* User Description */}
                <div className="space-y-3">
                  <Label htmlFor="description" className="text-base font-semibold">
                    Describe Your Vision
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    What does your success look like? Describe yourself, the setting, key moments, and how you want to feel.
                  </p>
                  <Textarea
                    id="description"
                    placeholder="Example: I see myself standing on the stage of a major conference, wearing my signature navy suit. The crowd is applauding. Behind me is a slide showing my company's logo. I feel confident, accomplished, and grateful. The lighting is warm and golden..."
                    value={userDescription}
                    onChange={(e) => setUserDescription(e.target.value)}
                    className="min-h-[150px]"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Generating */}
            {step === 2 && (
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20 animate-pulse flex items-center justify-center">
                    <Wand2 className="w-12 h-12 text-amber-500 animate-bounce" />
                  </div>
                  <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-amber-500/30 animate-ping" />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">Creating Your Storyboard</h2>
                  <p className="text-muted-foreground">
                    The AI is crafting personalized scenes for your Mind Movie...
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 animate-pulse text-amber-500" />
                  <span>This usually takes 10-20 seconds</span>
                </div>
              </div>
            )}

            {/* Step 3: Storyboard */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{generatedTitle || "Your Storyboard"}</h2>
                    <p className="text-muted-foreground">
                      {generatedScenes.length} scenes • Click to edit or copy prompts
                    </p>
                  </div>
                  <Button onClick={handleSaveStoryboard} disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? "Saving..." : "Save Storyboard"}
                  </Button>
                </div>

                <StoryboardGrid
                  scenes={generatedScenes}
                  onUpdateScene={handleUpdateScene}
                  onGenerateInEditBay={handleGenerateInEditBay}
                  isEditable={true}
                />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border/50 p-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1 || isGenerating}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            {step === 1 && (
              <Button
                onClick={() => {
                  setStep(2);
                  handleGenerateStoryboard();
                }}
                disabled={!userDescription.trim() || isGenerating}
              >
                Generate Storyboard
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            )}

            {step === 2 && (
              <Button disabled>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </Button>
            )}

            {step === 3 && (
              <Button onClick={onClose}>
                Done
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
