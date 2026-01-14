import { useRef, useEffect, useState } from "react";
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

export function TimelinePreview({
  clips,
  currentTime,
  isPlaying,
  backgroundAudio,
}: TimelinePreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const bgAudioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeClip, setActiveClip] = useState<TimelineClip | null>(null);

  // Find active video/image clip at current time
  useEffect(() => {
    const videoClips = clips.filter((c) => c.type === "video" || c.type === "image");
    const active = videoClips.find(
      (clip) =>
        currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration
    );
    setActiveClip(active || null);
  }, [clips, currentTime]);

  // Sync video playback with timeline
  useEffect(() => {
    if (!videoRef.current || !activeClip || activeClip.type !== "video") return;

    const clipTime = currentTime - activeClip.startTime + activeClip.trimStart;

    if (isPlaying) {
      videoRef.current.currentTime = clipTime;
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = clipTime;
    }
  }, [activeClip, currentTime, isPlaying]);

  // Sync background audio
  useEffect(() => {
    if (!bgAudioRef.current || !backgroundAudio.url) return;

    bgAudioRef.current.volume = backgroundAudio.muted ? 0 : backgroundAudio.volume;

    if (isPlaying) {
      bgAudioRef.current.currentTime = currentTime;
      bgAudioRef.current.play().catch(() => {});
    } else {
      bgAudioRef.current.pause();
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
        <audio ref={bgAudioRef} src={backgroundAudio.url} loop />
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
