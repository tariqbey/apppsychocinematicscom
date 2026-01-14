import { Film, Music, Volume2, VolumeX, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimelineTrack, TimelineClip } from "@/hooks/useTimelineEditor";
import { TimelineClipComponent } from "./TimelineClipComponent";
import { cn } from "@/lib/utils";

interface SnapInfo {
  time: number;
  type: "clip-start" | "clip-end" | "playhead" | "grid";
}

interface TimelineTrackComponentProps {
  track: TimelineTrack;
  clips: TimelineClip[];
  zoom: number;
  currentTime: number;
  selectedClipIds: string[];
  onSelectClip: (clipId: string, addToSelection?: boolean) => void;
  onClearSelection: () => void;
  onRemoveClip: (clipId: string) => void;
  onMoveClip: (clipId: string, newStartTime: number) => void;
  onTrimClip: (clipId: string, trimStart: number, trimEnd: number) => void;
  onSplitClip: (clipId: string) => void;
  onToggleClipMute: (clipId: string) => void;
  onToggleTrackMute: () => void;
  onToggleTrackLock: () => void;
  snapEnabled?: boolean;
  onSnapPreview?: (lines: SnapInfo[]) => void;
  snapTime?: (time: number, excludeClipId?: string) => { snappedTime: number; didSnap: boolean; snapType: string | null };
}

export function TimelineTrackComponent({
  track,
  clips,
  zoom,
  currentTime,
  selectedClipIds,
  onSelectClip,
  onClearSelection,
  onRemoveClip,
  onMoveClip,
  onTrimClip,
  onSplitClip,
  onToggleClipMute,
  onToggleTrackMute,
  onToggleTrackLock,
  snapEnabled = true,
  onSnapPreview,
  snapTime,
}: TimelineTrackComponentProps) {
  const handleTrackClick = (e: React.MouseEvent) => {
    // Only clear if clicking the track background, not a clip
    if (e.target === e.currentTarget) {
      onClearSelection();
    }
  };

  return (
    <div className="flex border-b border-border/50">
      {/* Track header */}
      <div className="w-32 flex-shrink-0 p-2 border-r border-border/50 bg-card/50 flex flex-col justify-center gap-1">
        <div className="flex items-center gap-2">
          {track.type === "video" ? (
            <Film className="h-4 w-4 text-primary" />
          ) : (
            <Music className="h-4 w-4 text-accent" />
          )}
          <span className="text-xs font-medium truncate">{track.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-5 w-5", track.muted && "text-muted-foreground")}
            onClick={onToggleTrackMute}
            title={track.muted ? "Unmute track" : "Mute track"}
          >
            {track.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-5 w-5", track.locked && "text-amber-500")}
            onClick={onToggleTrackLock}
            title={track.locked ? "Unlock track" : "Lock track"}
          >
            {track.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Track content */}
      <div
        className={cn(
          "flex-1 relative h-16 bg-muted/20",
          track.locked && "opacity-50 pointer-events-none"
        )}
        onClick={handleTrackClick}
      >
        {/* Clips */}
        {clips.map((clip) => (
          <TimelineClipComponent
            key={clip.id}
            clip={clip}
            zoom={zoom}
            isSelected={selectedClipIds.includes(clip.id)}
            onSelect={(e?: React.MouseEvent) => {
              const addToSelection = e?.shiftKey || e?.metaKey || e?.ctrlKey;
              onSelectClip(clip.id, addToSelection);
            }}
            onRemove={() => onRemoveClip(clip.id)}
            onMove={(newStartTime) => onMoveClip(clip.id, newStartTime)}
            onTrim={(trimStart, trimEnd) => onTrimClip(clip.id, trimStart, trimEnd)}
            onSplit={() => onSplitClip(clip.id)}
            onToggleMute={() => onToggleClipMute(clip.id)}
            snapEnabled={snapEnabled}
            onSnapPreview={onSnapPreview}
            snapTime={snapTime}
          />
        ))}
      </div>
    </div>
  );
}
