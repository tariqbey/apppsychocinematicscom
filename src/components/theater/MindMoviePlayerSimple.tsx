import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { Loader2, Play } from "lucide-react";

/**
 * MindMoviePlayerSimple – iOS-STABLE VERSION (v3)
 *
 * Stability features:
 * - NO crossOrigin attribute (prevents iOS CORS failures on public storage URLs)
 * - Stable useEffect via callback refs (no handler functions in dep array)
 * - Deferred cleanup to avoid React StrictMode double-mount issues
 * - Auto-retry (2x) for transient iOS decode/network errors
 * - Tap-to-play fallback for autoplay-blocked scenarios
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
    const retryCountRef = useRef(0);
    const [needsTap, setNeedsTap] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Store callbacks in refs so the effect never re-runs due to prop changes
    const onCompleteRef = useRef(onComplete);
    const onErrorRef = useRef(onError);
    const restartOnInterruptRef = useRef(restartOnInterrupt);
    const disableSeekingRef = useRef(disableSeeking);

    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
    restartOnInterruptRef.current = restartOnInterrupt;
    disableSeekingRef.current = disableSeeking;

    const videoSrc = src || "";

    // Expose minimal API
    useImperativeHandle(ref, () => ({
      play: async () => {
        try {
          await videoRef.current?.play();
          setNeedsTap(false);
        } catch {
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

    // Tap-to-play for iOS
    const handleTapToPlay = () => {
      const video = videoRef.current;
      if (video) {
        video.play().then(() => setNeedsTap(false)).catch(() => {});
      }
    };

    // Single stable effect — only re-runs when src or disableSeeking changes
    useEffect(() => {
      mountedRef.current = true;
      completedRef.current = false;
      lastPlayPositionRef.current = 0;
      retryCountRef.current = 0;
      setIsLoading(true);
      setNeedsTap(false);

      const video = videoRef.current;
      if (!video || !videoSrc) return;

      const onEnded = () => {
        if (!mountedRef.current || completedRef.current) return;
        const duration = video.duration || 0;
        const currentTime = video.currentTime || 0;
        if (duration > 0 && Math.abs(duration - currentTime) > 2) return;
        completedRef.current = true;
        onCompleteRef.current?.(Math.floor(duration));
      };

      const onErrorEvt = () => {
        if (!mountedRef.current) return;
        const code = video.error?.code;
        const msg = video.error?.message || "Video playback error";
        console.error("[MindMoviePlayer] Error:", code, msg);

        if (retryCountRef.current < 2 && (code === 2 || code === 3)) {
          retryCountRef.current += 1;
          console.log(`[MindMoviePlayer] Retry ${retryCountRef.current}/2`);
          setTimeout(() => {
            if (!mountedRef.current) return;
            video.load();
          }, 500);
          return;
        }
        setIsLoading(false);
        onErrorRef.current?.(msg);
      };

      const onPause = () => {
        if (!mountedRef.current || !restartOnInterruptRef.current || completedRef.current) return;
        lastPlayPositionRef.current = video.currentTime;
      };

      const onPlay = () => {
        if (!mountedRef.current) return;
        setNeedsTap(false);
        if (!restartOnInterruptRef.current || completedRef.current) return;
        if (lastPlayPositionRef.current > 0 && video.currentTime > 0.5) {
          video.currentTime = 0;
          lastPlayPositionRef.current = 0;
        }
      };

      const onCanPlay = () => {
        setIsLoading(false);
        retryCountRef.current = 0;
      };

      const onSeeking = () => {
        if (!mountedRef.current || !disableSeekingRef.current) return;
        const diff = Math.abs(video.currentTime - lastPlayPositionRef.current);
        if (diff > 2) {
          video.currentTime = lastPlayPositionRef.current;
        }
      };

      const onTimeUpdate = () => {
        if (!mountedRef.current) return;
        if (!video.paused) {
          lastPlayPositionRef.current = video.currentTime;
        }
      };

      video.addEventListener("ended", onEnded);
      video.addEventListener("error", onErrorEvt);
      video.addEventListener("pause", onPause);
      video.addEventListener("play", onPlay);
      video.addEventListener("canplay", onCanPlay);

      if (disableSeeking) {
        video.addEventListener("seeking", onSeeking);
        video.addEventListener("timeupdate", onTimeUpdate);
      }

      return () => {
        mountedRef.current = false;

        video.removeEventListener("ended", onEnded);
        video.removeEventListener("error", onErrorEvt);
        video.removeEventListener("pause", onPause);
        video.removeEventListener("play", onPlay);
        video.removeEventListener("canplay", onCanPlay);
        video.removeEventListener("seeking", onSeeking);
        video.removeEventListener("timeupdate", onTimeUpdate);

        // Deferred cleanup to survive StrictMode double-mount
        const ref = mountedRef;
        setTimeout(() => {
          if (ref.current) return;
          try {
            video.pause();
            video.removeAttribute("src");
            video.load();
          } catch {
            // ignore
          }
        }, 150);
      };
    }, [videoSrc, disableSeeking]);

    return (
      <div className={cn("relative w-full h-full bg-black", className)}>
        <video
          ref={videoRef}
          src={videoSrc}
          className="theater-video w-full h-full object-contain"
          controls
          playsInline
          preload="auto"
        />

        {isLoading && videoSrc && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
            <Loader2 className="w-10 h-10 text-gold animate-spin" />
          </div>
        )}

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
