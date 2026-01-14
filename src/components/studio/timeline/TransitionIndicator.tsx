import { useState } from "react";
import { Blend, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export type TransitionType = "none" | "fade" | "dissolve" | "wipe-left" | "wipe-right" | "wipe-up" | "wipe-down";

export interface TimelineTransition {
  id: string;
  type: TransitionType;
  duration: number; // in seconds
  clipAId: string; // outgoing clip
  clipBId: string; // incoming clip
}

interface TransitionIndicatorProps {
  transition: TimelineTransition;
  zoom: number;
  position: number; // left position in pixels
  onUpdate: (updates: Partial<TimelineTransition>) => void;
  onRemove: () => void;
}

const TRANSITION_OPTIONS: { type: TransitionType; label: string; icon: string }[] = [
  { type: "fade", label: "Fade", icon: "◐" },
  { type: "dissolve", label: "Dissolve", icon: "◑" },
  { type: "wipe-left", label: "Wipe Left", icon: "◀" },
  { type: "wipe-right", label: "Wipe Right", icon: "▶" },
  { type: "wipe-up", label: "Wipe Up", icon: "▲" },
  { type: "wipe-down", label: "Wipe Down", icon: "▼" },
];

export function TransitionIndicator({
  transition,
  zoom,
  position,
  onUpdate,
  onRemove,
}: TransitionIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const width = transition.duration * zoom;

  const currentOption = TRANSITION_OPTIONS.find(o => o.type === transition.type);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "absolute top-1/2 -translate-y-1/2 h-8 rounded-md border-2 border-dashed",
            "bg-gradient-to-r from-amber-500/20 via-amber-500/40 to-amber-500/20",
            "border-amber-500/60 hover:border-amber-400 hover:bg-amber-500/30",
            "flex items-center justify-center gap-1 cursor-pointer transition-all",
            "z-10 group"
          )}
          style={{
            left: `${position}px`,
            width: `${Math.max(width, 24)}px`,
          }}
          title={`${currentOption?.label || "Transition"} (${transition.duration}s)`}
        >
          <Blend className="h-3 w-3 text-amber-400" />
          {width > 40 && (
            <span className="text-[10px] text-amber-300 font-medium">
              {currentOption?.label}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="center">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Transition</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={() => {
                onRemove();
                setIsOpen(false);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Transition type selector */}
          <div className="grid grid-cols-3 gap-1">
            {TRANSITION_OPTIONS.map((option) => (
              <button
                key={option.type}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-md border transition-colors",
                  transition.type === option.type
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
                )}
                onClick={() => onUpdate({ type: option.type })}
              >
                <span className="text-lg">{option.icon}</span>
                <span className="text-[10px]">{option.label}</span>
              </button>
            ))}
          </div>

          {/* Duration slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Duration</span>
              <span className="text-xs font-mono">{transition.duration.toFixed(1)}s</span>
            </div>
            <Slider
              value={[transition.duration * 10]}
              onValueChange={([v]) => onUpdate({ duration: v / 10 })}
              min={1}
              max={30}
              step={1}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Helper component to show "Add Transition" button between clips
interface AddTransitionButtonProps {
  position: number;
  onAdd: () => void;
}

export function AddTransitionButton({ position, onAdd }: AddTransitionButtonProps) {
  return (
    <button
      className={cn(
        "absolute top-1/2 -translate-y-1/2 h-6 w-6 rounded-full",
        "bg-muted/80 border border-dashed border-muted-foreground/30",
        "flex items-center justify-center cursor-pointer transition-all",
        "hover:bg-amber-500/20 hover:border-amber-500 hover:scale-110",
        "opacity-0 group-hover:opacity-100 z-10"
      )}
      style={{ left: `${position - 12}px` }}
      onClick={(e) => {
        e.stopPropagation();
        onAdd();
      }}
      title="Add transition"
    >
      <Blend className="h-3 w-3 text-muted-foreground hover:text-amber-400" />
    </button>
  );
}
