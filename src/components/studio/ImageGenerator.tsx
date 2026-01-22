import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Download, ImageIcon, Pencil, Film, User, Wand2, Plus, X, Images } from "lucide-react";
import { useMediaGeneration, VideoModel, MODEL_INFO } from "@/hooks/useMediaGeneration";
import { ImageUpload } from "./ImageUpload";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMindMovies } from "@/hooks/useMindMovies";

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
  const { activeMovie } = useMindMovies();
  
  const [mode, setMode] = useState<ImageMode>("create");
  const [prompt, setPrompt] = useState(initialPrompt || "");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // Multiple reference photos support
  const [referencePhotos, setReferencePhotos] = useState<string[]>([]);
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

  // Add reference photo
  const addReferencePhoto = (url: string) => {
    if (referencePhotos.length < 5) {
      setReferencePhotos(prev => [...prev, url]);
    } else {
      toast({
        title: "Maximum reached",
        description: "You can add up to 5 reference images",
        variant: "destructive",
      });
    }
  };

  // Remove reference photo
  const removeReferencePhoto = (index: number) => {
    setReferencePhotos(prev => prev.filter((_, i) => i !== index));
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
    
    // Include all reference photos (for likeness)
    referencePhotos.forEach(photo => {
      imagesToUse.push(photo);
    });
    
    // Add uploaded image for editing if in edit mode
    if (mode === "edit" && uploadedImage) {
      imagesToUse.push(uploadedImage);
    }

    // Enhance prompt with reference photo context for better likeness retention
    let enhancedPrompt = prompt.trim();
    if (referencePhotos.length > 0 && !uploadedImage) {
      enhancedPrompt = `CRITICAL: The main subject MUST look exactly like the person in the reference photo(s) - preserve their exact facial features, likeness, and identity. Generate a new scene with this person: ${enhancedPrompt}`;
    } else if (referencePhotos.length > 0 && uploadedImage) {
      enhancedPrompt = `CRITICAL: Edit this image while maintaining the exact likeness of the person from the reference photo(s). ${enhancedPrompt}`;
    }

    // Always use Nano Banana Pro when reference images are provided for better likeness retention
    const useNanoBanana = imagesToUse.length > 0;

    const url = await generateImage({
      prompt: enhancedPrompt,
      aspect_ratio: aspectRatio,
      resolution,
      images: imagesToUse.length > 0 ? imagesToUse : undefined,
      model: useNanoBanana ? "nano-banana-pro" : "gemini",
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

  const canGenerate = prompt.trim() && (mode === "create" || uploadedImage || referencePhotos.length > 0);
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

      {/* Multiple Reference Photos for Likeness */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Images className="h-4 w-4" />
          Reference Photos (Optional - up to 5)
        </Label>
        <p className="text-xs text-muted-foreground">
          Upload photos to include your likeness or style references in generated images.
        </p>
        
        {/* Display existing reference photos */}
        {referencePhotos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {referencePhotos.map((photo, index) => (
              <div key={index} className="relative group">
                <img 
                  src={photo} 
                  alt={`Reference ${index + 1}`} 
                  className="w-16 h-16 object-cover rounded-lg border border-border/50"
                />
                <button
                  onClick={() => removeReferencePhoto(index)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Add more reference photos */}
        {referencePhotos.length < 5 && (
          <ImageUpload
            value={null}
            onChange={(url) => url && addReferencePhoto(url)}
            placeholder={referencePhotos.length === 0 ? "Upload reference photo" : "Add another reference"}
            className="max-w-xs"
          />
        )}
        
        {referencePhotos.length > 0 && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {referencePhotos.length} reference{referencePhotos.length > 1 ? 's' : ''} will be used
          </p>
        )}
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
