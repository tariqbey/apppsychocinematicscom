import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Download, ImageIcon, Pencil, Film, Wand2, X, Images, LayoutDashboard } from "lucide-react";
import { useMediaGeneration, VideoModel, MODEL_INFO } from "@/hooks/useMediaGeneration";
import { ImageUpload } from "./ImageUpload";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMindMovies } from "@/hooks/useMindMovies";
import { useGlobalReferencePhoto } from "@/hooks/useGlobalReferencePhoto";
import { useAuth } from "@/hooks/useAuth";

interface ImageGeneratorProps {
  onImageGenerated?: (url: string) => void;
  onVideoGenerated?: (url: string) => void;
  initialPrompt?: string;
  imageType?: "poster" | "cover" | "avatar" | "profile" | "scene" | "storyboard";
}

type ImageMode = "create" | "edit";

export function ImageGenerator({ 
  onImageGenerated, 
  onVideoGenerated,
  initialPrompt,
  imageType,
}: ImageGeneratorProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeMovie } = useMindMovies();

  // Global character reference photo (saved in Settings)
  const {
    referencePhotoUrl: globalReferencePhoto,
    fetchReferencePhoto,
    isLoading: loadingGlobalPhoto,
  } = useGlobalReferencePhoto();
  
  const [mode, setMode] = useState<ImageMode>("create");
  const [prompt, setPrompt] = useState(initialPrompt || "");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // Additional reference photos support (the global character reference is automatically included separately)
  const [extraReferencePhotos, setExtraReferencePhotos] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16" | "4:3">("16:9");
  const [resolution, setResolution] = useState<"1k" | "2k" | "4k">("2k");
  
  // AI prompt enhancement state
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  // Animation state
  const [showAnimationPanel, setShowAnimationPanel] = useState(false);
  const [animationPrompt, setAnimationPrompt] = useState("");
  const [animationDuration, setAnimationDuration] = useState<5 | 10>(5);
  const [animationModel, setAnimationModel] = useState<VideoModel>("kling-ai/v1.0/image-to-video");

  // Set initial prompt when props change
  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  // Load global character reference photo on mount
  useEffect(() => {
    fetchReferencePhoto();
  }, [fetchReferencePhoto]);

  // Add extra reference photo
  const addExtraReferencePhoto = (url: string) => {
    if (extraReferencePhotos.length < 5) {
      setExtraReferencePhotos(prev => [...prev, url]);
    } else {
      toast({
        title: "Maximum reached",
        description: "You can add up to 5 additional reference images",
        variant: "destructive",
      });
    }
  };

  // Remove extra reference photo
  const removeExtraReferencePhoto = (index: number) => {
    setExtraReferencePhotos(prev => prev.filter((_, i) => i !== index));
  };

  // AI Prompt Enhancement
  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Enter a prompt first",
        description: "Type something to enhance",
      });
      return;
    }

    setIsEnhancing(true);
    try {
      const context: Record<string, string> = {};
      
      // Add context from user's mind movie if available
      if (activeMovie?.chief_aim_snapshot?.what) {
        context.chiefAim = activeMovie.chief_aim_snapshot.what;
      }
      if (activeMovie?.title) {
        context.movieTitle = activeMovie.title;
      }

      const { data, error } = await supabase.functions.invoke("enhance-prompt", {
        body: { 
          prompt: prompt.trim(),
          context,
          imageType: imageType || "scene",
        },
      });

      if (error) throw error;

      if (data?.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
        toast({
          title: "Prompt Enhanced! ✨",
          description: "Your prompt has been upgraded with cinematic details",
        });
      }
    } catch (error) {
      console.error("Enhancement error:", error);
      toast({
        title: "Enhancement failed",
        description: "Could not enhance prompt. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  // Models that support image-to-video
  const imageToVideoModels: { model: VideoModel; name: string; price: string }[] = [
    { model: "kling-ai/v1.0/image-to-video", name: "Kling 1.0", price: "60-110 credits" },
    { model: "wan-ai/wan2.1-i2v-480p", name: "Wan 2.1", price: "60-110 credits" },
    { model: "google/veo3-fast/image-to-video", name: "Veo 3 Fast", price: "60-100 credits" },
  ];

  const { 
    isGeneratingImage, 
    isGeneratingVideo,
    generatedImageUrl, 
    generatedVideoUrl,
    generateImage,
    generateVideo,
    estimateCreditCost,
  } = useMediaGeneration();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    // Combine all images for generation
    const imagesToUse: string[] = [];

    // In edit mode, the FIRST image should be the base image to edit
    if (mode === "edit" && uploadedImage) {
      imagesToUse.push(uploadedImage);
    }

    // Always include the saved global character reference photo (identity) if available
    if (globalReferencePhoto) {
      imagesToUse.push(globalReferencePhoto);
    }
    
    // Include any additional reference photos (style/wardrobe/location)
    extraReferencePhotos.forEach(photo => {
      imagesToUse.push(photo);
    });

    // Enhance prompt with identity + extra references context (keep it short and safe)
    let enhancedPrompt = prompt.trim();
    if (globalReferencePhoto && mode === "create") {
      enhancedPrompt = `Create a new cinematic image featuring the same person as in the character reference photo. ${enhancedPrompt}`;
    }
    if (globalReferencePhoto && mode === "edit") {
      enhancedPrompt = `Edit the base image according to the request while keeping the person consistent with the character reference photo. ${enhancedPrompt}`;
    }
    if (extraReferencePhotos.length > 0) {
      enhancedPrompt += " Use the other reference image(s) as style/wardrobe/setting inspiration.";
    }

    // Use nano-banana-pro for strict aspect ratio control (it has API-level enforcement)
    // Use gemini only as fallback when no aspect ratio control is needed
    const useNanoBanana = aspectRatio !== "1:1" || imagesToUse.length > 0;
    
    const url = await generateImage({
      prompt: enhancedPrompt,
      aspect_ratio: aspectRatio,
      resolution,
      images: imagesToUse.length > 0 ? imagesToUse : undefined,
      model: useNanoBanana ? "nano-banana-pro" : "gemini",
      mode,
    });

    if (url && onImageGenerated) {
      onImageGenerated(url);
    }
    // Reset animation panel when generating new image
    setShowAnimationPanel(false);
    setAnimationPrompt("");
  };

  const handleAnimate = async () => {
    if (!generatedImageUrl || !animationPrompt.trim()) return;

    const videoUrl = await generateVideo({
      model: animationModel,
      prompt: animationPrompt.trim(),
      image: generatedImageUrl,
      duration: animationDuration,
      resolution: "1080p",
      aspect_ratio: aspectRatio === "4:3" ? "16:9" : aspectRatio as "16:9" | "9:16" | "1:1",
    });

    if (videoUrl && onVideoGenerated) {
      onVideoGenerated(videoUrl);
    }
  };

  const selectedModelInfo = imageToVideoModels.find(m => m.model === animationModel);

  const handleDownload = () => {
    if (generatedImageUrl) {
      window.open(generatedImageUrl, "_blank");
    }
  };

  const canGenerate = !!prompt.trim() && (mode === "create" || !!uploadedImage);
  const canAnimate = generatedImageUrl && animationPrompt.trim() && !isGeneratingVideo;

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as ImageMode)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Create Image
          </TabsTrigger>
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Edit Image
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Generated Image Preview - Show at top when available */}
      {generatedImageUrl && (
        <div className="space-y-4 p-4 rounded-lg border border-gold/30 bg-gold/5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="font-medium text-gold">Generated Image</h4>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAnimationPanel(!showAnimationPanel)}
                className="border-primary/50 hover:bg-primary/10"
              >
                <Film className="mr-2 h-4 w-4" />
                Animate
              </Button>
              {onImageGenerated && (
                <Button size="sm" onClick={() => onImageGenerated(generatedImageUrl)}>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Use Image
                </Button>
              )}
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => {
                  if (user?.id && generatedImageUrl) {
                    localStorage.setItem(`director-cover-${user.id}`, generatedImageUrl);
                    toast({ title: "Cover photo updated!", description: "Go to your dashboard to see it." });
                  }
                }}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Use as Cover
              </Button>
            </div>
          </div>
          <div className="relative rounded-lg overflow-hidden border border-border/50">
            <img
              src={generatedImageUrl}
              alt="Generated"
              className="w-full h-auto max-h-[400px] object-contain bg-black/50"
            />
          </div>

          {/* Animation Panel */}
          {showAnimationPanel && (
            <div className="space-y-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
              <h5 className="font-medium text-sm">Animate this image</h5>
              
              <div className="space-y-2">
                <Label htmlFor="animation-prompt">Describe the motion</Label>
                <Textarea
                  id="animation-prompt"
                  placeholder="Camera slowly zooms in while clouds drift across the sky..."
                  value={animationPrompt}
                  onChange={(e) => setAnimationPrompt(e.target.value)}
                  className="min-h-[80px] bg-background/50 border-border/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select 
                    value={animationModel} 
                    onValueChange={(v) => setAnimationModel(v as VideoModel)}
                  >
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {imageToVideoModels.map((m) => (
                        <SelectItem key={m.model} value={m.model}>
                          {m.name} ({m.price})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select 
                    value={animationDuration.toString()} 
                    onValueChange={(v) => setAnimationDuration(parseInt(v) as 5 | 10)}
                  >
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 seconds</SelectItem>
                      <SelectItem value="10">10 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Estimated cost: {estimateCreditCost?.("video", animationDuration) || 60} credits
              </p>

              <Button
                onClick={handleAnimate}
                disabled={!canAnimate}
                className="w-full"
              >
                {isGeneratingVideo ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Animating...
                  </>
                ) : (
                  <>
                    <Film className="mr-2 h-4 w-4" />
                    Generate Animation
                  </>
                )}
              </Button>

              {/* Generated Video Preview */}
              {generatedVideoUrl && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <h5 className="font-medium text-sm text-primary">Animation Ready!</h5>
                  <video
                    src={generatedVideoUrl}
                    controls
                    className="w-full rounded-lg border border-border/50"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open(generatedVideoUrl, "_blank")}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Video
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reference Images */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Images className="h-4 w-4" />
          Character Reference (Automatic)
        </Label>

        {loadingGlobalPhoto ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading your saved character reference…
          </div>
        ) : globalReferencePhoto ? (
          <div className="flex items-center gap-3">
            <img
              src={globalReferencePhoto}
              alt="Your character reference"
              className="w-16 h-16 object-cover rounded-lg border border-border/50"
            />
            <div className="text-xs text-muted-foreground">
              Your saved character reference will be used in every generation (so it stays you).
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No saved character reference found. Add one in Settings → Reference Photo to lock your likeness into all images.
          </p>
        )}

        <div className="pt-2 space-y-2">
          <Label className="text-sm">Additional Reference Images (Optional — up to 5)</Label>
          <p className="text-xs text-muted-foreground">
            Add extra images to influence wardrobe, style, props, or environment.
          </p>
        
        {/* Display existing extra reference photos */}
        {extraReferencePhotos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {extraReferencePhotos.map((photo, index) => (
              <div key={index} className="relative group">
                <img 
                  src={photo} 
                  alt={`Reference ${index + 1}`} 
                  className="w-16 h-16 object-cover rounded-lg border border-border/50"
                />
                <button
                  onClick={() => removeExtraReferencePhoto(index)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Add more extra reference photos */}
        {extraReferencePhotos.length < 5 && (
          <ImageUpload
            value={null}
            onChange={(url) => url && addExtraReferencePhoto(url)}
            placeholder={extraReferencePhotos.length === 0 ? "Upload reference" : "Add another reference"}
            className="max-w-xs"
          />
        )}
        
        <p className="text-xs text-muted-foreground">
          {globalReferencePhoto ? "Character reference: ON" : "Character reference: OFF"}{" • "}
          Additional refs: {extraReferencePhotos.length}/5
        </p>
        </div>
      </div>

      {/* Edit Mode: Image Upload */}
      {mode === "edit" && (
        <div className="space-y-2">
          <Label>Upload Image to Edit</Label>
          <ImageUpload
            value={uploadedImage}
            onChange={setUploadedImage}
            placeholder="Upload an image to edit"
          />
        </div>
      )}

      {/* Prompt with AI Enhance Button */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="image-prompt">
            {mode === "create" ? "Describe your image" : "Describe the edits"}
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleEnhancePrompt}
            disabled={isEnhancing || !prompt.trim()}
            className="text-xs gap-1 text-gold hover:text-gold hover:bg-gold/10"
          >
            {isEnhancing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Wand2 className="h-3 w-3" />
            )}
            AI Enhance
          </Button>
        </div>
        <Textarea
          id="image-prompt"
          placeholder={
            mode === "create"
              ? "A cinematic sunrise over mountains with golden light streaming through clouds..."
              : "Make it sunset with warm orange tones, add dramatic clouds..."
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[100px] bg-background/50 border-border/50"
        />
        <p className="text-xs text-muted-foreground">
          💡 Click "AI Enhance" to add cinematic camera, lighting, and quality details
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {mode === "create" && (
          <div className="space-y-2">
            <Label>Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={(v: any) => setAspectRatio(v)}>
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1:1">Square (1:1)</SelectItem>
                <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                <SelectItem value="4:3">Classic (4:3)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className={mode === "create" ? "space-y-2" : "space-y-2 col-span-2"}>
          <Label>Resolution</Label>
          <Select value={resolution} onValueChange={(v: any) => setResolution(v)}>
            <SelectTrigger className="bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1k">1K (1024px)</SelectItem>
              <SelectItem value="2k">2K (2048px)</SelectItem>
              <SelectItem value="4k">4K (4096px)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Estimated Cost Display */}
      <p className="text-xs text-muted-foreground text-center">
        Estimated cost: {estimateCreditCost?.("image", undefined, resolution) || 15} credits
      </p>

      <Button
        onClick={handleGenerate}
        disabled={isGeneratingImage || !canGenerate}
        className="w-full bg-gradient-to-r from-primary to-primary/80"
      >
        {isGeneratingImage ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {mode === "edit" ? "Editing..." : "Generating..."}
          </>
        ) : (
          <>
            {mode === "edit" ? <Pencil className="mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {mode === "edit" ? "Edit Image" : "Generate Image"}
          </>
        )}
      </Button>
    </div>
  );
}
