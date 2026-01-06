import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles, Download, Video, DollarSign } from "lucide-react";
import { useMediaGeneration, VideoModel, MODEL_INFO } from "@/hooks/useMediaGeneration";

interface VideoGeneratorProps {
  onVideoGenerated?: (url: string) => void;
}

export function VideoGenerator({ onVideoGenerated }: VideoGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<VideoModel>("google/veo3-fast");
  const [duration, setDuration] = useState<number>(5);
  const [resolution, setResolution] = useState<"720p" | "1080p">("1080p");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [generateAudio, setGenerateAudio] = useState(true);

  const { isGeneratingVideo, generatedVideoUrl, generateVideo } = useMediaGeneration();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    const url = await generateVideo({
      model,
      prompt: prompt.trim(),
      duration,
      resolution,
      aspect_ratio: aspectRatio,
      generate_audio: model.includes("veo3") ? generateAudio : undefined,
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

  const selectedModelInfo = MODEL_INFO[model];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>AI Model</Label>
        <Select value={model} onValueChange={(v: VideoModel) => setModel(v)}>
          <SelectTrigger className="bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(MODEL_INFO).map(([key, info]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <span>{info.name}</span>
                  <span className="text-xs text-muted-foreground">({info.price})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{selectedModelInfo.description}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="video-prompt">Describe your video</Label>
        <Textarea
          id="video-prompt"
          placeholder="A person walking confidently towards a bright future, cinematic slow motion..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[100px] bg-background/50 border-border/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Duration</Label>
          <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
            <SelectTrigger className="bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 seconds</SelectItem>
              <SelectItem value="8">8 seconds</SelectItem>
              {model.includes("sora") && <SelectItem value="10">10 seconds</SelectItem>}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Resolution</Label>
          <Select value={resolution} onValueChange={(v: any) => setResolution(v)}>
            <SelectTrigger className="bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="720p">720p</SelectItem>
              <SelectItem value="1080p">1080p</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Aspect Ratio</Label>
        <Select value={aspectRatio} onValueChange={(v: any) => setAspectRatio(v)}>
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

      {model.includes("veo3") && (
        <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
          <div>
            <Label htmlFor="audio-toggle">Generate Audio</Label>
            <p className="text-xs text-muted-foreground">AI will create matching sound effects</p>
          </div>
          <Switch
            id="audio-toggle"
            checked={generateAudio}
            onCheckedChange={setGenerateAudio}
          />
        </div>
      )}

      <div className="rounded-lg bg-muted/30 p-3 flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Estimated cost: {selectedModelInfo.price}
        </span>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={isGeneratingVideo || !prompt.trim()}
        className="w-full bg-gradient-to-r from-primary to-primary/80"
      >
        {isGeneratingVideo ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating (this may take a few minutes)...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Video
          </>
        )}
      </Button>

      {generatedVideoUrl && (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden border border-border/50">
            <video
              src={generatedVideoUrl}
              controls
              className="w-full h-auto"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            {onVideoGenerated && (
              <Button onClick={() => onVideoGenerated(generatedVideoUrl)} className="flex-1">
                <Video className="mr-2 h-4 w-4" />
                Set as Mind Movie
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
