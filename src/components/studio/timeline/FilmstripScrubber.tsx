import { useState, useRef, useEffect, useCallback, memo } from "react";
import { cn } from "@/lib/utils";

interface FilmstripScrubberProps {
  videoUrl: string;
  duration: number;
  currentTime: number;
  width: number;
  height?: number;
  frameCount?: number;
  onSeek?: (time: number) => void;
  className?: string;
  showOnDrag?: boolean;
  isDragging?: boolean;
}

// Extract frames from video at specified intervals
async function extractVideoFrames(
  videoUrl: string,
  duration: number,
  frameCount: number
): Promise<string[]> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.src = videoUrl;
    video.muted = true;
    video.preload = "metadata";

    const frames: string[] = [];
    let currentFrame = 0;
    const interval = duration / frameCount;

    video.onloadeddata = async () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      // Use smaller dimensions for thumbnails
      canvas.width = 80;
      canvas.height = 45;

      const captureFrame = () => {
        if (currentFrame >= frameCount || !ctx) {
          video.pause();
          resolve(frames);
          return;
        }

        const time = currentFrame * interval;
        video.currentTime = time;
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frames.push(canvas.toDataURL("image/jpeg", 0.6));
        }
        currentFrame++;
        captureFrame();
      };

      captureFrame();
    };

    video.onerror = () => {
      console.error("Failed to load video for frame extraction");
      resolve([]);
    };

    // Timeout after 10 seconds
    setTimeout(() => {
      if (frames.length === 0) {
        resolve([]);
      }
    }, 10000);
  });
}

export const FilmstripScrubber = memo(function FilmstripScrubber({
  videoUrl,
  duration,
  currentTime,
  width,
  height = 48,
  frameCount = 10,
  onSeek,
  className,
  showOnDrag = false,
  isDragging = false,
}: FilmstripScrubberProps) {
  const [frames, setFrames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract frames on mount
  useEffect(() => {
    if (!videoUrl || duration <= 0) return;

    setIsLoading(true);
    extractVideoFrames(videoUrl, duration, frameCount)
      .then((extractedFrames) => {
        setFrames(extractedFrames);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [videoUrl, duration, frameCount]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current || !onSeek) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = (x / width) * duration;
      setHoveredTime(Math.max(0, Math.min(duration, time)));
    },
    [width, duration, onSeek]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredTime(null);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current || !onSeek) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = (x / width) * duration;
      onSeek(Math.max(0, Math.min(duration, time)));
    },
    [width, duration, onSeek]
  );

  // Calculate which frame to highlight
  const currentFrameIndex = Math.floor((currentTime / duration) * frames.length);
  const hoveredFrameIndex =
    hoveredTime !== null
      ? Math.floor((hoveredTime / duration) * frames.length)
      : null;

  // Frame width based on available space
  const frameWidth = frames.length > 0 ? width / frames.length : width / frameCount;

  if (showOnDrag && !isDragging) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-md border border-border/50 bg-background/80 backdrop-blur-sm",
        onSeek && "cursor-pointer",
        className
      )}
      style={{ width, height }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-6 bg-muted-foreground/30 rounded animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>
      ) : frames.length > 0 ? (
        <>
          {/* Frame strip */}
          <div className="flex h-full">
            {frames.map((frame, index) => (
              <div
                key={index}
                className={cn(
                  "relative flex-shrink-0 border-r border-border/30 transition-all",
                  index === currentFrameIndex && "ring-2 ring-primary ring-inset",
                  index === hoveredFrameIndex && "brightness-125"
                )}
                style={{ width: frameWidth, height }}
              >
                <img
                  src={frame}
                  alt={`Frame ${index + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                {/* Frame number overlay */}
                <span className="absolute bottom-0 right-0 text-[8px] bg-black/60 text-white px-0.5 rounded-tl">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>

          {/* Current time indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-lg z-10 pointer-events-none"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full" />
          </div>

          {/* Hover time indicator */}
          {hoveredTime !== null && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white/50 z-10 pointer-events-none"
              style={{ left: `${(hoveredTime / duration) * 100}%` }}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-card text-[10px] rounded shadow-lg whitespace-nowrap">
                {formatTime(hoveredTime)}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
          No frames available
        </div>
      )}
    </div>
  );
});

// Helper to format time
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`;
}

// Inline filmstrip for timeline clips
interface InlineFilmstripProps {
  videoUrl: string;
  duration: number;
  width: number;
  height?: number;
  className?: string;
}

export const InlineFilmstrip = memo(function InlineFilmstrip({
  videoUrl,
  duration,
  width,
  height = 40,
  className,
}: InlineFilmstripProps) {
  const [frames, setFrames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate frame count based on width (one frame per ~50px)
  const frameCount = Math.max(2, Math.min(10, Math.floor(width / 50)));

  useEffect(() => {
    if (!videoUrl || duration <= 0 || width < 40) return;

    setIsLoading(true);
    extractVideoFrames(videoUrl, duration, frameCount)
      .then((extractedFrames) => {
        setFrames(extractedFrames);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [videoUrl, duration, frameCount, width]);

  if (isLoading || frames.length === 0) {
    return null;
  }

  const frameWidth = width / frames.length;

  return (
    <div
      className={cn("absolute inset-0 flex overflow-hidden pointer-events-none", className)}
    >
      {frames.map((frame, index) => (
        <img
          key={index}
          src={frame}
          alt=""
          className="h-full object-cover flex-shrink-0 opacity-80"
          style={{ width: frameWidth }}
          draggable={false}
        />
      ))}
    </div>
  );
});
