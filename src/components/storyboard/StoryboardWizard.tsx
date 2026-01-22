import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useGlobalReferencePhoto } from "@/hooks/useGlobalReferencePhoto";
import { useMindMovieScript, Scene } from "@/hooks/useMindMovieScript";
import { useMediaGeneration } from "@/hooks/useMediaGeneration";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Wand2, 
  Sparkles, 
  Image as ImageIcon, 
  Video, 
  Play, 
  Check, 
  RefreshCw, 
  Trash2, 
  Plus,
  ChevronRight,
  ChevronLeft,
  Film,
  Clapperboard,
  Clock,
  Upload,
  Loader2,
  X,
  ArrowRight,
  Music,
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StoryboardSceneCard } from "./StoryboardSceneCard";
import { StoryboardQuestionFlow } from "./StoryboardQuestionFlow";

export interface StoryboardWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToTimeline?: (scenes: Scene[]) => void;
  chiefAim?: {
    what: string;
    byWhen: string;
    exchange: string;
    plan: string;
  };
}

type WizardStep = "vision" | "generate" | "images" | "videos" | "complete";

const VISUAL_STYLES = [
  { id: "cinematic-dramatic", label: "Cinematic Dramatic", description: "Bold shadows, epic compositions" },
  { id: "ethereal-dreamy", label: "Ethereal Dreamy", description: "Soft, glowing, magical atmosphere" },
  { id: "golden-luxe", label: "Golden Luxe", description: "Warm, wealthy, abundant feeling" },
  { id: "modern-minimal", label: "Modern Minimal", description: "Clean, sophisticated, contemporary" },
  { id: "nature-organic", label: "Nature Organic", description: "Natural light, earthly tones" },
  { id: "urban-gritty", label: "Urban Gritty", description: "City lights, street energy" },
];

