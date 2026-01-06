import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Download, ImageIcon } from "lucide-react";
import { useMediaGeneration } from "@/hooks/useMediaGeneration";

interface ImageGeneratorProps {
  onImageGenerated?: (url: string) => void;
}

export function ImageGenerator({ onImageGenerated }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16" | "4:3">("16:9");
  const [resolution, setResolution] = useState<"1k" | "2k" | "4k">("2k");

  const { isGeneratingImage, generatedImageUrl, generateImage } = useMediaGeneration();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    const url = await generateImage({
      prompt: prompt.trim(),
      aspect_ratio: aspectRatio,
      resolution,
    });

    if (url && onImageGenerated) {
      onImageGenerated(url);
    }
  };

  const handleDownload = () => {
    if (generatedImageUrl) {
      window.open(generatedImageUrl, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="image-prompt">Describe your image</Label>
        <Textarea
          id="image-prompt"
          placeholder="A cinematic sunrise over mountains with golden light streaming through clouds..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[100px] bg-background/50 border-border/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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

        <div className="space-y-2">
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

      <Button
        onClick={handleGenerate}
        disabled={isGeneratingImage || !prompt.trim()}
        className="w-full bg-gradient-to-r from-primary to-primary/80"
      >
        {isGeneratingImage ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Image
          </>
        )}
      </Button>

      {generatedImageUrl && (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden border border-border/50">
            <img
              src={generatedImageUrl}
              alt="Generated"
              className="w-full h-auto"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            {onImageGenerated && (
              <Button onClick={() => onImageGenerated(generatedImageUrl)} className="flex-1">
                <ImageIcon className="mr-2 h-4 w-4" />
                Use Image
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
