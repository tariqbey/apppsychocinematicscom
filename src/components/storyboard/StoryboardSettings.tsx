import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Settings, 
  Monitor, 
  Smartphone, 
  Square, 
  Clock,
  Cpu,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3";
export type ImageModel = "nano-banana-pro" | "gemini";

interface StoryboardSettingsProps {
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  imageModel: ImageModel;
  onImageModelChange: (model: ImageModel) => void;
  duration: number;
  onDurationChange: (duration: number) => void;
  clipDuration?: number;
}

const ASPECT_RATIOS: { value: AspectRatio; icon: typeof Monitor; label: string; description: string }[] = [
  { value: "16:9", icon: Monitor, label: "Landscape", description: "Cinematic widescreen" },
  { value: "9:16", icon: Smartphone, label: "Portrait", description: "Vertical for mobile" },
  { value: "1:1", icon: Square, label: "Square", description: "Social media posts" },
  { value: "4:3", icon: Monitor, label: "Standard", description: "Classic format" },
];

const IMAGE_MODELS: { value: ImageModel; label: string; description: string; badge?: string }[] = [
  { 
    value: "nano-banana-pro", 
    label: "Nano Banana Pro", 
    description: "Best for character consistency with reference photos",
    badge: "Recommended"
  },
  { 
    value: "gemini", 
    label: "Gemini Flash", 
    description: "Fast generation, good for general scenes"
  },
];

export function StoryboardSettings({
  aspectRatio,
  onAspectRatioChange,
  imageModel,
  onImageModelChange,
  duration,
  onDurationChange,
  clipDuration = 8,
}: StoryboardSettingsProps) {
  const sceneCount = Math.ceil(duration / clipDuration);

  return (
    <div className="glass-card p-4 space-y-5">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-gold" />
        <h3 className="font-medium">Generation Settings</h3>
      </div>

      {/* Duration */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Movie Duration</span>
          </div>
          <Badge variant="secondary">
            {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
          </Badge>
        </div>
        <Slider
          value={[duration]}
          onValueChange={([val]) => onDurationChange(val)}
          min={60}
          max={180}
          step={30}
          className="my-2"
        />
        <p className="text-xs text-muted-foreground">
          {sceneCount} scenes × {clipDuration} seconds = {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')} movie
        </p>
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-3">
        <span className="text-sm font-medium flex items-center gap-2">
          <Monitor className="w-4 h-4 text-muted-foreground" />
          Aspect Ratio
        </span>
        <div className="grid grid-cols-2 gap-2">
          {ASPECT_RATIOS.map((ratio) => {
            const Icon = ratio.icon;
            const isSelected = aspectRatio === ratio.value;
            return (
              <button
                key={ratio.value}
                onClick={() => onAspectRatioChange(ratio.value)}
                className={cn(
                  "p-3 rounded-lg border text-left transition-all",
                  isSelected
                    ? "border-gold bg-gold/10"
                    : "border-border hover:border-gold/50"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn(
                    "w-4 h-4",
                    isSelected ? "text-gold" : "text-muted-foreground"
                  )} />
                  <span className="text-sm font-medium">{ratio.value}</span>
                </div>
                <p className="text-xs text-muted-foreground">{ratio.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Image Model */}
      <div className="space-y-3">
        <span className="text-sm font-medium flex items-center gap-2">
          <Cpu className="w-4 h-4 text-muted-foreground" />
          Image Model
        </span>
        <div className="space-y-2">
          {IMAGE_MODELS.map((model) => {
            const isSelected = imageModel === model.value;
            return (
              <button
                key={model.value}
                onClick={() => onImageModelChange(model.value)}
                className={cn(
                  "w-full p-3 rounded-lg border text-left transition-all",
                  isSelected
                    ? "border-gold bg-gold/10"
                    : "border-border hover:border-gold/50"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "text-sm font-medium",
                    isSelected && "text-gold"
                  )}>
                    {model.label}
                  </span>
                  {model.badge && (
                    <Badge variant="outline" className="text-xs border-gold/50 text-gold">
                      {model.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{model.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
