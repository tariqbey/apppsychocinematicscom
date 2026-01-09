import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Download, ImageIcon, Pencil, Film, User } from "lucide-react";
import { useMediaGeneration, VideoModel, MODEL_INFO } from "@/hooks/useMediaGeneration";
import { ImageUpload } from "./ImageUpload";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ImageGeneratorProps {
  onImageGenerated?: (url: string) => void;
  onVideoGenerated?: (url: string) => void;
  initialPrompt?: string;
}

type ImageMode = "create" | "edit";

export function ImageGenerator({ 
  onImageGenerated, 
  onVideoGenerated,
  initialPrompt,
}: ImageGeneratorProps) {
  const [mode, setMode] = useState<ImageMode>("create");
  const [prompt, setPrompt] = useState(initialPrompt || "");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [referencePhoto, setReferencePhoto] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16" | "4:3">("16:9");
  const [resolution, setResolution] = useState<"1k" | "2k" | "4k">("2k");
  
  // Animation state
  const [showAnimationPanel, setShowAnimationPanel] = useState(false);
  const [animationPrompt, setAnimationPrompt] = useState("");
  const [animationDuration, setAnimationDuration] = useState<5 | 10>(5);
  const [animationModel, setAnimationModel] = useState<VideoModel>("kling-ai/v1-5/pro/image-to-video");

  // Set initial prompt when props change
  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  // Models that support image-to-video
  const imageToVideoModels: { model: VideoModel; name: string; price: string }[] = [
    { model: "kling-ai/v1-5/pro/image-to-video", name: "Kling 1.5 Pro", price: "$0.08/s" },
    { model: "openai/sora-2/image-to-video", name: "Sora 2", price: "$0.10/s" },
    { model: "wan-ai/wan2.1-i2v-480p", name: "Wan 2.1", price: "$0.05/s" },
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
    
    // Always include reference photo first if available (for likeness)
    if (referencePhoto) {
      imagesToUse.push(referencePhoto);
    }
    
    // Add uploaded image for editing if in edit mode
    if (mode === "edit" && uploadedImage) {
      imagesToUse.push(uploadedImage);
    }

    // Enhance prompt with reference photo context
    let enhancedPrompt = prompt.trim();
    if (referencePhoto && !uploadedImage) {
      enhancedPrompt = `Generate an image featuring the person from the reference photo. ${enhancedPrompt}`;
    } else if (referencePhoto && uploadedImage) {
      enhancedPrompt = `Edit this image to feature the person from the reference photo. ${enhancedPrompt}`;
    }

    const url = await generateImage({
      prompt: enhancedPrompt,
      aspect_ratio: aspectRatio,
      resolution,
      images: imagesToUse.length > 0 ? imagesToUse : undefined,
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

  const canGenerate = prompt.trim() && (mode === "create" || uploadedImage || referencePhoto);
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

      {/* Reference Photo for Likeness */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Reference Photo (Optional)
        </Label>
        <p className="text-xs text-muted-foreground">
          Upload a photo of yourself to include your likeness in generated images.
        </p>
        <ImageUpload
          value={referencePhoto}
          onChange={setReferencePhoto}
          placeholder="Upload your reference photo"
          className="max-w-xs"
        />
        {referencePhoto && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Your likeness will be incorporated into generated images
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

      <div className="space-y-2">
        <Label htmlFor="image-prompt">
          {mode === "create" ? "Describe your image" : "Describe the edits"}
        </Label>
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
