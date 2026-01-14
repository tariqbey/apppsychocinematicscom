import { useState, useRef, useCallback, memo } from "react";
import { Film, Image, Music, Volume2, VolumeX, Scissors, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimelineClip } from "@/hooks/useTimelineEditor";
import { SimpleWaveform } from "./AudioWaveform";
import { cn } from "@/lib/utils";

interface SnapInfo {
  time: number;
  type: "clip-start" | "clip-end" | "playhead" | "grid";
}

interface TimelineClipComponentProps {
  clip: TimelineClip;
  zoom: number;
  isSelected: boolean;
  onSelect: (e?: React.MouseEvent) => void;
  onRemove: () => void;
  onMove: (newStartTime: number) => void;
  onTrim: (trimStart: number, trimEnd: number) => void;
  onSplit: () => void;
  onToggleMute: () => void;
  snapEnabled?: boolean;
  onSnapPreview?: (lines: SnapInfo[]) => void;
  snapTime?: (time: number, excludeClipId?: string) => { snappedTime: number; didSnap: boolean; snapType: string | null };
}

// Throttle helper for smoother drag performance
function throttle<T extends (...args: unknown[]) => void>(fn: T, wait: number): T {
  let lastTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - lastTime);
    
    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastTime = now;
      fn(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        fn(...args);
      }, remaining);
    }
  }) as T;
}

