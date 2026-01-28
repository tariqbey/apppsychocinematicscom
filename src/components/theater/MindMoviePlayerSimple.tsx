import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { cn } from "@/lib/utils";

/**
 * MindMoviePlayerSimple - ULTRA MINIMAL VERSION
 * 
 * This is the most basic possible video player to avoid iOS PWA crashes.
 * It does NOTHING except:
 * 1. Render a native <video> element
 * 2. Cleanup on unmount
 * 3. Fire onComplete when video ends
 * 
 * NO custom controls, NO orientation listeners, NO fullscreen logic,
 * NO timeupdate handlers, NO seeking handlers.
 * Let the browser handle EVERYTHING.
 */

export interface MindMoviePlayerProps {
  src: string;
  disableSeeking?: boolean;
  restartOnInterrupt?: boolean;
  onComplete?: (durationSeconds: number) => void;
  onError?: (message: string) => void;
  className?: string;
  nativeControls?: boolean;
  showDiagnostics?: boolean;
  enableSmoothPlayback?: boolean;
}

export interface MindMoviePlayerHandle {
  play: () => Promise<void>;
  pause: () => void;
  restart: () => void;
  getVideoElement: () => HTMLVideoElement | null;
}

export const MindMoviePlayer = forwardRef<MindMoviePlayerHandle, MindMoviePlayerProps>(
  (
    {
      src,
      onComplete,
      onError,
      className,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const completedRef = useRef(false);

    // Expose minimal API
    useImperativeHandle(ref, () => ({
      play: async () => {
        try {
          await videoRef.current?.play();
        } catch {
          // Ignore autoplay errors
        }
      },
      pause: () => videoRef.current?.pause(),
      restart: () => {
        const v = videoRef.current;
        if (v) {
          completedRef.current = false;
          v.currentTime = 0;
          v.play().catch(() => {});
        }
      },
      getVideoElement: () => videoRef.current,
    }));

    // iOS detection - only for proxy decision
    const isIOS = useMemo(() => {
      if (typeof navigator === "undefined") return false;
      return (
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
      );
    }, []);

    // Proxy storage URLs on iOS for Range header compatibility
    const videoSrc = useMemo(() => {
      if (!src) return "";
      if (!isIOS) return src;
      if (src.includes("/functions/v1/video-proxy")) return src;
      if (!src.includes("/storage/v1/object/")) return src;
      
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!baseUrl) return src;
      return `${baseUrl}/functions/v1/video-proxy?url=${encodeURIComponent(src)}`;
    }, [src, isIOS]);

    // Cleanup on unmount - CRITICAL for preventing orphaned audio
    useEffect(() => {
      return () => {
        const video = videoRef.current;
        if (video) {
          try {
            video.pause();
            video.src = "";
            video.load();
          } catch {
            // Ignore
          }
        }
      };
    }, []);

    // Only two event listeners: ended and error
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      completedRef.current = false;

      const handleEnded = () => {
        if (completedRef.current) return;
        completedRef.current = true;
        onComplete?.(Math.floor(video.duration || 0));
      };

      const handleError = () => {
        onError?.(video.error?.message || "Video playback error");
      };

      video.addEventListener("ended", handleEnded);
      video.addEventListener("error", handleError);

      return () => {
        video.removeEventListener("ended", handleEnded);
        video.removeEventListener("error", handleError);
      };
    }, [videoSrc, onComplete, onError]);

    return (
      <div className={cn("relative w-full h-full bg-black", className)}>
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-contain"
          controls
          playsInline
          preload="auto"
        />
      </div>
    );
  }
);

MindMoviePlayer.displayName = "MindMoviePlayer";
