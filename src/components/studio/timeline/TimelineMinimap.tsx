import { useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { TimelineClip } from "@/hooks/useTimelineEditor";

interface TimelineMinimapProps {
  clips: TimelineClip[];
  duration: number;
  currentTime: number;
  visibleRange: { start: number; end: number };
  onSeek: (time: number) => void;
  onScrollTo?: (time: number) => void;
  className?: string;
}

export function TimelineMinimap({
  clips,
  duration,
  currentTime,
  visibleRange,
  onSeek,
  onScrollTo,
  className,
}: TimelineMinimapProps) {
  const minimapWidth = 200;
  const minimapHeight = 40;

  // Group clips by track for layered display
  const clipsByTrack = useMemo(() => {
    const groups: Record<string, TimelineClip[]> = {};
    clips.forEach(clip => {
      if (!groups[clip.trackId]) {
        groups[clip.trackId] = [];
      }
      groups[clip.trackId].push(clip);
    });
    return groups;
  }, [clips]);

  const trackIds = Object.keys(clipsByTrack);
  const trackHeight = trackIds.length > 0 ? Math.min(12, Math.floor((minimapHeight - 8) / trackIds.length)) : 12;

  // Calculate positions
  const timeToX = useCallback((time: number) => {
    if (duration <= 0) return 0;
    return (time / duration) * minimapWidth;
  }, [duration, minimapWidth]);

  const xToTime = useCallback((x: number) => {
    return (x / minimapWidth) * duration;
  }, [duration, minimapWidth]);

  // Visible range indicator
  const visibleRangeStyle = useMemo(() => {
    const left = timeToX(visibleRange.start);
    const width = timeToX(visibleRange.end) - left;
    return {
      left: `${left}px`,
      width: `${Math.max(width, 20)}px`,
    };
  }, [visibleRange, timeToX]);

  // Playhead position
  const playheadX = timeToX(currentTime);

  // Handle click on minimap
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = xToTime(x);
    onSeek(Math.max(0, Math.min(duration, time)));
    onScrollTo?.(time);
  }, [xToTime, duration, onSeek, onScrollTo]);

  // Get color for clip type
  const getClipColor = (type: TimelineClip["type"]) => {
    switch (type) {
      case "video":
        return "bg-blue-500/70";
      case "image":
        return "bg-green-500/70";
      case "audio":
        return "bg-purple-500/70";
      default:
        return "bg-primary/70";
    }
  };

  if (clips.length === 0) {
    return null;
  }

  return (
    <div className={cn("relative select-none", className)}>
      <div className="text-[10px] text-muted-foreground mb-1 flex items-center justify-between">
        <span>Timeline Overview</span>
        <span className="font-mono">{duration.toFixed(1)}s</span>
      </div>
      <div 
        className="relative bg-muted/30 rounded border border-border/50 cursor-crosshair overflow-hidden"
        style={{ width: minimapWidth, height: minimapHeight }}
        onClick={handleClick}
      >
        {/* Clips visualization */}
        {trackIds.map((trackId, trackIndex) => (
          <div 
            key={trackId}
            className="absolute left-0 right-0"
            style={{ 
              top: 4 + trackIndex * (trackHeight + 2),
              height: trackHeight,
            }}
          >
            {clipsByTrack[trackId].map(clip => {
              const left = timeToX(clip.startTime);
              const width = timeToX(clip.startTime + clip.duration) - left;
              return (
                <div
                  key={clip.id}
                  className={cn(
                    "absolute rounded-sm transition-opacity",
                    getClipColor(clip.type)
                  )}
                  style={{
                    left: `${left}px`,
                    width: `${Math.max(width, 2)}px`,
                    height: trackHeight,
                  }}
                  title={clip.name}
                />
              );
            })}
          </div>
        ))}

        {/* Visible range indicator */}
        <div
          className="absolute top-0 bottom-0 bg-primary/10 border-x-2 border-primary/40 pointer-events-none"
          style={visibleRangeStyle}
        />

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-destructive z-10 pointer-events-none"
          style={{ left: `${playheadX}px` }}
        >
          <div className="absolute -top-0.5 -left-1 w-2 h-2 bg-destructive rounded-full" />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-1.5 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-blue-500/70" />
          Video
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-green-500/70" />
          Image
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-purple-500/70" />
          Audio
        </span>
      </div>
    </div>
  );
}
