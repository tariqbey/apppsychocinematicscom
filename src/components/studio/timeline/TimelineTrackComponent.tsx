import { Film, Music, Volume2, VolumeX, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimelineTrack, TimelineClip } from "@/hooks/useTimelineEditor";
import { TimelineClipComponent } from "./TimelineClipComponent";
import { cn } from "@/lib/utils";

interface TimelineTrackComponentProps {
  track: TimelineTrack;
  clips: TimelineClip[];
  zoom: number;
  currentTime: number;
  selectedClipId: string | null;
  onSelectClip: (clipId: string | null) => void;
  onRemoveClip: (clipId: string) => void;
  onMoveClip: (clipId: string, newStartTime: number) => void;
  onTrimClip: (clipId: string, trimStart: number, trimEnd: number) => void;
  onSplitClip: (clipId: string) => void;
  onToggleClipMute: (clipId: string) => void;
  onToggleTrackMute: () => void;
  onToggleTrackLock: () => void;
}

export function TimelineTrackComponent({
  track,
  clips,
  zoom,
  currentTime,
  selectedClipId,
  onSelectClip,
  onRemoveClip,
  onMoveClip,
  onTrimClip,
  onSplitClip,
  onToggleClipMute,
  onToggleTrackMute,
  onToggleTrackLock,
}: TimelineTrackComponentProps) {
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
        onClick={() => onSelectClip(null)}
      >
        {/* Clips */}
        {clips.map((clip) => (
          <TimelineClipComponent
            key={clip.id}
            clip={clip}
            zoom={zoom}
            isSelected={selectedClipId === clip.id}
            onSelect={() => onSelectClip(clip.id)}
            onRemove={() => onRemoveClip(clip.id)}
            onMove={(newStartTime) => onMoveClip(clip.id, newStartTime)}
            onTrim={(trimStart, trimEnd) => onTrimClip(clip.id, trimStart, trimEnd)}
            onSplit={() => onSplitClip(clip.id)}
            onToggleMute={() => onToggleClipMute(clip.id)}
          />
        ))}
      </div>
    </div>
  );
}
