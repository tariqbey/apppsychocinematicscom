import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { cn } from "@/lib/utils";

/**
 * MindMoviePlayerSimple
 * 
 * Ultra-stable player that relies on the browser's native video UI.
 * This intentionally avoids:
 * - custom overlays
 * - custom fullscreen buttons
 * - orientation/fullscreen event juggling
 * - frequent React state updates during playback
 */

export interface MindMoviePlayerProps {
  src: string;
  /** Block seeking / scrubbing (default false) */
  disableSeeking?: boolean;
  /** If true, pausing requires restart from 0 (default false) */
  restartOnInterrupt?: boolean;
  /** Called once when video finishes completely */
  onComplete?: (durationSeconds: number) => void;
  /** Called on any playback error */
  onError?: (message: string) => void;
  /** Custom class for the wrapper */
  className?: string;
  /** Show native controls instead of custom (default false) */
  nativeControls?: boolean;
  /** Show diagnostics overlay for debugging (default false) */
  showDiagnostics?: boolean;
  /** Enable smooth playback pre-download (ignored in this simplified version) */
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
      disableSeeking = false,
      restartOnInterrupt = false,
      onComplete,
      onError,
      className,
      showDiagnostics = false,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hasCompletedRef = useRef(false);
    const lastAllowedTimeRef = useRef(0);
    const wasInterruptedRef = useRef(false);

    const isIOS = useMemo(() => {
      if (typeof navigator === "undefined") return false;
      return (
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
      );
    }, []);

    // iOS: proxy storage URLs through the Range-safe video proxy.
    const effectiveSrc = useMemo(() => {
      if (!isIOS || !src) return src;
      if (src.includes("/functions/v1/video-proxy")) return src;
      if (!src.includes("/storage/v1/object/")) return src;
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!baseUrl) return src;
      return `${baseUrl}/functions/v1/video-proxy?url=${encodeURIComponent(src)}`;
    }, [isIOS, src]);

    useImperativeHandle(ref, () => ({
      play: async () => {
        const video = videoRef.current;
        if (!video) return;
        if (restartOnInterrupt && wasInterruptedRef.current) {
          try {
            video.currentTime = 0;
          } catch {
            // ignore
          }
          wasInterruptedRef.current = false;
        }
        await video.play();
      },
      pause: () => {
        videoRef.current?.pause();
      },
      restart: () => {
        const video = videoRef.current;
        if (!video) return;
        try {
          video.currentTime = 0;
        } catch {
          // ignore
        }
        hasCompletedRef.current = false;
        wasInterruptedRef.current = false;
        lastAllowedTimeRef.current = 0;
      },
      getVideoElement: () => videoRef.current,
    }));

    // Hard cleanup on unmount: stop audio pipeline even on mobile fullscreen.
    useEffect(() => {
      return () => {
        const video = videoRef.current;
        if (!video) return;
        try {
          video.pause();
          video.removeAttribute("src");
          video.load();
        } catch {
          // ignore
        }
      };
    }, []);

    // Attach only essential listeners (no frequent setState during playback).
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      hasCompletedRef.current = false;
      wasInterruptedRef.current = false;
      lastAllowedTimeRef.current = 0;

      const handleTimeUpdate = () => {
        // Keep as ref (no React state).
        lastAllowedTimeRef.current = video.currentTime;
      };

      const handleSeeking = () => {
        if (!disableSeeking) return;
        // Snap back to last allowed position.
        try {
          video.currentTime = lastAllowedTimeRef.current;
        } catch {
          // ignore
        }
      };

      const handlePause = () => {
        if (!restartOnInterrupt) return;
        if (!video.ended && video.currentTime > 0.5) {
          wasInterruptedRef.current = true;
        }
      };

      const handlePlay = () => {
        if (!restartOnInterrupt) return;
        if (wasInterruptedRef.current) {
          wasInterruptedRef.current = false;
          try {
            video.currentTime = 0;
          } catch {
            // ignore
          }
        }
      };

      const handleEnded = () => {
        const dur = video.duration;
        const pos = video.currentTime;
        // Guard against premature "ended" on flaky mobile streams.
        if (
          !hasCompletedRef.current &&
          Number.isFinite(dur) &&
          dur > 5 &&
          pos >= dur - 2
        ) {
          hasCompletedRef.current = true;
          onComplete?.(Math.floor(dur));
        }
      };

      const handleError = () => {
        const err = video.error;
        const msg = err?.message || "Playback error";
        onError?.(msg);
      };

      video.addEventListener("timeupdate", handleTimeUpdate);
      video.addEventListener("seeking", handleSeeking);
      video.addEventListener("pause", handlePause);
      video.addEventListener("play", handlePlay);
      video.addEventListener("ended", handleEnded);
      video.addEventListener("error", handleError);

      return () => {
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("seeking", handleSeeking);
        video.removeEventListener("pause", handlePause);
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("ended", handleEnded);
        video.removeEventListener("error", handleError);
      };
    }, [effectiveSrc, disableSeeking, restartOnInterrupt, onComplete, onError]);

    return (
      <div className={cn("relative w-full h-full bg-background overflow-hidden", className)}>
        <video
          ref={videoRef}
          src={effectiveSrc}
          className="theater-video w-full h-full object-contain"
          // iOS is most stable when it controls fullscreen itself.
          playsInline={!isIOS}
          preload="metadata"
          controls
        />

        {showDiagnostics && (
          <div className="absolute top-2 left-2 rounded-md border border-border bg-card/80 px-2 py-1 text-xs text-foreground backdrop-blur">
            <div>iOS: {isIOS ? "Yes" : "No"}</div>
            <div>Seeking locked: {disableSeeking ? "Yes" : "No"}</div>
            <div>Restart on pause: {restartOnInterrupt ? "Yes" : "No"}</div>
          </div>
        )}
      </div>
    );
  }
);

MindMoviePlayer.displayName = "MindMoviePlayer";
