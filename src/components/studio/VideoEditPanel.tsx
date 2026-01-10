import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Wand2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProductionCredits } from "@/hooks/useProductionCredits";
import { supabase } from "@/integrations/supabase/client";

interface VideoEditPanelProps {
  videoUrl: string;
  onVideoEdited?: (url: string) => void;
}

const EDIT_PRESETS = [
  { label: "Cinematic Look", prompt: "Apply cinematic color grading with dramatic lighting and film grain" },
  { label: "Vintage Effect", prompt: "Transform to vintage 80s VHS aesthetic with warm tones and scan lines" },
  { label: "Slow Motion", prompt: "Create smooth slow motion effect with time dilation" },
  { label: "Night Mode", prompt: "Convert to night scene with moonlight and dark atmosphere" },
  { label: "Weather: Rain", prompt: "Add realistic rain effects with water droplets and wet surfaces" },
  { label: "Weather: Snow", prompt: "Add falling snow with cold blue tones and frost" },
  { label: "Style: Anime", prompt: "Transform into anime art style with cel shading" },
  { label: "Style: Oil Paint", prompt: "Apply oil painting artistic filter with visible brush strokes" },
];

export function VideoEditPanel({ videoUrl, onVideoEdited }: VideoEditPanelProps) {
  const [editPrompt, setEditPrompt] = useState("");
  const [keepAudio, setKeepAudio] = useState(true);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedVideoUrl, setEditedVideoUrl] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { user, session } = useAuth();
  const { credits, deductCredits, estimateCreditCost } = useProductionCredits();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || referenceImages.length >= 4) return;

    Array.from(files).forEach((file) => {
      if (referenceImages.length >= 4) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setReferenceImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    e.target.value = "";
  };

  const removeReferenceImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  const applyPreset = (prompt: string) => {
    setEditPrompt(prompt);
  };

  const handleEdit = async () => {
    if (!editPrompt.trim() || !videoUrl) return;
    if (!user || !session) {
      toast({ title: "Please sign in", variant: "destructive" });
      return;
    }

    // Check balance
    const creditCost = estimateCreditCost("video", 10); // Video editing costs similar to 10s generation
    if (credits && !credits.isAdmin && credits.totalRemaining < creditCost) {
      toast({
        title: "Insufficient credits",
        description: `You need ${creditCost} credits. You have ${credits.totalRemaining} credits.`,
        variant: "destructive",
      });
      return;
    }

    setIsEditing(true);
    setEditedVideoUrl(null);

    try {
      // Deduct credits
      if (!credits?.isAdmin) {
        const deductResult = await deductCredits("video", 10);
        if (!deductResult.success) {
          throw new Error(deductResult.error || "Failed to deduct credits");
        }
        toast({
          title: "Credits deducted",
          description: `Used ${deductResult.creditsDeducted || creditCost} credits.`,
        });
      }

      const { data, error } = await supabase.functions.invoke("atlas-generate-video", {
        body: {
          model: "kling-ai/v1.0/video-to-video",
          prompt: editPrompt.trim(),
          video_url: videoUrl,
          keep_audio: keepAudio,
          reference_images: referenceImages.length > 0 ? referenceImages : undefined,
          user_id: user.id,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || "Failed to start video editing");
      }

      const predictionId = data.predictionId;
      toast({
        title: "Video editing started",
        description: "This may take a few minutes...",
      });

      // Poll for completion
      const pollMs = 4000;
      const maxAttempts = 150; // ~10 minutes
      let attempts = 0;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, pollMs));

        const { data: statusData, error: statusError } = await supabase.functions.invoke(
          "check-video-status",
          { body: { predictionId } }
        );

        if (statusError) {
          throw new Error(statusError.message);
        }

        if (statusData?.status === "completed" && statusData?.videoUrl) {
          setEditedVideoUrl(statusData.videoUrl);
          toast({ title: "Video edited!", description: "Your edited video is ready." });
          onVideoEdited?.(statusData.videoUrl);
          return;
        }

        if (statusData?.status === "failed") {
          throw new Error(statusData?.error || "Video editing failed");
        }

        attempts++;

        // Progress toast every 2 minutes
        const elapsedMinutes = Math.floor((attempts * pollMs) / 60000);
        if (attempts % 30 === 0) {
          toast({
            title: "Still editing...",
            description: `${elapsedMinutes} minutes elapsed.`,
          });
        }
      }

      toast({
        title: "Still processing",
        description: "Check the Media Library in a few minutes.",
      });
    } catch (error) {
      console.error("Video edit error:", error);
      toast({
        title: "Edit failed",
        description: error instanceof Error ? error.message : "Failed to edit video",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-primary flex items-center gap-2">
          <Wand2 className="h-4 w-4" />
          Kling 1.0 Video Editor
        </h4>
        <span className="text-xs text-muted-foreground">~110 credits</span>
      </div>

      {/* Edit Presets */}
      <div className="space-y-2">
        <Label className="text-sm">Quick Effects</Label>
        <div className="flex flex-wrap gap-2">
          {EDIT_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => applyPreset(preset.prompt)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Edit Prompt */}
      <div className="space-y-2">
        <Label htmlFor="edit-prompt">Describe your edit</Label>
        <Textarea
          id="edit-prompt"
          placeholder="e.g., 'Add dramatic rain and lightning effects while keeping the main subject in focus' or 'Transform to sunset lighting with warm golden tones'"
          value={editPrompt}
          onChange={(e) => setEditPrompt(e.target.value)}
          className="min-h-[80px] bg-background/50"
        />
        <p className="text-xs text-muted-foreground">
          Use @Image1, @Image2, etc. to reference uploaded images in your prompt
        </p>
      </div>

      {/* Reference Images */}
      <div className="space-y-2">
        <Label>Reference Images (Optional)</Label>
        <div className="flex flex-wrap gap-2">
          {referenceImages.map((img, index) => (
            <div key={index} className="relative w-16 h-16">
              <img
                src={img}
                alt={`Reference ${index + 1}`}
                className="w-full h-full object-cover rounded border"
              />
              <button
                onClick={() => removeReferenceImage(index)}
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
              <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center">
                @Image{index + 1}
              </span>
            </div>
          ))}
          {referenceImages.length < 4 && (
            <label className="w-16 h-16 flex items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Upload up to 4 reference images for style or character guidance
        </p>
      </div>

      {/* Keep Audio Toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="keep-audio" className="text-sm">Keep Original Audio</Label>
        <Switch
          id="keep-audio"
          checked={keepAudio}
          onCheckedChange={setKeepAudio}
        />
      </div>

      {/* Edit Button */}
      <Button
        onClick={handleEdit}
        disabled={isEditing || !editPrompt.trim()}
        className="w-full bg-gradient-to-r from-primary to-primary/80"
      >
        {isEditing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Editing Video...
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4" />
            Apply Edit
          </>
        )}
      </Button>

      {/* Edited Video Preview */}
      {editedVideoUrl && (
        <div className="space-y-2">
          <Label>Edited Result</Label>
          <div className="rounded-lg overflow-hidden border border-border/50">
            <video
              src={editedVideoUrl}
              controls
              className="w-full max-h-[300px] bg-black/50"
            />
          </div>
        </div>
      )}
    </div>
  );
}
