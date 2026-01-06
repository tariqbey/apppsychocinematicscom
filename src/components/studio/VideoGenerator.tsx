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
  const [selectedModel, setSelectedModel] = useState<VideoModel>("google/veo3-fast");
  const [duration, setDuration] = useState<5 | 10>(5);
  const [resolution, setResolution] = useState<"720p" | "1080p">("1080p");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [generateAudio, setGenerateAudio] = useState(true);

  const { isGeneratingVideo, generatedVideoUrl, generateVideo } = useMediaGeneration();

  // For frames-to-video, we use Sora 2 image-to-video model
  const effectiveModel: VideoModel = mode === "frames" ? "openai/sora-2/image-to-video" : selectedModel;
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
      generate_audio: effectiveModel.includes("veo") ? generateAudio : undefined,
      image: mode === "frames" ? uploadedImage ?? undefined : undefined,
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
  const textModels: VideoModel[] = ["google/veo3", "google/veo3-fast", "openai/sora-2/text-to-video"];

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
              {onVideoGenerated && (
                <Button size="sm" onClick={() => onVideoGenerated(generatedVideoUrl)}>
                  <Video className="mr-2 h-4 w-4" />
                  Set as Mind Movie
                </Button>
              )}
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

      {/* Text Mode: Model Selection */}
      {mode === "text" && (
        <div className="space-y-2">
          <Label>Model</Label>
          <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as VideoModel)}>
            <SelectTrigger className="bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {textModels.map((model) => (
                <SelectItem key={model} value={model}>
                  <div className="flex items-center justify-between w-full">
                    <span>{MODEL_INFO[model].name}</span>
                    <span className="text-muted-foreground ml-2">${MODEL_INFO[model].price}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{modelInfo.description}</p>
        </div>
      )}

      {/* Frames Mode: Image Upload */}
      {mode === "frames" && (
        <div className="space-y-2">
          <Label>Upload Starting Frame</Label>
          <ImageUpload
            value={uploadedImage}
            onChange={setUploadedImage}
            placeholder="Upload an image to animate"
          />
          <p className="text-xs text-muted-foreground">
            Using Sora 2 Image-to-Video • ${MODEL_INFO["openai/sora-2/image-to-video"].price}
          </p>
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

        {/* Audio toggle only for Veo models in text mode */}
        {mode === "text" && effectiveModel.includes("veo") && (
          <div className="space-y-2">
            <Label>Generate Audio</Label>
            <Select value={generateAudio ? "yes" : "no"} onValueChange={(v) => setGenerateAudio(v === "yes")}>
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes, with audio</SelectItem>
                <SelectItem value="no">No audio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Estimated Cost */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Estimated Cost</span>
          <span className="font-medium text-gold">${modelInfo.price}</span>
        </div>
      </div>

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
