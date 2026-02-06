import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { cn } from "@/lib/utils";

/**
 * MindMoviePlayerSimple - ULTRA STABLE VERSION
 * 
 * Designed to survive iOS PWA expand + rotate without crashing.
 * Uses ONLY native HTML5 video with minimal React interference.
 * 
 * Key stability features:
 * - No orientation listeners
 * - No resize observers
 * - No timeupdate handlers (only ended event)
 * - Deferred cleanup to avoid React StrictMode issues
 * - Direct storage URLs in standalone mode (no proxy)
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

// (Device detection removed — proxy routing eliminated for stability)

export const MindMoviePlayer = forwardRef<MindMoviePlayerHandle, MindMoviePlayerProps>(
  (
    {
      src,
      disableSeeking = false,
      restartOnInterrupt = false,
      onComplete,
      onError,
      className,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const completedRef = useRef(false);
    const mountedRef = useRef(true);
    const lastPlayPositionRef = useRef(0);

    // Use direct URL for maximum compatibility
    const videoSrc = src || "";

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

    // Handle video ended
    const handleEnded = useCallback(() => {
      if (!mountedRef.current || completedRef.current) return;
      
      const video = videoRef.current;
      if (!video) return;
      
      // Validate this is a real end (within 2 seconds of duration)
      const duration = video.duration || 0;
      const currentTime = video.currentTime || 0;
      if (duration > 0 && Math.abs(duration - currentTime) > 2) {
        console.log('[MindMoviePlayer] Ignoring premature ended event');
        return;
      }
      
      completedRef.current = true;
      onComplete?.(Math.floor(duration));
    }, [onComplete]);

    // Handle video error
    const handleError = useCallback(() => {
      if (!mountedRef.current) return;
      const video = videoRef.current;
      const errorMsg = video?.error?.message || "Video playback error";
      console.error('[MindMoviePlayer] Error:', video?.error?.code, errorMsg);
      onError?.(errorMsg);
    }, [onError]);

    // Handle pause for restart-on-interrupt
    const handlePause = useCallback(() => {
      if (!mountedRef.current || !restartOnInterrupt) return;
      const video = videoRef.current;
      if (!video || completedRef.current) return;
      
      // Store position when paused
      lastPlayPositionRef.current = video.currentTime;
    }, [restartOnInterrupt]);

    // Handle play after pause (restart from beginning if interrupted)
    const handlePlay = useCallback(() => {
      if (!mountedRef.current || !restartOnInterrupt) return;
      const video = videoRef.current;
      if (!video || completedRef.current) return;
      
      // If video was playing and got interrupted (position changed), restart
      if (lastPlayPositionRef.current > 0 && video.currentTime > 0.5) {
        video.currentTime = 0;
        lastPlayPositionRef.current = 0;
      }
    }, [restartOnInterrupt]);

    // Handle seeking prevention
    const handleSeeking = useCallback(() => {
      if (!mountedRef.current || !disableSeeking) return;
      const video = videoRef.current;
      if (!video) return;
      
      // Allow seeking near current position (within 2 seconds)
      const diff = Math.abs(video.currentTime - lastPlayPositionRef.current);
      if (diff > 2) {
        video.currentTime = lastPlayPositionRef.current;
      }
    }, [disableSeeking]);

    // Track time for seeking prevention
    const handleTimeUpdate = useCallback(() => {
      if (!mountedRef.current) return;
      const video = videoRef.current;
      if (video && !video.paused) {
        lastPlayPositionRef.current = video.currentTime;
      }
    }, []);

    // Setup and cleanup
    useEffect(() => {
      mountedRef.current = true;
      completedRef.current = false;
      lastPlayPositionRef.current = 0;
      
      const video = videoRef.current;
      if (!video) return;

      // Add event listeners
      video.addEventListener("ended", handleEnded);
      video.addEventListener("error", handleError);
      video.addEventListener("pause", handlePause);
      video.addEventListener("play", handlePlay);
      
      if (disableSeeking) {
        video.addEventListener("seeking", handleSeeking);
        video.addEventListener("timeupdate", handleTimeUpdate);
      }

      return () => {
        mountedRef.current = false;
        
        video.removeEventListener("ended", handleEnded);
        video.removeEventListener("error", handleError);
        video.removeEventListener("pause", handlePause);
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("seeking", handleSeeking);
        video.removeEventListener("timeupdate", handleTimeUpdate);
        
        // Deferred cleanup to survive React StrictMode
        setTimeout(() => {
          try {
            video.pause();
            video.removeAttribute('src');
            video.load();
          } catch {
            // Ignore cleanup errors
          }
        }, 100);
      };
    }, [videoSrc, handleEnded, handleError, handlePause, handlePlay, handleSeeking, handleTimeUpdate, disableSeeking]);

    return (
      <div className={cn("relative w-full h-full bg-black", className)}>
        <video
          ref={videoRef}
          src={videoSrc}
          className="theater-video w-full h-full object-contain"
          controls
          playsInline
          preload="metadata"
          // iOS-specific attributes for stability
          webkit-playsinline="true"
        />
      </div>
    );
  }
);

MindMoviePlayer.displayName = "MindMoviePlayer";