export function StoryboardWizard({ isOpen, onClose, onAddToTimeline, chiefAim }: StoryboardWizardProps) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { referencePhotoUrl, isLoading: loadingRef } = useGlobalReferencePhoto();
  const { generateStoryboard, saveScript, isGenerating, currentScript, setCurrentScript } = useMindMovieScript();
  const { generateImage, generateVideo, isGeneratingImage, isGeneratingVideo } = useMediaGeneration();

  const [step, setStep] = useState<WizardStep>("vision");
  const [visualStyle, setVisualStyle] = useState("cinematic-dramatic");
  const [targetDuration, setTargetDuration] = useState(120); // 2 minutes default
  const [visionAnswers, setVisionAnswers] = useState<Record<string, string>>({});
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [title, setTitle] = useState("");
  const [generatingSceneIndex, setGeneratingSceneIndex] = useState<number | null>(null);
  const [animatingSceneIndex, setAnimatingSceneIndex] = useState<number | null>(null);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchAnimating, setBatchAnimating] = useState(false);

  // Calculate scene count based on duration (8 seconds per clip)
  const sceneCount = Math.ceil(targetDuration / 8);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setStep("vision");
      setScenes([]);
      setTitle("");
      setVisionAnswers({});
      setCurrentScript(null);
    }
  }, [isOpen, setCurrentScript]);

  const handleGenerateStoryboard = async () => {
    if (!chiefAim?.what) {
      toast.error("Please complete your Definite Chief Aim first");
      return;
    }

    const userDescription = Object.values(visionAnswers).filter(Boolean).join(". ");
    
    const result = await generateStoryboard(
      chiefAim,
      visualStyle,
      userDescription,
      undefined,
      undefined,
      false,
      undefined
    );

    if (result) {
      setTitle(result.title);
      setScenes(result.scenes);
      setStep("generate");
      toast.success("Storyboard generated! Review your scenes.");
    }
  };

  const handleGenerateImage = async (sceneIndex: number) => {
    const scene = scenes[sceneIndex];
    if (!scene) return;

    setGeneratingSceneIndex(sceneIndex);
    try {
      const imageUrl = await generateImage({
        prompt: scene.prompt,
        aspect_ratio: "16:9",
        resolution: "2k",
        model: "nano-banana-pro",
        images: referencePhotoUrl ? [referencePhotoUrl] : undefined,
      });

      if (imageUrl) {
        const updatedScenes = [...scenes];
        updatedScenes[sceneIndex] = { ...scene, generatedImageUrl: imageUrl };
        setScenes(updatedScenes);
        toast.success(`Image generated for Scene ${sceneIndex + 1}`);
      }
    } catch (error) {
      console.error("Image generation error:", error);
      toast.error("Failed to generate image");
    } finally {
      setGeneratingSceneIndex(null);
    }
  };

  const handleAnimateScene = async (sceneIndex: number) => {
    const scene = scenes[sceneIndex];
    if (!scene?.generatedImageUrl) {
      toast.error("Generate an image first");
      return;
    }

    setAnimatingSceneIndex(sceneIndex);
    try {
      const videoUrl = await generateVideo({
        model: "wan-ai/wan2.1-i2v-480p",
        prompt: scene.narrative,
        duration: 8,
        image: scene.generatedImageUrl,
      });

      if (videoUrl) {
        const updatedScenes = [...scenes];
        updatedScenes[sceneIndex] = { ...scene, generatedVideoUrl: videoUrl };
        setScenes(updatedScenes);
        toast.success(`Video created for Scene ${sceneIndex + 1}`);
      }
    } catch (error) {
      console.error("Video generation error:", error);
      toast.error("Failed to create video");
    } finally {
      setAnimatingSceneIndex(null);
    }
  };

  const handleBatchGenerateImages = async () => {
    setBatchGenerating(true);
    const scenesWithoutImages = scenes.filter(s => !s.generatedImageUrl);
    
    for (let i = 0; i < scenes.length; i++) {
      if (!scenes[i].generatedImageUrl) {
        await handleGenerateImage(i);
      }
    }
    
    setBatchGenerating(false);
    toast.success("All images generated!");
  };

  const handleBatchAnimateAll = async () => {
    setBatchAnimating(true);
    const scenesWithImages = scenes.filter(s => s.generatedImageUrl && !s.generatedVideoUrl);
    
    for (let i = 0; i < scenes.length; i++) {
      if (scenes[i].generatedImageUrl && !scenes[i].generatedVideoUrl) {
        await handleAnimateScene(i);
      }
    }
    
    setBatchAnimating(false);
    setStep("complete");
    toast.success("All videos created!");
  };

  const handleDeleteScene = (index: number) => {
    const updatedScenes = scenes.filter((_, i) => i !== index).map((scene, i) => ({
      ...scene,
      order: i + 1,
    }));
    setScenes(updatedScenes);
  };

  const handleRegenerateScene = async (index: number) => {
    // Clear the generated media for this scene
    const updatedScenes = [...scenes];
    updatedScenes[index] = {
      ...updatedScenes[index],
      generatedImageUrl: null,
      generatedVideoUrl: null,
    };
    setScenes(updatedScenes);
    await handleGenerateImage(index);
  };

  const handleAddToTimelineClick = async () => {
    if (onAddToTimeline) {
      // Save the script first
      const savedScript = await saveScript(
        title,
        scenes,
        chiefAim || null,
        visualStyle
      );

      if (savedScript) {
        onAddToTimeline(scenes);
        toast.success("Scenes added to timeline!");
        onClose();
      }
    }
  };

  const handleSaveAndClose = async () => {
    const savedScript = await saveScript(
      title,
      scenes,
      chiefAim || null,
      visualStyle
    );

    if (savedScript) {
      toast.success("Storyboard saved!");
      onClose();
    }
  };

  const imagesGenerated = scenes.filter(s => s.generatedImageUrl).length;
  const videosGenerated = scenes.filter(s => s.generatedVideoUrl).length;
  const allImagesReady = imagesGenerated === scenes.length;
  const allVideosReady = videosGenerated === scenes.length;

  const stepConfig = {
    vision: { title: "Define Your Vision", description: "Answer a few questions to shape your movie" },
    generate: { title: "Review Storyboard", description: "AI-generated scenes based on your vision" },
    images: { title: "Generate Visuals", description: "Create images for each scene" },
    videos: { title: "Animate Scenes", description: "Bring your images to life" },
    complete: { title: "Complete", description: "Your storyboard is ready!" },
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0 gap-0">
        {/* Header */}
        <div className="p-6 border-b border-border/50 bg-gradient-to-r from-gold/10 via-transparent to-amber-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center">
                <Clapperboard className="w-6 h-6 text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-display tracking-wide">{stepConfig[step].title}</h2>
                <p className="text-sm text-muted-foreground">{stepConfig[step].description}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress */}
          <div className="mt-4 flex items-center gap-2">
            {(["vision", "generate", "images", "videos", "complete"] as WizardStep[]).map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    step === s
                      ? "bg-gold text-black"
                      : (["vision", "generate", "images", "videos", "complete"].indexOf(step) > i)
                      ? "bg-gold/30 text-gold"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {i + 1}
                </div>
                {i < 4 && (
                  <div className={cn(
                    "w-8 h-0.5 mx-1",
                    (["vision", "generate", "images", "videos", "complete"].indexOf(step) > i) ? "bg-gold/50" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 max-h-[calc(90vh-200px)]">
          <div className="p-6">
            {/* Step: Vision */}
            {step === "vision" && (
              <div className="space-y-6">
                {/* Duration slider */}
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gold" />
                      <span className="font-medium">Movie Duration</span>
                    </div>
                    <Badge variant="secondary">{Math.floor(targetDuration / 60)}:{(targetDuration % 60).toString().padStart(2, '0')}</Badge>
                  </div>
                  <Slider
                    value={[targetDuration]}
                    onValueChange={([val]) => setTargetDuration(val)}
                    min={60}
                    max={180}
                    step={30}
                    className="my-4"
                  />
                  <p className="text-sm text-muted-foreground">
                    {sceneCount} scenes × 8 seconds each = {Math.floor(targetDuration / 60)}:{(targetDuration % 60).toString().padStart(2, '0')} movie
                  </p>
                </div>

                {/* Visual Style */}
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Film className="w-5 h-5 text-gold" />
                    <span className="font-medium">Visual Style</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {VISUAL_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setVisualStyle(style.id)}
                        className={cn(
                          "p-3 rounded-lg border text-left transition-all",
                          visualStyle === style.id
                            ? "border-gold bg-gold/10"
                            : "border-border hover:border-gold/50"
                        )}
                      >
                        <p className="font-medium text-sm">{style.label}</p>
                        <p className="text-xs text-muted-foreground">{style.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vision Questions */}
                <StoryboardQuestionFlow
                  chiefAim={chiefAim}
                  onAnswersChange={setVisionAnswers}
                />

                {/* Generate Button */}
                <Button
                  onClick={handleGenerateStoryboard}
                  disabled={isGenerating || !chiefAim?.what}
                  className="w-full h-14 text-lg bg-gradient-to-r from-gold to-amber-600 hover:from-gold/90 hover:to-amber-600/90 text-black"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Storyboard...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 mr-2" />
                      Generate Storyboard
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Step: Review Generated Storyboard */}
            {step === "generate" && (
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Movie Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3 rounded-lg border border-border bg-background/50"
                    placeholder="Your Mind Movie title..."
                  />
                </div>

                {/* Scene Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scenes.map((scene, index) => (
                    <StoryboardSceneCard
                      key={scene.order}
                      scene={scene}
                      index={index}
                      onDelete={() => handleDeleteScene(index)}
                      onEdit={(updates) => {
                        const updatedScenes = [...scenes];
                        updatedScenes[index] = { ...scene, ...updates };
                        setScenes(updatedScenes);
                      }}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep("vision")}>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep("images")}
                    className="flex-1 bg-gradient-to-r from-gold to-amber-600 text-black"
                  >
                    Continue to Image Generation
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step: Generate Images */}
            {step === "images" && (
              <div className="space-y-6">
                {/* Progress */}
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Images Generated</span>
                    <span className="text-gold">{imagesGenerated} / {scenes.length}</span>
                  </div>
                  <Progress value={(imagesGenerated / scenes.length) * 100} className="h-2" />
                </div>

                {/* Batch Generate */}
                <Button
                  onClick={handleBatchGenerateImages}
                  disabled={batchGenerating || allImagesReady}
                  className="w-full bg-gradient-to-r from-primary to-primary/80"
                >
                  {batchGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating All Images...
                    </>
                  ) : allImagesReady ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      All Images Ready!
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Generate All Images ({scenes.length - imagesGenerated} remaining)
                    </>
                  )}
                </Button>

                {/* Scene Grid with Image Generation */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scenes.map((scene, index) => (
                    <div key={scene.order} className="glass-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">Scene {index + 1}</Badge>
                        {scene.generatedImageUrl && <Check className="w-4 h-4 text-green-500" />}
                      </div>
                      
                      {/* Image Preview or Placeholder */}
                      <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                        {scene.generatedImageUrl ? (
                          <img
                            src={scene.generatedImageUrl}
                            alt={scene.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        )}
                      </div>

                      <p className="text-sm font-medium line-clamp-1">{scene.title}</p>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={scene.generatedImageUrl ? "outline" : "default"}
                          onClick={() => handleGenerateImage(index)}
                          disabled={generatingSceneIndex === index}
                          className="flex-1"
                        >
                          {generatingSceneIndex === index ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : scene.generatedImageUrl ? (
                            <RefreshCw className="w-4 h-4" />
                          ) : (
                            <Wand2 className="w-4 h-4" />
                          )}
                        </Button>
                        {scene.generatedImageUrl && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const updated = [...scenes];
                              updated[index] = { ...scene, generatedImageUrl: null };
                              setScenes(updated);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep("generate")}>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep("videos")}
                    disabled={!allImagesReady}
                    className="flex-1 bg-gradient-to-r from-gold to-amber-600 text-black"
                  >
                    Continue to Animation
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step: Animate to Videos */}
            {step === "videos" && (
              <div className="space-y-6">
                {/* Progress */}
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Videos Created</span>
                    <span className="text-gold">{videosGenerated} / {scenes.length}</span>
                  </div>
                  <Progress value={(videosGenerated / scenes.length) * 100} className="h-2" />
                </div>

                {/* Batch Animate */}
                <Button
                  onClick={handleBatchAnimateAll}
                  disabled={batchAnimating || allVideosReady}
                  className="w-full bg-gradient-to-r from-primary to-primary/80"
                >
                  {batchAnimating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Animating All Scenes...
                    </>
                  ) : allVideosReady ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      All Videos Ready!
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Animate All Scenes ({scenes.length - videosGenerated} remaining)
                    </>
                  )}
                </Button>

                {/* Scene Grid with Animation */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scenes.map((scene, index) => (
                    <div key={scene.order} className="glass-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">Scene {index + 1}</Badge>
                        {scene.generatedVideoUrl && <Check className="w-4 h-4 text-green-500" />}
                      </div>
                      
                      {/* Video/Image Preview */}
                      <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                        {scene.generatedVideoUrl ? (
                          <video
                            src={scene.generatedVideoUrl}
                            className="w-full h-full object-cover"
                            controls
                            muted
                          />
                        ) : scene.generatedImageUrl ? (
                          <img
                            src={scene.generatedImageUrl}
                            alt={scene.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Video className="w-8 h-8" />
                          </div>
                        )}
                      </div>

                      <p className="text-sm font-medium line-clamp-1">{scene.title}</p>
                      
                      <Button
                        size="sm"
                        variant={scene.generatedVideoUrl ? "outline" : "default"}
                        onClick={() => handleAnimateScene(index)}
                        disabled={animatingSceneIndex === index || !scene.generatedImageUrl}
                        className="w-full"
                      >
                        {animatingSceneIndex === index ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Animating...
                          </>
                        ) : scene.generatedVideoUrl ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Regenerate
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Animate
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep("images")}>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep("complete")}
                    disabled={!allVideosReady}
                    className="flex-1 bg-gradient-to-r from-gold to-amber-600 text-black"
                  >
                    Finalize Storyboard
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step: Complete */}
            {step === "complete" && (
              <div className="space-y-6 text-center py-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center mx-auto">
                  <Check className="w-10 h-10 text-black" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-display mb-2">Storyboard Complete!</h3>
                  <p className="text-muted-foreground">
                    Your {scenes.length}-scene Mind Movie is ready.
                  </p>
                </div>

                {/* Summary */}
                <div className="glass-card p-4 text-left max-w-md mx-auto">
                  <p className="font-medium mb-2">{title}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="w-4 h-4" />
                      {imagesGenerated} images
                    </span>
                    <span className="flex items-center gap-1">
                      <Video className="w-4 h-4" />
                      {videosGenerated} videos
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      ~{Math.floor(targetDuration / 60)}:{(targetDuration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    variant="outline"
                    onClick={handleSaveAndClose}
                    className="min-w-[200px]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save & Close
                  </Button>
                  {onAddToTimeline && (
                    <Button
                      onClick={handleAddToTimelineClick}
                      className="min-w-[200px] bg-gradient-to-r from-gold to-amber-600 text-black"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Add to Timeline
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
