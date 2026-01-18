import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMediaGeneration, VideoModel } from "@/hooks/useMediaGeneration";
import { toast } from "sonner";
import { 
  Film, 
  Wand2, 
  Loader2, 
  Sparkles,
  Target,
  Scissors,
  Flame,
  CheckCircle2,
  Image as ImageIcon,
  Video,
  Upload,
  X,
  Play,
  ArrowRight,
  Camera,
  RefreshCw,
  Download,
  Eye
} from "lucide-react";

interface ChallengeScene {
  order: number;
  label: string;
  description: string;
  cameraWork?: string;
  nlpOverlay?: string;
  generatedImageUrl?: string;
  generatedVideoUrl?: string;
}

interface ChallengeStoryboardWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challenge: {
    id: string;
    situation_description: string;
    emotional_trigger: string;
    target_trait: string;
    scenario_type: string;
  };
  visualizationScript?: string | object;
}

const SCENE_ICONS = [Target, Scissors, Flame, CheckCircle2];
const SCENE_COLORS = ["red", "amber", "purple", "green"] as const;

export function ChallengeStoryboardWizard({
  open,
  onOpenChange,
  challenge,
  visualizationScript
}: ChallengeStoryboardWizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<"setup" | "generate" | "preview">("setup");
  const [referencePhoto, setReferencePhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [scenes, setScenes] = useState<ChallengeScene[]>([]);
  const [generatingScenes, setGeneratingScenes] = useState(false);
  const [currentGeneratingScene, setCurrentGeneratingScene] = useState(0);
  const [selectedScene, setSelectedScene] = useState<number | null>(null);
  const [animationPrompt, setAnimationPrompt] = useState("");
  const [animationModel, setAnimationModel] = useState<VideoModel>("kling-ai/v1.0/image-to-video");

  const {
    isGeneratingImage,
    isGeneratingVideo,
    generateImage,
    generateVideo,
    estimateCreditCost
  } = useMediaGeneration();

  // Parse visualization script into scenes
  const parseVisualizationScript = useCallback(() => {
    if (!visualizationScript) return [];
    
    const labels = ["The Challenge", "The CUT! Moment", "Transformed Response", "Victory"];
    
    if (Array.isArray(visualizationScript)) {
      return visualizationScript.map((item, i) => ({
        order: i,
        label: labels[i] || `Scene ${i + 1}`,
        description: typeof item === 'string' ? item : item.description || JSON.stringify(item),
        cameraWork: item.cameraWork,
        nlpOverlay: item.nlpOverlay
      }));
    }
    
    if (typeof visualizationScript === 'string') {
      return visualizationScript.split(/\d\)/).filter(Boolean).map((desc, i) => ({
        order: i,
        label: labels[i] || `Scene ${i + 1}`,
        description: desc.trim()
      }));
    }
    
    if (typeof visualizationScript === 'object') {
      return Object.entries(visualizationScript).map(([key, val], i) => ({
        order: i,
        label: labels[i] || key,
        description: typeof val === 'string' ? val : JSON.stringify(val)
      }));
    }
    
    return [];
  }, [visualizationScript]);

  // Convert image to JPEG using canvas (handles HEIC and other unsupported formats)
  const convertToJpeg = async (file: File): Promise<{ blob: Blob; ext: string }> => {
    const originalType = file.type.toLowerCase();
    const originalName = file.name.toLowerCase();
    
    // Check if format is already supported
    const supportedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    const unsupportedExtensions = ['heic', 'heif', 'avif', 'bmp', 'tiff', 'tif'];
    
    const ext = originalName.split('.').pop() || '';
    const needsConversion = unsupportedExtensions.includes(ext) || !supportedFormats.includes(originalType);
    
    if (!needsConversion) {
      return { blob: file, ext: ext === 'jpg' ? 'jpeg' : ext };
    }
    
    // Convert to JPEG using canvas
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, ext: 'jpeg' });
            } else {
              reject(new Error('Failed to convert image'));
            }
          },
          'image/jpeg',
          0.92
        );
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for conversion. HEIC format may not be supported in this browser.'));
      };
      
      img.src = url;
    });
  };

  // Handle reference photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingPhoto(true);
    try {
      // Convert to supported format if needed (handles HEIC, etc.)
      const { blob, ext } = await convertToJpeg(file);
      const fileName = `${user.id}/storyboard-reference-${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('generated-media')
        .upload(fileName, blob, { 
          upsert: true,
          contentType: `image/${ext}`
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('generated-media')
        .getPublicUrl(fileName);

      setReferencePhoto(publicUrl);
      toast.success("Reference photo uploaded!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload photo";
      toast.error(errorMessage);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Initialize scenes from script
  const handleStartGeneration = () => {
    const parsed = parseVisualizationScript();
    if (parsed.length === 0) {
      toast.error("No visualization script available. Please generate one first.");
      return;
    }
    setScenes(parsed);
    setStep("generate");
  };

  // Generate image for a single scene
  const generateSceneImage = async (sceneIndex: number) => {
    const scene = scenes[sceneIndex];
    if (!scene) return;

    // Build cinematic prompt
    let prompt = `Cinematic scene: ${scene.description}`;
    if (scene.cameraWork) {
      prompt += ` Camera: ${scene.cameraWork}.`;
    }
    prompt += ` Style: dramatic lighting, film grain, high contrast. Character trait: ${challenge.target_trait}.`;

    const imagesToUse = referencePhoto ? [referencePhoto] : [];
    const enhancedPrompt = referencePhoto 
      ? `Generate a cinematic image featuring the person from the reference photo as the main character. ${prompt}`
      : prompt;

    const imageUrl = await generateImage({
      prompt: enhancedPrompt,
      aspect_ratio: "16:9",
      resolution: "2k",
      images: imagesToUse.length > 0 ? imagesToUse : undefined
    });

    if (imageUrl) {
      setScenes(prev => prev.map((s, i) => 
        i === sceneIndex ? { ...s, generatedImageUrl: imageUrl } : s
      ));
      return imageUrl;
    }
    return null;
  };

  // Generate all scene images
  const handleGenerateAllImages = async () => {
    setGeneratingScenes(true);
    
    for (let i = 0; i < scenes.length; i++) {
      setCurrentGeneratingScene(i);
      await generateSceneImage(i);
    }
    
    setGeneratingScenes(false);
    setCurrentGeneratingScene(0);
    setStep("preview");
    toast.success("All storyboard images generated!");
  };

  // Generate video from image
  const handleGenerateVideo = async (sceneIndex: number) => {
    const scene = scenes[sceneIndex];
    if (!scene?.generatedImageUrl || !animationPrompt.trim()) {
      toast.error("Please select an image and describe the motion");
      return;
    }

    const videoUrl = await generateVideo({
      model: animationModel,
      prompt: animationPrompt,
      image: scene.generatedImageUrl,
      duration: 5,
      resolution: "1080p",
      aspect_ratio: "16:9"
    });

    if (videoUrl) {
      setScenes(prev => prev.map((s, i) => 
        i === sceneIndex ? { ...s, generatedVideoUrl: videoUrl } : s
      ));
      toast.success("Animation created!");
      setAnimationPrompt("");
      setSelectedScene(null);
    }
  };

  // Regenerate single scene
  const handleRegenerateScene = async (sceneIndex: number) => {
    await generateSceneImage(sceneIndex);
    toast.success("Scene regenerated!");
  };

  const progress = scenes.length > 0 
    ? ((currentGeneratingScene + 1) / scenes.length) * 100 
    : 0;

  const imageToVideoModels = [
    { model: "kling-ai/v1.0/image-to-video" as VideoModel, name: "Kling 1.0", price: "60-110" },
    { model: "wan-ai/wan2.1-i2v-480p" as VideoModel, name: "Wan 2.1", price: "60-110" },
    { model: "google/veo3-fast/image-to-video" as VideoModel, name: "Veo 3 Fast", price: "60-100" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90dvh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Film className="w-5 h-5 text-gold" />
            Challenge Storyboard Production
          </DialogTitle>
          <DialogDescription>
            Create cinematic visualizations of your transformation
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto pr-2">
          {/* Setup Step */}
          {step === "setup" && (
            <div className="space-y-6 py-4">
              {/* Challenge Preview */}
              <Card className="p-4 bg-muted/50">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{challenge.situation_description}</p>
                    <p className="text-xs text-amber-400 mt-1 italic">
                      Trigger: "{challenge.emotional_trigger}"
                    </p>
                  </div>
                </div>
                <Badge className="bg-gold/20 text-gold border-gold/30">
                  {challenge.target_trait}
                </Badge>
              </Card>

              {/* Reference Photo Upload */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-gold" />
                  Your Best Self Reference Photo
                </Label>
                <p className="text-xs text-muted-foreground">
                  Upload a photo of yourself to appear in all generated scenes
                </p>
                
                {referencePhoto ? (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gold/50">
                    <img 
                      src={referencePhoto} 
                      alt="Reference" 
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => setReferencePhoto(null)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-gold/50 transition-colors">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      {uploadingPhoto ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8" />
                          <span className="text-sm">Upload photo</span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                    />
                  </label>
                )}
              </div>

              {/* Credit Estimate */}
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Estimated Cost</h4>
                    <p className="text-xs text-muted-foreground">
                      4 scenes × ~15 credits each
                    </p>
                  </div>
                  <Badge variant="outline" className="text-lg font-bold">
                    ~60 credits
                  </Badge>
                </div>
              </Card>

              <Button
                variant="gold"
                className="w-full"
                onClick={handleStartGeneration}
                disabled={!visualizationScript}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Start Storyboard Production
              </Button>
            </div>
          )}

          {/* Generation Step */}
          {step === "generate" && (
            <div className="space-y-6 py-4">
              {generatingScenes ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto text-gold mb-4" />
                    <h3 className="font-display text-lg">Generating Scene {currentGeneratingScene + 1} of {scenes.length}</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      {scenes[currentGeneratingScene]?.label}
                    </p>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-display text-lg text-center">Your Storyboard Scenes</h3>
                  
                  <div className="grid gap-3">
                    {scenes.map((scene, index) => {
                      const Icon = SCENE_ICONS[index] || Target;
                      const color = SCENE_COLORS[index] || "gold";
                      
                      return (
                        <Card key={index} className={`p-3 border-${color}-500/30 bg-${color}-500/5`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-${color}-500/20 flex items-center justify-center flex-shrink-0`}>
                              <Icon className={`w-4 h-4 text-${color}-500`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-muted-foreground uppercase">
                                {scene.label}
                              </p>
                              <p className="text-sm mt-1 line-clamp-2">{scene.description}</p>
                              {scene.cameraWork && (
                                <p className="text-xs text-primary mt-1">🎬 {scene.cameraWork}</p>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  <Button
                    variant="gold"
                    className="w-full"
                    onClick={handleGenerateAllImages}
                    disabled={isGeneratingImage}
                  >
                    {isGeneratingImage ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Generate All Scene Images
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Preview Step */}
          {step === "preview" && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg">Your Storyboard</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep("generate")}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Regenerate All
                </Button>
              </div>

              <div className="grid gap-4">
                {scenes.map((scene, index) => {
                  const Icon = SCENE_ICONS[index] || Target;
                  const color = SCENE_COLORS[index] || "gold";
                  const isSelected = selectedScene === index;
                  
                  return (
                    <Card 
                      key={index} 
                      className={`p-4 transition-all ${isSelected ? 'ring-2 ring-gold' : ''}`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-8 h-8 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 text-${color}-500`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{scene.label}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Scene {index + 1}
                        </Badge>
                      </div>

                      {scene.generatedImageUrl && (
                        <div className="relative rounded-lg overflow-hidden mb-3">
                          <img 
                            src={scene.generatedImageUrl} 
                            alt={scene.label}
                            className="w-full h-48 object-cover"
                          />
                          {scene.generatedVideoUrl && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-primary text-primary-foreground">
                                <Video className="w-3 h-3 mr-1" />
                                Animated
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}

                      {scene.generatedVideoUrl && (
                        <video 
                          src={scene.generatedVideoUrl}
                          controls
                          className="w-full rounded-lg mb-3"
                        />
                      )}

                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {scene.description}
                      </p>

                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerateScene(index)}
                          disabled={isGeneratingImage}
                        >
                          {isGeneratingImage && currentGeneratingScene === index ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3 mr-1" />
                          )}
                          Regenerate
                        </Button>
                        
                        {scene.generatedImageUrl && !scene.generatedVideoUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedScene(isSelected ? null : index)}
                            className="border-primary/50"
                          >
                            <Video className="w-3 h-3 mr-1" />
                            Animate
                          </Button>
                        )}
                        
                        {scene.generatedImageUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(scene.generatedImageUrl, '_blank')}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>

                      {/* Animation Panel */}
                      {isSelected && scene.generatedImageUrl && !scene.generatedVideoUrl && (
                        <div className="mt-4 p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                          <Label>Describe the motion</Label>
                          <Textarea
                            value={animationPrompt}
                            onChange={(e) => setAnimationPrompt(e.target.value)}
                            placeholder="Camera slowly pushes in, character takes a deep breath..."
                            rows={2}
                          />
                          
                          <div className="flex gap-3 items-end">
                            <div className="flex-1 space-y-1">
                              <Label className="text-xs">Model</Label>
                              <Select 
                                value={animationModel} 
                                onValueChange={(v) => setAnimationModel(v as VideoModel)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {imageToVideoModels.map(m => (
                                    <SelectItem key={m.model} value={m.model}>
                                      {m.name} ({m.price} credits)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <Button
                              size="sm"
                              onClick={() => handleGenerateVideo(index)}
                              disabled={isGeneratingVideo || !animationPrompt.trim()}
                            >
                              {isGeneratingVideo ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Play className="w-4 h-4 mr-1" />
                                  Generate
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>

              <Button
                variant="gold"
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Complete Storyboard
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
