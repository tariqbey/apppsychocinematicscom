import { useMemo, memo, useCallback, useState } from "react";
import { Film, Music, Volume2, VolumeX, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { TimelineTrack, TimelineClip, TimelineTransition } from "@/hooks/useTimelineEditor";
import { TimelineClipComponent } from "./TimelineClipComponent";
import { TransitionIndicator, AddTransitionButton } from "./TransitionIndicator";
import { cn } from "@/lib/utils";

interface SnapInfo {
  time: number;
  type: "clip-start" | "clip-end" | "playhead" | "grid";
}

interface TimelineTrackComponentProps {
  track: TimelineTrack;
  clips: TimelineClip[];
  transitions: TimelineTransition[];
  zoom: number;
  currentTime: number;
  selectedClipIds: string[];
  trackIndex: number;
  onSelectClip: (clipId: string, addToSelection?: boolean) => void;
  onClearSelection: () => void;
  onRemoveClip: (clipId: string) => void;
  onMoveClip: (clipId: string, newStartTime: number) => void;
  onTrimClip: (clipId: string, trimStart: number, trimEnd: number) => void;
  onSplitClip: (clipId: string) => void;
  onToggleClipMute: (clipId: string) => void;
  onUpdateClipVolume: (clipId: string, volume: number) => void;
  onToggleTrackMute: () => void;
  onToggleTrackLock: () => void;
  onSetTrackVolume: (volume: number) => void;
  onAddTransition: (clipAId: string, clipBId: string) => void;
  onUpdateTransition: (transitionId: string, updates: Partial<TimelineTransition>) => void;
  onRemoveTransition: (transitionId: string) => void;
  snapEnabled?: boolean;
  onSnapPreview?: (lines: SnapInfo[]) => void;
  snapTime?: (time: number, excludeClipId?: string) => { snappedTime: number; didSnap: boolean; snapType: string | null };
}

export const TimelineTrackComponent = memo(function TimelineTrackComponent({
  track,
  clips,
  transitions,
  zoom,
  currentTime,
  selectedClipIds,
  trackIndex,
  onSelectClip,
  onClearSelection,
  onRemoveClip,
  onMoveClip,
  onTrimClip,
  onSplitClip,
  onToggleClipMute,
  onUpdateClipVolume,
  onToggleTrackMute,
  onToggleTrackLock,
  onSetTrackVolume,
  onAddTransition,
  onUpdateTransition,
  onRemoveTransition,
  snapEnabled = true,
  onSnapPreview,
  snapTime,
}: TimelineTrackComponentProps) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  // Generate track label like "Video 1", "Audio 1"
  const trackLabel = track.type === "video" ? `Video ${trackIndex + 1}` : `Audio ${trackIndex + 1}`;
  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClearSelection();
    }
  }, [onClearSelection]);

  // Find adjacent clip pairs for potential transitions
  const adjacentPairs = useMemo(() => {
    const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime);
    const pairs: { clipA: TimelineClip; clipB: TimelineClip; position: number }[] = [];
    
    for (let i = 0; i < sortedClips.length - 1; i++) {
      const clipA = sortedClips[i];
      const clipB = sortedClips[i + 1];
      const clipAEnd = clipA.startTime + clipA.duration;
      
      if (Math.abs(clipAEnd - clipB.startTime) < 0.1) {
        pairs.push({
          clipA,
          clipB,
          position: clipAEnd * zoom,
        });
      }
    }
    
    return pairs;
  }, [clips, zoom]);

  // Get transitions for this track's clips
  const trackTransitions = useMemo(() => {
    const clipIds = new Set(clips.map(c => c.id));
    return transitions.filter(t => clipIds.has(t.clipAId) && clipIds.has(t.clipBId));
  }, [clips, transitions]);

  // Memoized clip handlers to prevent re-renders
  const clipHandlers = useMemo(() => {
    const handlers: Record<string, {
      onSelect: (e?: React.MouseEvent) => void;
      onRemove: () => void;
      onMove: (newStartTime: number) => void;
      onTrim: (trimStart: number, trimEnd: number) => void;
      onSplit: () => void;
      onToggleMute: () => void;
      onVolumeChange: (volume: number) => void;
    }> = {};
    
    clips.forEach(clip => {
      handlers[clip.id] = {
        onSelect: (e?: React.MouseEvent) => {
          const addToSelection = e?.shiftKey || e?.metaKey || e?.ctrlKey;
          onSelectClip(clip.id, addToSelection);
        },
        onRemove: () => onRemoveClip(clip.id),
        onMove: (newStartTime: number) => onMoveClip(clip.id, newStartTime),
        onTrim: (trimStart: number, trimEnd: number) => onTrimClip(clip.id, trimStart, trimEnd),
        onSplit: () => onSplitClip(clip.id),
        onToggleMute: () => onToggleClipMute(clip.id),
        onVolumeChange: (volume: number) => onUpdateClipVolume(clip.id, volume),
      };
    });
    
    return handlers;
  }, [clips, onSelectClip, onRemoveClip, onMoveClip, onTrimClip, onSplitClip, onToggleClipMute, onUpdateClipVolume]);

  return (
    <div className="flex border-b border-border/50">
      {/* Track header with label */}
      <div className="w-28 flex-shrink-0 border-r border-border/50 bg-card/50 flex flex-col">
        {/* Track label */}
        <div className={cn(
          "px-2 py-1.5 border-b border-border/30 flex items-center gap-2",
          track.type === "video" ? "bg-primary/10" : "bg-accent/10"
        )}>
          {track.type === "video" ? (
            <Film className="h-3.5 w-3.5 text-primary" />
          ) : (
            <Music className="h-3.5 w-3.5 text-accent" />
          )}
          <span className="text-xs font-semibold tracking-wide">{trackLabel}</span>
        </div>
        
        {/* Controls */}
        <div className="flex-1 flex flex-col justify-center gap-1 px-2 py-1">
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-6 w-6", track.muted && "text-muted-foreground")}
              onClick={onToggleTrackMute}
              title={track.muted ? "Unmute track" : "Mute track"}
            >
              {track.muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-6 w-6", track.locked && "text-amber-500")}
              onClick={onToggleTrackLock}
              title={track.locked ? "Unlock track" : "Lock track"}
            >
              {track.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            </Button>
          </div>
          
          {/* Volume slider */}
          <div 
            className="flex items-center gap-1 px-0.5"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <Slider
              value={[track.volume * 100]}
              max={100}
              step={1}
              className={cn(
                "h-4 cursor-pointer transition-opacity",
                showVolumeSlider || track.volume < 1 ? "opacity-100" : "opacity-50"
              )}
              onValueChange={([val]) => onSetTrackVolume(val / 100)}
              disabled={track.muted}
            />
            <span className="text-[10px] text-muted-foreground w-6 text-right tabular-nums">
              {Math.round(track.volume * 100)}
            </span>
          </div>
        </div>
      </div>

      {/* Track content */}
      <div
        className={cn(
          "flex-1 relative h-16 bg-muted/20 group",
          track.locked && "opacity-50 pointer-events-none"
        )}
        onClick={handleTrackClick}
      >
        {/* Clips */}
        {clips.map((clip) => {
          const handlers = clipHandlers[clip.id];
          if (!handlers) return null;
          
          return (
            <TimelineClipComponent
              key={clip.id}
              clip={clip}
              zoom={zoom}
              isSelected={selectedClipIds.includes(clip.id)}
              onSelect={handlers.onSelect}
              onRemove={handlers.onRemove}
              onMove={handlers.onMove}
              onTrim={handlers.onTrim}
              onSplit={handlers.onSplit}
              onToggleMute={handlers.onToggleMute}
              onVolumeChange={handlers.onVolumeChange}
              snapEnabled={snapEnabled}
              onSnapPreview={onSnapPreview}
              snapTime={snapTime}
            />
          );
        })}

        {/* Transition indicators */}
        {trackTransitions.map((transition) => {
          const clipA = clips.find(c => c.id === transition.clipAId);
          if (!clipA) return null;
          const position = (clipA.startTime + clipA.duration - transition.duration / 2) * zoom;
          
          return (
            <TransitionIndicator
              key={transition.id}
              transition={transition}
              zoom={zoom}
              position={position}
              onUpdate={(updates) => onUpdateTransition(transition.id, updates)}
              onRemove={() => onRemoveTransition(transition.id)}
            />
          );
        })}

        {/* Add transition buttons between adjacent clips */}
        {adjacentPairs.map(({ clipA, clipB, position }) => {
          const hasTransition = trackTransitions.some(
            t => t.clipAId === clipA.id && t.clipBId === clipB.id
          );
          if (hasTransition) return null;
          
          return (
            <AddTransitionButton
              key={`add-${clipA.id}-${clipB.id}`}
              position={position}
              onAdd={() => onAddTransition(clipA.id, clipB.id)}
            />
          );
        })}
      </div>
    </div>
  );
});
