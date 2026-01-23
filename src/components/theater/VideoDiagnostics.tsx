import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { X, Bug, AlertTriangle, Info, Play, Pause, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoEvent {
  time: number;
  type: string;
  details?: string;
}

interface VideoDiagnosticsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  videoSrc: string | null | undefined;
}

export const VideoDiagnostics = ({ videoRef, videoSrc }: VideoDiagnosticsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<VideoEvent[]>([]);
  const [playbackState, setPlaybackState] = useState({
    readyState: 0,
    networkState: 0,
    paused: true,
    ended: false,
    currentTime: 0,
    duration: 0,
    buffered: "",
    error: null as string | null,
  });

  const logContainerRef = useRef<HTMLDivElement>(null);

  const isIOS = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  }, []);

  const addEvent = useCallback((type: string, details?: string) => {
    const now = performance.now();
    setEvents((prev) => [...prev.slice(-49), { time: now, type, details }]);
  }, []);

  const updatePlaybackState = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    let bufferedRanges = "";
    for (let i = 0; i < video.buffered.length; i++) {
      bufferedRanges += `${video.buffered.start(i).toFixed(1)}-${video.buffered.end(i).toFixed(1)} `;
    }

    setPlaybackState({
      readyState: video.readyState,
      networkState: video.networkState,
      paused: video.paused,
      ended: video.ended,
      currentTime: video.currentTime,
      duration: video.duration,
      buffered: bufferedRanges.trim() || "none",
      error: video.error?.message || null,
    });
  }, [videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const events = [
      "loadstart",
      "loadedmetadata",
      "loadeddata",
      "canplay",
      "canplaythrough",
      "play",
      "playing",
      "pause",
      "ended",
      "waiting",
      "stalled",
      "suspend",
      "emptied",
      "abort",
      "error",
      "seeking",
      "seeked",
      "ratechange",
      "durationchange",
    ];

    const handlers: Record<string, () => void> = {};

    events.forEach((eventName) => {
      handlers[eventName] = () => {
        let details: string | undefined;

        if (eventName === "error" && video.error) {
          details = `Code ${video.error.code}: ${video.error.message || "Unknown error"}`;
        } else if (eventName === "waiting") {
          details = `readyState=${video.readyState}, networkState=${video.networkState}`;
        } else if (eventName === "stalled") {
          details = `Stalled at ${video.currentTime.toFixed(2)}s`;
        }

        addEvent(eventName, details);
        updatePlaybackState();
      };
      video.addEventListener(eventName, handlers[eventName]);
    });

    // Periodic state update
    const interval = setInterval(updatePlaybackState, 500);

    return () => {
      events.forEach((eventName) => {
        video.removeEventListener(eventName, handlers[eventName]);
      });
      clearInterval(interval);
    };
  }, [videoRef, addEvent, updatePlaybackState]);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [events]);

  const readyStateLabel = (rs: number) => {
    switch (rs) {
      case 0:
        return "HAVE_NOTHING";
      case 1:
        return "HAVE_METADATA";
      case 2:
        return "HAVE_CURRENT_DATA";
      case 3:
        return "HAVE_FUTURE_DATA";
      case 4:
        return "HAVE_ENOUGH_DATA";
      default:
        return `Unknown (${rs})`;
    }
  };

  const networkStateLabel = (ns: number) => {
    switch (ns) {
      case 0:
        return "EMPTY";
      case 1:
        return "IDLE";
      case 2:
        return "LOADING";
      case 3:
        return "NO_SOURCE";
      default:
        return `Unknown (${ns})`;
    }
  };

  const getEventColor = (type: string) => {
    if (["error", "abort", "emptied"].includes(type)) return "text-red-400";
    if (["waiting", "stalled", "suspend"].includes(type)) return "text-amber-400";
    if (["play", "playing", "canplaythrough"].includes(type)) return "text-green-400";
    return "text-blue-400";
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 left-2 z-20 h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
        onClick={() => setIsOpen(true)}
        title="Open Video Diagnostics"
      >
        <Bug className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="absolute top-2 left-2 right-2 z-20 max-w-md bg-black/90 backdrop-blur-sm border border-amber-500/30 rounded-lg text-xs font-mono overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-amber-500/20 border-b border-amber-500/30">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-amber-400" />
          <span className="font-semibold text-amber-400">Video Diagnostics</span>
          {isIOS && (
            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px]">iOS</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-white/70 hover:text-white"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Playback State */}
      <div className="p-3 border-b border-border/30 space-y-1.5">
        <div className="flex items-center gap-2">
          {playbackState.paused ? (
            <Pause className="h-3 w-3 text-amber-400" />
          ) : (
            <Play className="h-3 w-3 text-green-400" />
          )}
          <span className={playbackState.paused ? "text-amber-400" : "text-green-400"}>
            {playbackState.paused ? "PAUSED" : "PLAYING"}
          </span>
          <span className="text-muted-foreground">
            {playbackState.currentTime.toFixed(1)}s / {Number.isFinite(playbackState.duration) ? playbackState.duration.toFixed(1) : "?"}s
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
          <div>
            <span className="text-muted-foreground">readyState:</span>{" "}
            <span className="text-foreground">{readyStateLabel(playbackState.readyState)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">networkState:</span>{" "}
            <span className="text-foreground">{networkStateLabel(playbackState.networkState)}</span>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">buffered:</span>{" "}
            <span className="text-foreground">{playbackState.buffered}</span>
          </div>
          {playbackState.error && (
            <div className="col-span-2 flex items-center gap-1 text-red-400">
              <AlertTriangle className="h-3 w-3" />
              {playbackState.error}
            </div>
          )}
        </div>

        {videoSrc && (
          <div className="text-[10px] text-muted-foreground truncate" title={videoSrc}>
            src: {videoSrc.slice(0, 60)}...
          </div>
        )}
      </div>

      {/* Event Log */}
      <div
        ref={logContainerRef}
        className="h-32 overflow-y-auto p-2 space-y-0.5"
      >
        {events.length === 0 ? (
          <div className="text-muted-foreground text-center py-4">
            <Info className="h-4 w-4 mx-auto mb-1" />
            No events yet
          </div>
        ) : (
          events.map((event, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-muted-foreground/60 w-16 shrink-0">
                {(event.time / 1000).toFixed(2)}s
              </span>
              <span className={cn("font-medium", getEventColor(event.type))}>
                {event.type}
              </span>
              {event.details && (
                <span className="text-muted-foreground truncate">{event.details}</span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Clear Button */}
      <div className="px-3 py-2 border-t border-border/30">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs w-full"
          onClick={() => setEvents([])}
        >
          Clear Logs
        </Button>
      </div>
    </div>
  );
};