export const TimelineClipComponent = memo(function TimelineClipComponent({
  clip,
  zoom,
  isSelected,
  onSelect,
  onRemove,
  onMove,
  onTrim,
  onSplit,
  onToggleMute,
  snapEnabled = true,
  onSnapPreview,
  snapTime,
}: TimelineClipComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<"start" | "end" | null>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartTime = useRef(0);
  const dragStartTrimStart = useRef(0);
  const dragStartTrimEnd = useRef(0);

  const width = clip.duration * zoom;
  const left = clip.startTime * zoom;

  const getIcon = useCallback(() => {
    switch (clip.type) {
      case "video":
        return <Film className="h-3 w-3" />;
      case "audio":
        return <Music className="h-3 w-3" />;
      case "image":
        return <Image className="h-3 w-3" />;
    }
  }, [clip.type]);

  const handleMouseDown = useCallback((e: React.MouseEvent, action: "drag" | "resize-start" | "resize-end") => {
    e.stopPropagation();
    onSelect();

    if (action === "drag") {
      setIsDragging(true);
      dragStartX.current = e.clientX;
      dragStartTime.current = clip.startTime;
    } else {
      setIsResizing(action === "resize-start" ? "start" : "end");
      dragStartX.current = e.clientX;
      dragStartTrimStart.current = clip.trimStart;
      dragStartTrimEnd.current = clip.trimEnd;
    }

    // Store refs for closure
    const clipId = clip.id;
    const clipDuration = clip.duration;
    const clipSourceDuration = clip.sourceDuration;
    const currentTrimStart = clip.trimStart;
    const currentTrimEnd = clip.trimEnd;
    const currentStartTime = clip.startTime;

    // Throttled move handler for performance
    const throttledMove = throttle((newStartTime: number, snapLines: SnapInfo[]) => {
      onMove(newStartTime);
      onSnapPreview?.(snapLines);
    }, 16); // ~60fps

    const throttledTrim = throttle((trimStart: number, trimEnd: number, snapLines: SnapInfo[]) => {
      onTrim(trimStart, trimEnd);
      onSnapPreview?.(snapLines);
    }, 16);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - dragStartX.current;
      const deltaTime = deltaX / zoom;

      if (action === "drag") {
        let newStartTime = Math.max(0, dragStartTime.current + deltaTime);
        let snapLines: SnapInfo[] = [];
        
        // Apply snapping
        if (snapEnabled && snapTime) {
          const startSnap = snapTime(newStartTime, clipId);
          const endSnap = snapTime(newStartTime + clipDuration, clipId);
          
          if (startSnap.didSnap && (!endSnap.didSnap || Math.abs(startSnap.snappedTime - newStartTime) <= Math.abs(endSnap.snappedTime - (newStartTime + clipDuration)))) {
            newStartTime = startSnap.snappedTime;
            snapLines = [{ time: startSnap.snappedTime, type: startSnap.snapType as SnapInfo["type"] }];
          } else if (endSnap.didSnap) {
            newStartTime = endSnap.snappedTime - clipDuration;
            snapLines = [{ time: endSnap.snappedTime, type: endSnap.snapType as SnapInfo["type"] }];
          }
        }
        
        throttledMove(newStartTime, snapLines);
      } else if (action === "resize-start") {
        let newTrimStart = Math.max(0, Math.min(dragStartTrimStart.current + deltaTime, currentTrimEnd - 0.5));
        const newStartTime = currentStartTime + (newTrimStart - currentTrimStart);
        let snapLines: SnapInfo[] = [];
        
        if (snapEnabled && snapTime) {
          const snap = snapTime(newStartTime, clipId);
          if (snap.didSnap) {
            const timeDiff = snap.snappedTime - newStartTime;
            newTrimStart = Math.max(0, Math.min(newTrimStart + timeDiff, currentTrimEnd - 0.5));
            snapLines = [{ time: snap.snappedTime, type: snap.snapType as SnapInfo["type"] }];
          }
        }
        
        throttledTrim(newTrimStart, currentTrimEnd, snapLines);
      } else {
        let newTrimEnd = Math.max(currentTrimStart + 0.5, Math.min(dragStartTrimEnd.current + deltaTime, clipSourceDuration));
        const newEndTime = currentStartTime + (newTrimEnd - currentTrimStart);
        let snapLines: SnapInfo[] = [];
        
        if (snapEnabled && snapTime) {
          const snap = snapTime(newEndTime, clipId);
          if (snap.didSnap) {
            const timeDiff = snap.snappedTime - newEndTime;
            newTrimEnd = Math.max(currentTrimStart + 0.5, Math.min(newTrimEnd + timeDiff, clipSourceDuration));
            snapLines = [{ time: snap.snappedTime, type: snap.snapType as SnapInfo["type"] }];
          }
        }
        
        throttledTrim(currentTrimStart, newTrimEnd, snapLines);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
      onSnapPreview?.([]);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [clip.id, clip.startTime, clip.duration, clip.trimStart, clip.trimEnd, clip.sourceDuration, zoom, snapEnabled, snapTime, onSelect, onMove, onTrim, onSnapPreview]);

  // Calculate number of waveform bars based on clip width
  const waveformBars = Math.max(5, Math.floor(width / 8));

  const handleDragMouseDown = useCallback((e: React.MouseEvent) => handleMouseDown(e, "drag"), [handleMouseDown]);
  const handleResizeStartMouseDown = useCallback((e: React.MouseEvent) => handleMouseDown(e, "resize-start"), [handleMouseDown]);
  const handleResizeEndMouseDown = useCallback((e: React.MouseEvent) => handleMouseDown(e, "resize-end"), [handleMouseDown]);
  
  const handleMuteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleMute();
  }, [onToggleMute]);
  
  const handleSplitClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSplit();
  }, [onSplit]);
  
  const handleRemoveClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  }, [onRemove]);

  return (
    <div
      ref={clipRef}
      className={cn(
        "absolute top-1 bottom-1 rounded-md border transition-colors cursor-pointer group overflow-hidden",
        clip.type === "video" && "bg-primary/30 border-primary/50 hover:border-primary",
        clip.type === "audio" && "bg-accent/30 border-accent/50 hover:border-accent",
        clip.type === "image" && "bg-amber-500/30 border-amber-500/50 hover:border-amber-500",
        isSelected && "ring-2 ring-ring ring-offset-1 ring-offset-background",
        isDragging && "opacity-80",
        isResizing && "z-20"
      )}
      style={{ 
        left: `${left}px`, 
        width: `${Math.max(width, 20)}px`,
        transform: 'translateZ(0)', // GPU acceleration
      }}
      onClick={onSelect}
    >
      {/* Waveform background for video/audio clips */}
      {(clip.type === "video" || clip.type === "audio") && width > 40 && (
        <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
          <SimpleWaveform
            width={Math.max(width - 8, 20)}
            height={40}
            bars={waveformBars}
            color={clip.type === "video" ? "hsl(var(--primary))" : "hsl(var(--accent))"}
          />
        </div>
      )}

      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-foreground/20 rounded-l-md z-10"
        onMouseDown={handleResizeStartMouseDown}
      />

      {/* Content */}
      <div
        className="relative flex items-center gap-1 px-2 h-full overflow-hidden z-10"
        onMouseDown={handleDragMouseDown}
      >
        {/* Thumbnail or icon */}
        {clip.thumbnail ? (
          <img
            src={clip.thumbnail}
            alt=""
            className="h-6 w-10 object-cover rounded flex-shrink-0 border border-white/20"
            draggable={false}
          />
        ) : (
          <div className="flex-shrink-0 bg-background/50 p-1 rounded">{getIcon()}</div>
        )}

        {/* Name */}
        <span className="text-xs truncate flex-1 drop-shadow-sm">{clip.name}</span>

        {/* Mute indicator */}
        {clip.type !== "image" && clip.muted && (
          <VolumeX className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        )}
      </div>

      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-foreground/20 rounded-r-md z-10"
        onMouseDown={handleResizeEndMouseDown}
      />

      {/* Toolbar on selection */}
      {isSelected && (
        <div className="absolute -top-8 left-0 flex items-center gap-1 bg-card border border-border rounded-md p-1 shadow-lg z-30">
          {clip.type !== "image" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleMuteClick}
              title={clip.muted ? "Unmute" : "Mute"}
            >
              {clip.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleSplitClick}
            title="Split at playhead"
          >
            <Scissors className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={handleRemoveClick}
            title="Delete clip"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
});
