import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Sparkles, Save, Clapperboard, Palette, Layout, Wand2, Music, Check, RefreshCw, Plus, User, ChevronDown, Trash2, HelpCircle, ExternalLink, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StoryboardGrid } from "./StoryboardGrid";
import { LyricsEditor } from "./LyricsEditor";
import { SoundtrackPlayer } from "./SoundtrackPlayer";
import { useMindMovieScript, type Scene } from "@/hooks/useMindMovieScript";
import { useMindMovieMusic, MUSIC_STYLES, type MusicStyle } from "@/hooks/useMindMovieMusic";
import { toast } from "sonner";

const PERSONA_STORAGE_KEY = 'mind-movie-saved-personas';

interface SavedPersona {
  id: string;
  label: string;
  lastUsed: number;
}

const loadSavedPersonas = (): SavedPersona[] => {
  try {
    const stored = localStorage.getItem(PERSONA_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const savePersonaToStorage = (personaId: string, label?: string) => {
  const personas = loadSavedPersonas();
  const existing = personas.find(p => p.id === personaId);
  
  if (existing) {
    existing.lastUsed = Date.now();
    if (label) existing.label = label;
  } else {
    personas.push({
      id: personaId,
      label: label || `Persona ${personas.length + 1}`,
      lastUsed: Date.now(),
    });
  }
  
  // Keep only the 10 most recent
  const sorted = personas.sort((a, b) => b.lastUsed - a.lastUsed).slice(0, 10);
  localStorage.setItem(PERSONA_STORAGE_KEY, JSON.stringify(sorted));
};

const removePersonaFromStorage = (personaId: string) => {
  const personas = loadSavedPersonas().filter(p => p.id !== personaId);
  localStorage.setItem(PERSONA_STORAGE_KEY, JSON.stringify(personas));
};

export interface TimelineExportData {
  scenes: Scene[];
  soundtrackUrl?: string | null;
  title?: string;
}

interface MindMovieScriptWizardProps {
  isOpen: boolean;
  onClose: () => void;
  chiefAim: {
    what?: string;
    byWhen?: string;
    exchange?: string;
    plan?: string;
  };
  movieId?: string;
  onOpenEditBay?: (prompt: string) => void;
  onAddToTimeline?: (data: TimelineExportData) => void;
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
  movieId,
  onOpenEditBay,
  onAddToTimeline,
}: MindMovieScriptWizardProps) {
  const [step, setStep] = useState(1);
  const [visualStyle, setVisualStyle] = useState("cinematic");
  const [userDescription, setUserDescription] = useState("");
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [generatedScenes, setGeneratedScenes] = useState<Scene[]>([]);
  const [isAddingScenes, setIsAddingScenes] = useState(false);
  const [regeneratingSceneOrder, setRegeneratingSceneOrder] = useState<number | null>(null);
  const [savedPersonas, setSavedPersonas] = useState<SavedPersona[]>([]);
  const [songCount, setSongCount] = useState<1 | 2>(1);
  
  const { 
    isGenerating, 
    isLoading,
    currentScript,
    generateStoryboard, 
    saveScript,
    fetchLatestScript,
    fetchScriptById,
  } = useMindMovieScript();

  const {
    isGeneratingLyrics,
    isGeneratingMusic,
    generatedLyrics,
    soundtrackUrl,
    songs,
    musicStyle,
    customStyleText,
    vocalGender,
    personaId,
    generationStatus,
    isSavedToLibrary,
    setMusicStyle,
    setCustomStyleText,
    setVocalGender,
    setPersonaId,
    setGeneratedLyrics,
    generateLyrics,
    generateMusic,
    regenerateMusic,
    saveLyrics,
    saveToLibrary,
    loadExistingMusic,
  } = useMindMovieMusic();

  // Load saved personas on mount
  useEffect(() => {
    setSavedPersonas(loadSavedPersonas());
  }, []);

  // Load script based on movieId or fetch latest
  useEffect(() => {
    if (isOpen) {
      const loadScript = async () => {
        let script = null;
        
        if (movieId) {
          script = await fetchScriptById(movieId);
        } else {
          script = await fetchLatestScript();
        }
        
        if (script && script.scenes.length > 0) {
          setGeneratedTitle(script.title || "");
          setGeneratedScenes(script.scenes);
          setVisualStyle(script.visual_style || "cinematic");
          // Load existing music data
          loadExistingMusic({
            song_lyrics: script.song_lyrics,
            soundtrack_url: script.soundtrack_url,
            music_style: script.music_style,
            suno_task_id: script.suno_task_id,
          });
          setStep(3);
        } else {
          // Reset to step 1 for new movies
          setStep(1);
          setGeneratedTitle("");
          setGeneratedScenes([]);
          setVisualStyle("cinematic");
          setUserDescription("");
        }
      };
      loadScript();
    }
  }, [isOpen, movieId, fetchLatestScript, fetchScriptById, loadExistingMusic]);

  const handleSelectPersona = useCallback((persona: SavedPersona) => {
    setPersonaId(persona.id);
    savePersonaToStorage(persona.id, persona.label);
    setSavedPersonas(loadSavedPersonas());
  }, [setPersonaId]);

  const handleSaveCurrentPersona = useCallback(() => {
    if (personaId.trim()) {
      const label = prompt('Enter a name for this persona:', `Persona ${savedPersonas.length + 1}`);
      if (label) {
        savePersonaToStorage(personaId.trim(), label);
        setSavedPersonas(loadSavedPersonas());
        toast.success('Persona saved!');
      }
    }
  }, [personaId, savedPersonas.length]);

  const handleRemovePersona = useCallback((personaIdToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removePersonaFromStorage(personaIdToRemove);
    setSavedPersonas(loadSavedPersonas());
    toast.success('Persona removed');
  }, []);

  const handleGenerateStoryboard = async (addScenes = false) => {
    if (addScenes) {
      setIsAddingScenes(true);
    }
    const existingScenes = addScenes ? generatedScenes : undefined;
    const result = await generateStoryboard(chiefAim, visualStyle, userDescription, existingScenes);
    if (result) {
      if (addScenes && generatedScenes.length > 0) {
        // Merge new scenes with existing, adjusting order numbers
        const maxOrder = Math.max(...generatedScenes.map(s => s.order));
        const newScenes = result.scenes.map((s, i) => ({
          ...s,
          order: maxOrder + i + 1,
        }));
        setGeneratedScenes([...generatedScenes, ...newScenes]);
        setGeneratedTitle(result.title || generatedTitle);
      } else {
        setGeneratedTitle(result.title);
        setGeneratedScenes(result.scenes);
      }
      // Stay on step 2 to show approval controls
    }
    setIsAddingScenes(false);
  };

  const handleApproveStoryboard = async () => {
    await saveScript(
      generatedTitle,
      generatedScenes,
      chiefAim,
      visualStyle,
      currentScript?.id
    );
    setStep(3);
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

  const handleRegenerateScene = async (sceneOrder: number) => {
    const sceneToRegenerate = generatedScenes.find(s => s.order === sceneOrder);
    if (!sceneToRegenerate) return;

    setRegeneratingSceneOrder(sceneOrder);
    try {
      // Generate a single new scene by calling the storyboard generator with context
      const result = await generateStoryboard(
        chiefAim, 
        visualStyle, 
        `Regenerate scene ${sceneOrder} with title "${sceneToRegenerate.title}". Original narrative: ${sceneToRegenerate.narrative}. Create a fresh take on this scene while keeping the same emotional journey.`,
        undefined
      );
      
      if (result && result.scenes.length > 0) {
        // Replace the specific scene with the first generated scene, keeping the order
        const newScene = { ...result.scenes[0], order: sceneOrder };
        setGeneratedScenes((prev) =>
          prev.map((scene) => (scene.order === sceneOrder ? newScene : scene))
        );
        toast.success(`Scene ${sceneOrder} regenerated!`);
      }
    } catch (error) {
      console.error("Error regenerating scene:", error);
      toast.error("Failed to regenerate scene");
    } finally {
      setRegeneratingSceneOrder(null);
    }
  };

  const handleDeleteScene = (sceneOrder: number) => {
    if (generatedScenes.length <= 1) {
      toast.error("You need at least one scene in your storyboard");
      return;
    }
    
    setGeneratedScenes((prev) => {
      const filtered = prev.filter((scene) => scene.order !== sceneOrder);
      // Renumber remaining scenes
      return filtered.map((scene, index) => ({
        ...scene,
        order: index + 1,
      }));
    });
    toast.success("Scene deleted");
  };

  const handleGenerateLyrics = async () => {
    if (!musicStyle) {
      toast.error("Please select a music style first");
      return;
    }

    if (musicStyle === 'Custom' && !customStyleText.trim()) {
      toast.error("Please describe your custom music style");
      return;
    }
    
    const scenesForLyrics = generatedScenes.map(s => ({
      order: s.order,
      title: s.title,
      narrative: s.narrative,
      emotional_tone: s.emotionalTone,
    }));

    await generateLyrics(
      {
        what: chiefAim.what || "",
        byWhen: chiefAim.byWhen || "",
        exchange: chiefAim.exchange || "",
        plan: chiefAim.plan || "",
      },
      scenesForLyrics,
      musicStyle,
      customStyleText.trim() || undefined
    );
  };

  const handleGenerateMusic = async () => {
    if (!generatedLyrics || !currentScript) {
      toast.error("Please generate lyrics first and save your storyboard");
      return;
    }
    await generateMusic(generatedLyrics, generatedTitle || "My Mind Movie", currentScript.id, customStyleText.trim() || undefined, songCount);
  };

  const handleRegenerateMusic = async () => {
    if (!generatedLyrics || !currentScript) {
      toast.error("Please generate lyrics first and save your storyboard");
      return;
    }
    await regenerateMusic(generatedLyrics, generatedTitle || "My Mind Movie", currentScript.id, customStyleText.trim() || undefined, songCount);
  };


  const handleSaveLyrics = async () => {
    if (!currentScript || !generatedLyrics) return;
    await saveLyrics(currentScript.id, generatedLyrics);
  };

  const handleAddToTimeline = useCallback(() => {
    if (generatedScenes.length === 0) {
      toast.error("Please generate scenes first");
      return;
    }
    
    // Get the best available soundtrack URL
    const bestSoundtrack = songs.length > 0 
      ? songs.find(s => s.soundtrackUrl)?.soundtrackUrl 
      : soundtrackUrl;
    
    if (onAddToTimeline) {
      onAddToTimeline({
        scenes: generatedScenes,
        soundtrackUrl: bestSoundtrack,
        title: generatedTitle,
      });
      onClose();
      toast.success("Adding scenes to timeline...");
    } else {
      toast.error("Timeline feature not available");
    }
  }, [generatedScenes, songs, soundtrackUrl, generatedTitle, onAddToTimeline, onClose]);

  if (!isOpen) return null;

  const totalSteps = 4;

  // Lock body scroll when wizard is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  return (
    <div className="fixed inset-0 z-50 w-screen h-[100dvh] bg-background/95 backdrop-blur-sm">
      <div className="h-[100dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Clapperboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Mind Movie Script Writer</h1>
              <p className="text-sm text-muted-foreground">
                Create your visual storyboard and soundtrack from your Definite Chief Aim
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
                { num: 4, label: "Soundtrack", icon: Music },
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
          <Progress value={(step / totalSteps) * 100} className="h-1" />
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-6 max-w-4xl mx-auto pb-[env(safe-area-inset-bottom)]">
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

            {/* Step 2: Generating / Review */}
            {step === 2 && (
              <div className="space-y-6">
                {isGenerating && !isAddingScenes ? (
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
                ) : generatedScenes.length > 0 ? (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Review Your Storyboard</h2>
                      <p className="text-muted-foreground">
                        {generatedScenes.length} scenes generated. Review and approve, or regenerate for a different take.
                      </p>
                    </div>

                    {/* Storyboard Preview */}
                    <StoryboardGrid
                      scenes={generatedScenes}
                      onUpdateScene={handleUpdateScene}
                      onGenerateInEditBay={handleGenerateInEditBay}
                      onRegenerateScene={handleRegenerateScene}
                      onDeleteScene={handleDeleteScene}
                      regeneratingSceneOrder={regeneratingSceneOrder}
                      isEditable={true}
                    />

                    {/* Adding Scenes Loading Indicator */}
                    {isAddingScenes && (
                      <div className="flex items-center justify-center gap-3 p-6 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Plus className="w-4 h-4 text-primary animate-pulse" />
                        </div>
                        <div>
                          <p className="font-medium text-primary">Adding more scenes...</p>
                          <p className="text-sm text-muted-foreground">New scenes will appear below</p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-border/50">
                      <Button
                        onClick={handleApproveStoryboard}
                        disabled={isLoading || isAddingScenes}
                        className="flex-1 sm:flex-none"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {isLoading ? "Saving..." : "Approve & Save"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleGenerateStoryboard(false)}
                        disabled={isGenerating || isAddingScenes}
                        className="flex-1 sm:flex-none"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleGenerateStoryboard(true)}
                        disabled={isGenerating || isAddingScenes}
                        className="flex-1 sm:flex-none"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {isAddingScenes ? "Adding..." : "Add More Scenes"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 space-y-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold mb-2">Ready to Generate</h2>
                      <p className="text-muted-foreground">
                        Click the button below to create your storyboard.
                      </p>
                    </div>
                  </div>
                )}
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
                  <div className="flex gap-2">
                    {onAddToTimeline && (
                      <Button 
                        onClick={handleAddToTimeline} 
                        variant="outline"
                        disabled={generatedScenes.length === 0}
                      >
                        <Film className="w-4 h-4 mr-2" />
                        Add to Timeline
                      </Button>
                    )}
                    <Button onClick={handleSaveStoryboard} disabled={isLoading}>
                      <Save className="w-4 h-4 mr-2" />
                      {isLoading ? "Saving..." : "Save Storyboard"}
                    </Button>
                  </div>
                </div>

                <StoryboardGrid
                  scenes={generatedScenes}
                  onUpdateScene={handleUpdateScene}
                  onGenerateInEditBay={handleGenerateInEditBay}
                  onRegenerateScene={handleRegenerateScene}
                  onDeleteScene={handleDeleteScene}
                  regeneratingSceneOrder={regeneratingSceneOrder}
                  isEditable={true}
                />
              </div>
            )}

            {/* Step 4: Soundtrack */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Create Your Soundtrack</h2>
                  <p className="text-muted-foreground">
                    Generate personalized lyrics from your Chief Aim, then create your Mind Movie anthem.
                  </p>
                </div>

                {/* Music Style Selection with Categories */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Choose Your Music Style</Label>
                  
                  <RadioGroup
                    value={musicStyle || ""}
                    onValueChange={(val) => setMusicStyle(val as MusicStyle)}
                    className="space-y-4"
                  >
                    {/* Hip-Hop/Rap */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Hip-Hop & Rap</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {MUSIC_STYLES.filter(s => s.category === 'hip-hop').map((style) => (
                          <Label
                            key={style.value}
                            htmlFor={`style-${style.value}`}
                            className={`flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              musicStyle === style.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <RadioGroupItem value={style.value} id={`style-${style.value}`} className="sr-only" />
                            <span className="font-medium text-sm">{style.label}</span>
                            <span className="text-xs text-muted-foreground">{style.description}</span>
                          </Label>
                        ))}
                      </div>
                    </div>

                    {/* Pop & Electronic */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Pop & Electronic</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {MUSIC_STYLES.filter(s => s.category === 'pop-electronic').map((style) => (
                          <Label
                            key={style.value}
                            htmlFor={`style-${style.value}`}
                            className={`flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              musicStyle === style.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <RadioGroupItem value={style.value} id={`style-${style.value}`} className="sr-only" />
                            <span className="font-medium text-sm">{style.label}</span>
                            <span className="text-xs text-muted-foreground">{style.description}</span>
                          </Label>
                        ))}
                      </div>
                    </div>

                    {/* Orchestral & Cinematic */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Orchestral & Cinematic</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {MUSIC_STYLES.filter(s => s.category === 'orchestral').map((style) => (
                          <Label
                            key={style.value}
                            htmlFor={`style-${style.value}`}
                            className={`flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              musicStyle === style.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <RadioGroupItem value={style.value} id={`style-${style.value}`} className="sr-only" />
                            <span className="font-medium text-sm">{style.label}</span>
                            <span className="text-xs text-muted-foreground">{style.description}</span>
                          </Label>
                        ))}
                      </div>
                    </div>

                    {/* Rock & Alternative */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Rock & Alternative</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {MUSIC_STYLES.filter(s => s.category === 'rock').map((style) => (
                          <Label
                            key={style.value}
                            htmlFor={`style-${style.value}`}
                            className={`flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              musicStyle === style.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <RadioGroupItem value={style.value} id={`style-${style.value}`} className="sr-only" />
                            <span className="font-medium text-sm">{style.label}</span>
                            <span className="text-xs text-muted-foreground">{style.description}</span>
                          </Label>
                        ))}
                      </div>
                    </div>

                    {/* R&B & Soul */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">R&B & Soul</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {MUSIC_STYLES.filter(s => s.category === 'rnb-soul').map((style) => (
                          <Label
                            key={style.value}
                            htmlFor={`style-${style.value}`}
                            className={`flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              musicStyle === style.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <RadioGroupItem value={style.value} id={`style-${style.value}`} className="sr-only" />
                            <span className="font-medium text-sm">{style.label}</span>
                            <span className="text-xs text-muted-foreground">{style.description}</span>
                          </Label>
                        ))}
                      </div>
                    </div>

                    {/* Jazz & Blues */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Jazz & Blues</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {MUSIC_STYLES.filter(s => s.category === 'jazz-blues').map((style) => (
                          <Label
                            key={style.value}
                            htmlFor={`style-${style.value}`}
                            className={`flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              musicStyle === style.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <RadioGroupItem value={style.value} id={`style-${style.value}`} className="sr-only" />
                            <span className="font-medium text-sm">{style.label}</span>
                            <span className="text-xs text-muted-foreground">{style.description}</span>
                          </Label>
                        ))}
                      </div>
                    </div>

                    {/* Folk & Country */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Folk & Country</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {MUSIC_STYLES.filter(s => s.category === 'folk-country').map((style) => (
                          <Label
                            key={style.value}
                            htmlFor={`style-${style.value}`}
                            className={`flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              musicStyle === style.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <RadioGroupItem value={style.value} id={`style-${style.value}`} className="sr-only" />
                            <span className="font-medium text-sm">{style.label}</span>
                            <span className="text-xs text-muted-foreground">{style.description}</span>
                          </Label>
                        ))}
                      </div>
                    </div>

                    {/* Gospel & Spiritual */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Gospel & Spiritual</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {MUSIC_STYLES.filter(s => s.category === 'gospel').map((style) => (
                          <Label
                            key={style.value}
                            htmlFor={`style-${style.value}`}
                            className={`flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              musicStyle === style.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <RadioGroupItem value={style.value} id={`style-${style.value}`} className="sr-only" />
                            <span className="font-medium text-sm">{style.label}</span>
                            <span className="text-xs text-muted-foreground">{style.description}</span>
                          </Label>
                        ))}
                      </div>
                    </div>

                    {/* World & Latin */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">World & Latin</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {MUSIC_STYLES.filter(s => s.category === 'world').map((style) => (
                          <Label
                            key={style.value}
                            htmlFor={`style-${style.value}`}
                            className={`flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              musicStyle === style.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <RadioGroupItem value={style.value} id={`style-${style.value}`} className="sr-only" />
                            <span className="font-medium text-sm">{style.label}</span>
                            <span className="text-xs text-muted-foreground">{style.description}</span>
                          </Label>
                        ))}
                      </div>
                    </div>

                    {/* Custom Style */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Custom</p>
                      <div className="grid grid-cols-1 gap-2">
                        {MUSIC_STYLES.filter(s => s.category === 'custom').map((style) => (
                          <Label
                            key={style.value}
                            htmlFor={`style-${style.value}`}
                            className={`flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              musicStyle === style.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <RadioGroupItem value={style.value} id={`style-${style.value}`} className="sr-only" />
                            <span className="font-medium text-sm">{style.label}</span>
                            <span className="text-xs text-muted-foreground">{style.description}</span>
                          </Label>
                        ))}
                      </div>
                    </div>
                  </RadioGroup>

                  {/* Custom Style Description Input */}
                  {musicStyle === 'Custom' && (
                    <div className="mt-4 p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                      <Label htmlFor="custom-style" className="text-sm font-semibold">
                        Describe Your Custom Music Style
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Describe the genre, mood, instruments, tempo, and any specific artists or songs to inspire the sound.
                      </p>
                      <Textarea
                        id="custom-style"
                        placeholder="e.g., Upbeat funk with slap bass, horn section, and 80s disco vibes. Inspired by Earth, Wind & Fire. 120 BPM, major key, celebratory feel..."
                        value={customStyleText}
                        onChange={(e) => setCustomStyleText(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                  )}
                </div>

                {/* Vocal Gender Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Vocal Style</Label>
                  <RadioGroup
                    value={vocalGender}
                    onValueChange={(val) => setVocalGender(val as 'm' | 'f')}
                    className="flex gap-4"
                  >
                    <Label
                      htmlFor="vocal-m"
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        vocalGender === 'm'
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value="m" id="vocal-m" className="sr-only" />
                      <span className="font-medium">Male Voice</span>
                    </Label>
                    <Label
                      htmlFor="vocal-f"
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        vocalGender === 'f'
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value="f" id="vocal-f" className="sr-only" />
                      <span className="font-medium">Female Voice</span>
                    </Label>
                  </RadioGroup>
                </div>

                {/* Custom Persona ID (Advanced) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="persona-id" className="text-base font-semibold">Custom Voice Persona (Optional)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground">
                            <HelpCircle className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs p-3 bg-popover border border-border z-50">
                          <div className="space-y-2 text-sm">
                            <p className="font-medium">What is a Suno Persona?</p>
                            <p className="text-muted-foreground">
                              A Persona ID lets you use a custom voice for your soundtrack. You can create one by:
                            </p>
                            <ol className="list-decimal list-inside text-muted-foreground space-y-1 text-xs">
                              <li>Go to Suno.com and sign in</li>
                              <li>Navigate to "Personas" in your library</li>
                              <li>Create a new persona or select an existing one</li>
                              <li>Copy the persona ID from the URL or settings</li>
                            </ol>
                            <a 
                              href="https://suno.com/library" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline text-xs mt-2"
                            >
                              Open Suno Library
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter a Suno persona ID to use your custom voice, or select from your saved personas. Leave empty to use the selected vocal style above.
                  </p>
                  {personaId.trim() && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
                      <strong>Note:</strong> Custom persona will use its own voice, overriding the Male/Female selection above.
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        id="persona-id"
                        placeholder="e.g., 5b650802-2e77-4f1c-b6ad-a73401c3456d"
                        value={personaId}
                        onChange={(e) => setPersonaId(e.target.value)}
                        className="font-mono text-sm pr-10"
                      />
                    </div>
                    
                    {/* Saved Personas Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="shrink-0">
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-72 bg-popover border border-border z-50">
                        <DropdownMenuLabel>Saved Personas</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {savedPersonas.length === 0 ? (
                          <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                            No saved personas yet.
                            <br />
                            <span className="text-xs">Enter a persona ID and save it for quick access.</span>
                          </div>
                        ) : (
                          savedPersonas.map((persona) => (
                            <DropdownMenuItem
                              key={persona.id}
                              onClick={() => handleSelectPersona(persona)}
                              className="flex items-center justify-between cursor-pointer"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{persona.label}</div>
                                <div className="text-xs text-muted-foreground font-mono truncate">
                                  {persona.id.substring(0, 12)}...
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 ml-2 hover:bg-destructive/10 hover:text-destructive"
                                onClick={(e) => handleRemovePersona(persona.id, e)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </DropdownMenuItem>
                          ))
                        )}
                        {personaId.trim() && !savedPersonas.some(p => p.id === personaId.trim()) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleSaveCurrentPersona} className="cursor-pointer">
                              <Save className="w-4 h-4 mr-2" />
                              Save Current Persona
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Quick save button when new persona entered */}
                  {personaId.trim() && !savedPersonas.some(p => p.id === personaId.trim()) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveCurrentPersona}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Save this persona for quick access
                    </Button>
                  )}
                </div>

                {/* Generate Lyrics Button */}
                {!generatedLyrics && (
                  <Button
                    onClick={handleGenerateLyrics}
                    disabled={!musicStyle || isGeneratingLyrics}
                    className="w-full"
                    size="lg"
                  >
                    {isGeneratingLyrics ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Writing Lyrics...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Lyrics from Chief Aim
                      </>
                    )}
                  </Button>
                )}

                {/* Lyrics Editor */}
                {(generatedLyrics || isGeneratingLyrics) && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Your Lyrics</h3>
                    <LyricsEditor
                      lyrics={generatedLyrics || ""}
                      onChange={setGeneratedLyrics}
                      onRegenerate={handleGenerateLyrics}
                      onSave={handleSaveLyrics}
                      isGenerating={isGeneratingLyrics}
                    />
                  </div>
                )}

                {/* Song Count Selection */}
                {generatedLyrics && !soundtrackUrl && !isGeneratingMusic && songs.length === 0 && (
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Number of Songs to Generate</Label>
                    <RadioGroup
                      value={String(songCount)}
                      onValueChange={(val) => setSongCount(Number(val) as 1 | 2)}
                      className="flex gap-4"
                    >
                      <Label
                        htmlFor="song-1"
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          songCount === 1
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <RadioGroupItem value="1" id="song-1" className="sr-only" />
                        <span className="font-medium">1 Song</span>
                      </Label>
                      <Label
                        htmlFor="song-2"
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          songCount === 2
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <RadioGroupItem value="2" id="song-2" className="sr-only" />
                        <span className="font-medium">2 Songs</span>
                        <span className="text-xs text-muted-foreground">(More variety)</span>
                      </Label>
                    </RadioGroup>
                  </div>
                )}

                {/* Generate Music Button */}
                {generatedLyrics && !soundtrackUrl && !isGeneratingMusic && songs.length === 0 && (
                  <Button
                    onClick={handleGenerateMusic}
                    disabled={isGeneratingMusic || !currentScript}
                    className="w-full"
                    size="lg"
                    variant="default"
                  >
                    <Music className="w-4 h-4 mr-2" />
                    Generate {songCount} Soundtrack{songCount > 1 ? 's' : ''} with Suno AI
                  </Button>
                )}

                {/* Music Generation Status / Player */}
                {(isGeneratingMusic || soundtrackUrl || songs.length > 0) && (
                  <div className="space-y-4">
                    {songs.length > 1 ? (
                      // Multiple songs display
                      songs.map((song, index) => (
                        <SoundtrackPlayer
                          key={index}
                          audioUrl={song.soundtrackUrl || ""}
                          title={`${generatedTitle || "Mind Movie Anthem"} (Version ${index + 1})`}
                          isGenerating={isGeneratingMusic && !song.soundtrackUrl}
                          generationStatus={song.generationStatus}
                          onSaveToLibrary={() => saveToLibrary(generatedTitle || "Mind Movie Anthem", generatedLyrics || "", index)}
                          isSavedToLibrary={song.isSavedToLibrary}
                        />
                      ))
                    ) : (
                      // Single song display (backward compatible)
                      <SoundtrackPlayer
                        audioUrl={soundtrackUrl || ""}
                        title={generatedTitle || "Mind Movie Anthem"}
                        isGenerating={isGeneratingMusic}
                        generationStatus={generationStatus}
                        onSaveToLibrary={() => saveToLibrary(generatedTitle || "Mind Movie Anthem", generatedLyrics || "")}
                        isSavedToLibrary={isSavedToLibrary}
                      />
                    )}
                    
                    {/* Regenerate Button - only show when soundtrack exists and not generating */}
                    {(soundtrackUrl || songs.some(s => s.soundtrackUrl)) && !isGeneratingMusic && (
                      <Button
                        onClick={handleRegenerateMusic}
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={!currentScript}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate {songCount} Song{songCount > 1 ? 's' : ''} with {personaId.trim() ? 'Custom Persona' : 'Current Settings'}
                      </Button>
                    )}
                  </div>
                )}

                {!currentScript && generatedLyrics && (
                  <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
                    ⚠️ Please save your storyboard first (Step 3) before generating the soundtrack.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

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

            {step === 2 && isGenerating && (
              <Button disabled>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </Button>
            )}

            {step === 2 && !isGenerating && generatedScenes.length === 0 && (
              <Button
                onClick={() => handleGenerateStoryboard(false)}
                disabled={isGenerating}
              >
                Generate Storyboard
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            )}

            {step === 2 && !isGenerating && generatedScenes.length > 0 && (
              <Button onClick={handleApproveStoryboard} disabled={isLoading}>
                <Check className="w-4 h-4 mr-2" />
                {isLoading ? "Saving..." : "Approve & Continue"}
              </Button>
            )}

            {step === 3 && (
              <Button onClick={() => setStep(4)}>
                Continue to Soundtrack
                <Music className="w-4 h-4 ml-2" />
              </Button>
            )}

            {step === 4 && (
              <div className="flex gap-2">
                {onAddToTimeline && (
                  <Button 
                    onClick={handleAddToTimeline}
                    variant="default"
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  >
                    <Film className="w-4 h-4 mr-2" />
                    Add All to Timeline
                  </Button>
                )}
                <Button onClick={onClose} variant="outline">
                  Done
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
