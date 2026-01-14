import { useState, useRef } from "react";
import { Film, Image, Music, Volume2, VolumeX, Scissors, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimelineClip } from "@/hooks/useTimelineEditor";
import { cn } from "@/lib/utils";

interface TimelineClipComponentProps {
  clip: TimelineClip;
  zoom: number;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onMove: (newStartTime: number) => void;
  onTrim: (trimStart: number, trimEnd: number) => void;
  onSplit: () => void;
  onToggleMute: () => void;
}

export function TimelineClipComponent({
  clip,
  zoom,
  isSelected,
  onSelect,
  onRemove,
  onMove,
  onTrim,
  onSplit,
  onToggleMute,
}: TimelineClipComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<"start" | "end" | null>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartTime = useRef(0);

  const width = clip.duration * zoom;
  const left = clip.startTime * zoom;

  const getIcon = () => {
    switch (clip.type) {
      case "video":
        return <Film className="h-3 w-3" />;
      case "audio":
        return <Music className="h-3 w-3" />;
      case "image":
        return <Image className="h-3 w-3" />;
    }
  };

  const handleMouseDown = (e: React.MouseEvent, action: "drag" | "resize-start" | "resize-end") => {
    e.stopPropagation();
    onSelect();

    if (action === "drag") {
      setIsDragging(true);
      dragStartX.current = e.clientX;
      dragStartTime.current = clip.startTime;
    } else {
      setIsResizing(action === "resize-start" ? "start" : "end");
      dragStartX.current = e.clientX;
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - dragStartX.current;
      const deltaTime = deltaX / zoom;

      if (action === "drag") {
        onMove(Math.max(0, dragStartTime.current + deltaTime));
      } else if (action === "resize-start") {
        const newTrimStart = Math.max(0, Math.min(clip.trimStart + deltaTime, clip.trimEnd - 0.5));
        onTrim(newTrimStart, clip.trimEnd);
      } else {
        const newTrimEnd = Math.max(clip.trimStart + 0.5, Math.min(clip.trimEnd + deltaTime, clip.sourceDuration));
        onTrim(clip.trimStart, newTrimEnd);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      ref={clipRef}
      className={cn(
        "absolute top-1 bottom-1 rounded-md border transition-all cursor-pointer group",
        clip.type === "video" && "bg-primary/30 border-primary/50 hover:border-primary",
        clip.type === "audio" && "bg-accent/30 border-accent/50 hover:border-accent",
        clip.type === "image" && "bg-amber-500/30 border-amber-500/50 hover:border-amber-500",
        isSelected && "ring-2 ring-ring ring-offset-1 ring-offset-background",
        isDragging && "opacity-80",
        isResizing && "z-20"
      )}
      style={{ left: `${left}px`, width: `${Math.max(width, 20)}px` }}
      onClick={onSelect}
    >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-foreground/20 rounded-l-md"
        onMouseDown={(e) => handleMouseDown(e, "resize-start")}
      />

      {/* Content */}
      <div
        className="flex items-center gap-1 px-2 h-full overflow-hidden"
        onMouseDown={(e) => handleMouseDown(e, "drag")}
      >
        {/* Thumbnail or icon */}
        {clip.thumbnail ? (
          <img
            src={clip.thumbnail}
            alt=""
            className="h-6 w-10 object-cover rounded flex-shrink-0"
            draggable={false}
          />
        ) : (
          <div className="flex-shrink-0">{getIcon()}</div>
        )}

        {/* Name */}
        <span className="text-xs truncate flex-1">{clip.name}</span>

        {/* Mute indicator */}
        {clip.type !== "image" && clip.muted && (
          <VolumeX className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        )}
      </div>

      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-foreground/20 rounded-r-md"
        onMouseDown={(e) => handleMouseDown(e, "resize-end")}
      />

      {/* Toolbar on selection */}
      {isSelected && (
        <div className="absolute -top-8 left-0 flex items-center gap-1 bg-card border border-border rounded-md p-1 shadow-lg z-30">
          {clip.type !== "image" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute();
              }}
              title={clip.muted ? "Unmute" : "Mute"}
            >
              {clip.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onSplit();
            }}
            title="Split at playhead"
          >
            <Scissors className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            title="Delete clip"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
