import { useRef, useEffect, useState, useCallback } from "react";
import { TimelineClip } from "@/hooks/useTimelineEditor";

interface TimelinePreviewProps {
  clips: TimelineClip[];
  currentTime: number;
  isPlaying: boolean;
  backgroundAudio: {
    url: string | null;
    volume: number;
    muted: boolean;
  };
}

// Threshold for determining if we need to seek (in seconds)
const SEEK_THRESHOLD = 0.3;

export function TimelinePreview({
  clips,
  currentTime,
  isPlaying,
  backgroundAudio,
}: TimelinePreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgAudioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeClip, setActiveClip] = useState<TimelineClip | null>(null);
  const lastSyncTimeRef = useRef<number>(0);
  const wasPlayingRef = useRef<boolean>(false);
  const activeClipIdRef = useRef<string | null>(null);

  // Find active video/image clip at current time
  useEffect(() => {
    const videoClips = clips.filter((c) => c.type === "video" || c.type === "image");
    const active = videoClips.find(
      (clip) =>
        currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration
    );
    setActiveClip(active || null);
  }, [clips, currentTime]);

  // Calculate expected clip time
  const getExpectedClipTime = useCallback((clip: TimelineClip, timelineTime: number) => {
    return timelineTime - clip.startTime + clip.trimStart;
  }, []);

  // Sync video playback with timeline - optimized to avoid stuttering
  useEffect(() => {
    if (!videoRef.current || !activeClip || activeClip.type !== "video") return;

    const video = videoRef.current;
    const expectedClipTime = getExpectedClipTime(activeClip, currentTime);
    
    // Check if we switched to a different clip
    const clipChanged = activeClipIdRef.current !== activeClip.id;
    activeClipIdRef.current = activeClip.id;

    if (isPlaying) {
      // If we just started playing, switched clips, or drifted too far, seek
      const currentVideoTime = video.currentTime;
      const drift = Math.abs(currentVideoTime - expectedClipTime);
      
      if (!wasPlayingRef.current || clipChanged || drift > SEEK_THRESHOLD) {
        video.currentTime = expectedClipTime;
        lastSyncTimeRef.current = currentTime;
      }
      
      // Start playing if not already
      if (video.paused) {
        video.play().catch(() => {});
      }
    } else {
      // When paused, always seek to exact position
      video.pause();
      
      // Only seek if position changed significantly (prevents micro-stutters)
      const drift = Math.abs(video.currentTime - expectedClipTime);
      if (drift > 0.05 || clipChanged) {
        video.currentTime = expectedClipTime;
      }
    }

    wasPlayingRef.current = isPlaying;
  }, [activeClip, currentTime, isPlaying, getExpectedClipTime]);

  // Sync background audio - optimized similarly
  useEffect(() => {
    if (!bgAudioRef.current || !backgroundAudio.url) return;

    const audio = bgAudioRef.current;
    audio.volume = backgroundAudio.muted ? 0 : backgroundAudio.volume;

    if (isPlaying) {
      const drift = Math.abs(audio.currentTime - currentTime);
      
      // Only seek if drifted too far
      if (drift > SEEK_THRESHOLD) {
        audio.currentTime = currentTime;
      }
      
      if (audio.paused) {
        audio.play().catch(() => {});
      }
    } else {
      audio.pause();
      // Seek to exact position when paused
      const drift = Math.abs(audio.currentTime - currentTime);
      if (drift > 0.05) {
        audio.currentTime = currentTime;
      }
    }
  }, [backgroundAudio, currentTime, isPlaying]);

  // Render image to canvas if active clip is image
  useEffect(() => {
    if (!canvasRef.current || !activeClip || activeClip.type !== "image") return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvasRef.current!.width = img.width;
      canvasRef.current!.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = activeClip.sourceUrl;
  }, [activeClip]);

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      {/* Video preview */}
      {activeClip?.type === "video" && (
        <video
          ref={videoRef}
          src={activeClip.sourceUrl}
          className="w-full h-full object-contain"
          muted={activeClip.muted}
          playsInline
          preload="auto"
        />
      )}

      {/* Image preview */}
      {activeClip?.type === "image" && (
        <canvas ref={canvasRef} className="w-full h-full object-contain" />
      )}

      {/* No content placeholder */}
      {!activeClip && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <p className="text-sm">No clip at current time</p>
        </div>
      )}

      {/* Background audio */}
      {backgroundAudio.url && (
        <audio ref={bgAudioRef} src={backgroundAudio.url} loop preload="auto" />
      )}

      {/* Time display */}
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs font-mono">
        {formatTime(currentTime)}
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}
