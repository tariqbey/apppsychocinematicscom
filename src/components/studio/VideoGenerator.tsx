import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Download, Video, Film, ImageIcon } from "lucide-react";
import { useMediaGeneration, VideoModel, MODEL_INFO } from "@/hooks/useMediaGeneration";
import { ImageUpload } from "./ImageUpload";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VideoGeneratorProps {
  onVideoGenerated?: (url: string) => void;
}

type VideoMode = "text" | "frames";

export function VideoGenerator({ onVideoGenerated }: VideoGeneratorProps) {
  const [mode, setMode] = useState<VideoMode>("text");
  const [prompt, setPrompt] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<VideoModel>("openai/sora-2/text-to-video-developer");
  const [duration, setDuration] = useState<5 | 10>(5);
  const [resolution, setResolution] = useState<"720p" | "1080p">("1080p");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [cameoId, setCameoId] = useState("");

  const { isGeneratingVideo, generatedVideoUrl, generateVideo, estimateCreditCost } = useMediaGeneration();

  // For frames-to-video, use the selected image model
  const [selectedImageModel, setSelectedImageModel] = useState<VideoModel>("openai/sora-2/image-to-video");
  const effectiveModel: VideoModel = mode === "frames" ? selectedImageModel : selectedModel;
  const modelInfo = MODEL_INFO[effectiveModel];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (mode === "frames" && !uploadedImage) return;

    const url = await generateVideo({
      prompt: prompt.trim(),
      model: effectiveModel,
      duration,
      resolution,
      aspect_ratio: aspectRatio,
      image: mode === "frames" ? uploadedImage ?? undefined : undefined,
      cameo_id: mode === "text" && cameoId.trim() ? cameoId.trim() : undefined,
    });

    if (url && onVideoGenerated) {
      onVideoGenerated(url);
    }
  };

  const handleDownload = () => {
    if (generatedVideoUrl) {
      window.open(generatedVideoUrl, "_blank");
    }
  };

  const canGenerate = prompt.trim() && (mode === "text" || uploadedImage);

  // Models available for text-to-video
  const textModels: VideoModel[] = ["openai/sora-2/text-to-video-developer", "wan-ai/wan2.1-t2v-480p"];
  
  // Models available for image-to-video
  const imageModels: VideoModel[] = ["openai/sora-2/image-to-video", "wan-ai/wan2.1-i2v-480p"];

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as VideoMode)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Text to Video
          </TabsTrigger>
          <TabsTrigger value="frames" className="flex items-center gap-2">
            <Film className="h-4 w-4" />
            Frames to Video
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Generated Video Preview */}
      {generatedVideoUrl && (
        <div className="space-y-4 p-4 rounded-lg border border-gold/30 bg-gold/5">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gold">Generated Video</h4>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
          <div className="relative rounded-lg overflow-hidden border border-border/50">
            <video
              src={generatedVideoUrl}
              controls
              className="w-full max-h-[400px] bg-black/50"
            />
          </div>
        </div>
      )}

      {/* Text Mode: Model Selection + Cameo ID */}
      {mode === "text" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Model</Label>
            <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as VideoModel)}>
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {textModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {MODEL_INFO[model].name} - {MODEL_INFO[model].price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{modelInfo.description}</p>
          </div>
          
          {/* Cameo ID - Only for Sora 2 Developer */}
          {selectedModel === "openai/sora-2/text-to-video-developer" && (
            <div className="space-y-2">
              <Label htmlFor="cameo-id" className="flex items-center gap-2">
                Sora Cameo ID
                <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <input
                id="cameo-id"
                type="text"
                placeholder="@Jetson_Life"
                value={cameoId}
                onChange={(e) => setCameoId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground">
                Enter a shareable Sora Cameo ID to include that character in your video
              </p>
            </div>
          )}
        </div>
      )}

      {/* Frames Mode: Model Selection + Image Upload */}
      {mode === "frames" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Model</Label>
            <Select value={selectedImageModel} onValueChange={(v) => setSelectedImageModel(v as VideoModel)}>
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {imageModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {MODEL_INFO[model].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{modelInfo.description}</p>
          </div>
          <div className="space-y-2">
            <Label>Upload Starting Frame</Label>
            <ImageUpload
              value={uploadedImage}
              onChange={setUploadedImage}
              placeholder="Upload an image to animate"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="video-prompt">
          {mode === "text" ? "Describe your video" : "Describe the animation"}
        </Label>
        <Textarea
          id="video-prompt"
          placeholder={
            mode === "text"
              ? "A majestic eagle soaring through golden sunset clouds..."
              : "The camera slowly zooms in while clouds drift across the sky..."
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[100px] bg-background/50 border-border/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Duration</Label>
          <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v) as 5 | 10)}>
            <SelectTrigger className="bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 seconds</SelectItem>
              <SelectItem value="10">10 seconds</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Resolution</Label>
          <Select value={resolution} onValueChange={(v) => setResolution(v as "720p" | "1080p")}>
            <SelectTrigger className="bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="720p">720p HD</SelectItem>
              <SelectItem value="1080p">1080p Full HD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Aspect Ratio</Label>
          <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as "16:9" | "9:16" | "1:1")}>
            <SelectTrigger className="bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16:9">Landscape (16:9)</SelectItem>
              <SelectItem value="9:16">Portrait (9:16)</SelectItem>
              <SelectItem value="1:1">Square (1:1)</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </div>

      {/* Estimated Cost Display */}
      <p className="text-xs text-muted-foreground text-center">
        Estimated cost: {estimateCreditCost?.("video", duration) || 60} credits
      </p>

      <Button
        onClick={handleGenerate}
        disabled={isGeneratingVideo || !canGenerate}
        className="w-full bg-gradient-to-r from-primary to-primary/80"
      >
        {isGeneratingVideo ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            {mode === "frames" ? <Film className="mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {mode === "frames" ? "Animate Image" : "Generate Video"}
          </>
        )}
      </Button>
    </div>
  );
}
