import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useCallback,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { Loader2, Play } from "lucide-react";

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
    const [needsTap, setNeedsTap] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const retryCountRef = useRef(0);

    // Use direct URL for maximum compatibility
    const videoSrc = src || "";

    // Expose minimal API
    useImperativeHandle(ref, () => ({
      play: async () => {
        try {
          await videoRef.current?.play();
          setNeedsTap(false);
        } catch {
          // iOS often blocks autoplay — show tap-to-play
          setNeedsTap(true);
        }
      },
      pause: () => videoRef.current?.pause(),
      restart: () => {
        const v = videoRef.current;
        if (v) {
          completedRef.current = false;
          v.currentTime = 0;
          v.play().catch(() => setNeedsTap(true));
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

    // Handle video error with iOS retry
    const handleError = useCallback(() => {
      if (!mountedRef.current) return;
      const video = videoRef.current;
      const code = video?.error?.code;
      const errorMsg = video?.error?.message || "Video playback error";
      console.error('[MindMoviePlayer] Error:', code, errorMsg);
      
      // iOS often throws transient MEDIA_ERR_DECODE (3) or MEDIA_ERR_NETWORK (2)
      // Retry up to 2 times by reloading the source
      if (retryCountRef.current < 2 && (code === 2 || code === 3)) {
        retryCountRef.current += 1;
        console.log(`[MindMoviePlayer] Retry ${retryCountRef.current}/2`);
        setTimeout(() => {
          if (!mountedRef.current || !video) return;
          video.load();
        }, 500);
        return;
      }
      
      setIsLoading(false);
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
      
      setNeedsTap(false);
      
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

    const handleCanPlay = useCallback(() => {
      setIsLoading(false);
      retryCountRef.current = 0;
    }, []);

    // Tap-to-play for iOS
    const handleTapToPlay = useCallback(() => {
      const video = videoRef.current;
      if (video) {
        video.play().then(() => {
          setNeedsTap(false);
        }).catch(() => {
          // Still blocked — keep tap overlay
        });
      }
    }, []);

    // Setup and cleanup
    useEffect(() => {
      mountedRef.current = true;
      completedRef.current = false;
      lastPlayPositionRef.current = 0;
      retryCountRef.current = 0;
      setIsLoading(true);
      setNeedsTap(false);
      
      const video = videoRef.current;
      if (!video) return;

      // Add event listeners
      video.addEventListener("ended", handleEnded);
      video.addEventListener("error", handleError);
      video.addEventListener("pause", handlePause);
      video.addEventListener("play", handlePlay);
      video.addEventListener("canplay", handleCanPlay);
      
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
        video.removeEventListener("canplay", handleCanPlay);
        video.removeEventListener("seeking", handleSeeking);
        video.removeEventListener("timeupdate", handleTimeUpdate);
        
        // Deferred cleanup — skip if StrictMode remounted us
        const ref = mountedRef;
        setTimeout(() => {
          if (ref.current) return;
          try {
            video.pause();
            video.removeAttribute('src');
            video.load();
          } catch {
            // Ignore cleanup errors
          }
        }, 150);
      };
    }, [videoSrc, handleEnded, handleError, handlePause, handlePlay, handleSeeking, handleTimeUpdate, handleCanPlay, disableSeeking]);

    return (
      <div className={cn("relative w-full h-full bg-black", className)}>
        <video
          ref={videoRef}
          src={videoSrc}
          className="theater-video w-full h-full object-contain"
          controls
          playsInline
          preload="auto"
          crossOrigin="anonymous"
        />
        
        {/* Loading indicator */}
        {isLoading && videoSrc && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
            <Loader2 className="w-10 h-10 text-gold animate-spin" />
          </div>
        )}
        
        {/* iOS tap-to-play overlay */}
        {needsTap && (
          <button
            onClick={handleTapToPlay}
            className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 cursor-pointer"
            aria-label="Tap to play"
          >
            <div className="w-20 h-20 rounded-full bg-gold/90 flex items-center justify-center shadow-lg">
              <Play className="w-10 h-10 text-black ml-1" />
            </div>
          </button>
        )}
      </div>
    );
  }
);

MindMoviePlayer.displayName = "MindMoviePlayer";
