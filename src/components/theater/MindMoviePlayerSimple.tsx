import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useState,
  useMemo,
} from "react";
import { cn } from "@/lib/utils";
import { Loader2, Play } from "lucide-react";

/**
 * MindMoviePlayerSimple – iOS NATIVE HANDOFF (v5)
 *
 * On iOS: removes playsInline so tapping play opens Safari's native
 * fullscreen player. This avoids all GPU compositor crashes during
 * rotation. Events (ended, error, etc.) still fire on the <video> element.
 *
 * On desktop/Android: unchanged inline player with controls.
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

    // Stable callback refs
    const onCompleteRef = useRef(onComplete);
    const onErrorRef = useRef(onError);
    const restartOnInterruptRef = useRef(restartOnInterrupt);
    const disableSeekingRef = useRef(disableSeeking);

    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
    restartOnInterruptRef.current = restartOnInterrupt;
    disableSeekingRef.current = disableSeeking;

    const videoSrc = src || "";

    const isIOS = useMemo(() => {
      if (typeof navigator === "undefined") return false;
      return (
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
      );
    }, []);

    /**
     * On iOS, trigger native fullscreen playback.
     * webkitEnterFullscreen() hands off to Safari's native player
     * which handles rotation, hardware decoding, and fullscreen perfectly.
     */
    const playWithNativeHandoff = async (video: HTMLVideoElement) => {
      try {
        // On iOS, use the native fullscreen player
        if (isIOS && (video as any).webkitEnterFullscreen) {
          await video.play();
          (video as any).webkitEnterFullscreen();
        } else {
          await video.play();
        }
        setNeedsTap(false);
      } catch {
        setNeedsTap(true);
      }
    };

    useImperativeHandle(ref, () => ({
      play: async () => {
        const video = videoRef.current;
        if (video) await playWithNativeHandoff(video);
      },
      pause: () => videoRef.current?.pause(),
      restart: () => {
        const v = videoRef.current;
        if (v) {
          completedRef.current = false;
          v.currentTime = 0;
          playWithNativeHandoff(v);
        }
      },
      getVideoElement: () => videoRef.current,
    }));

    const handleTapToPlay = () => {
      const video = videoRef.current;
      if (video) {
        playWithNativeHandoff(video);
      }
    };

    // Main video setup effect
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
          }, 1000);
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

        // SAFE cleanup: just pause. Do NOT destroy the source.
        try {
          video.pause();
        } catch {
          // ignore
        }
      };
    }, [videoSrc, disableSeeking]);

    return (
      <div className={cn("relative w-full h-full bg-black", className)}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-contain"
          style={{ borderRadius: 0 }}
          controls
          // On iOS: omit playsInline so native player can take over for fullscreen
          // On desktop/Android: keep playsInline for inline playback
          {...(!isIOS && { playsInline: true })}
          // @ts-ignore – legacy iOS attribute (only needed for non-iOS fallback)
          {...(!isIOS && { "webkit-playsinline": "" })}
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
