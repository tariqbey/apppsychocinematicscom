import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Download, ImageIcon, Pencil } from "lucide-react";
import { useMediaGeneration } from "@/hooks/useMediaGeneration";
import { ImageUpload } from "./ImageUpload";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ImageGeneratorProps {
  onImageGenerated?: (url: string) => void;
}

type ImageMode = "create" | "edit";

export function ImageGenerator({ onImageGenerated }: ImageGeneratorProps) {
  const [mode, setMode] = useState<ImageMode>("create");
  const [prompt, setPrompt] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16" | "4:3">("16:9");
  const [resolution, setResolution] = useState<"1k" | "2k" | "4k">("2k");

  const { isGeneratingImage, generatedImageUrl, generateImage } = useMediaGeneration();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (mode === "edit" && !uploadedImage) return;

    const url = await generateImage({
      prompt: prompt.trim(),
      aspect_ratio: aspectRatio,
      resolution,
      images: mode === "edit" && uploadedImage ? [uploadedImage] : undefined,
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

  const canGenerate = prompt.trim() && (mode === "create" || uploadedImage);

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
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gold">Generated Image</h4>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
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
        </div>
      )}

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
