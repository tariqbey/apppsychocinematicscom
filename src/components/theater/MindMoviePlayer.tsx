import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Play, Pause, VolumeX, Volume2, Maximize, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { VideoDiagnostics } from "./VideoDiagnostics";
/**
 * MindMoviePlayer – A rock-solid, iOS Safari-first video player.
 *
 * Design constraints
 * ------------------
 * • ZERO retry loops / aggressive event handlers that crash Safari.
 * • Single useEffect for all native video events → guaranteed cleanup.
 * • Throttled timeupdate to avoid render churn on low-end devices.
 * • No auto-play; user taps the play button (Safari requires gesture).
 * • Optional "ritual mode" props control whether scrubbing is allowed
 *   and whether interruptions force restart.
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
      nativeControls = false,
      showDiagnostics = false,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const isIOS = useMemo(() => {
      if (typeof navigator === "undefined") return false;
      return (
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
      );
    }, []);

    // Playback state
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [wasInterrupted, setWasInterrupted] = useState(false);
    const [isWidescreen, setIsWidescreen] = useState(false);

    // Refs for stable callbacks
    const hasCompleted = useRef(false);
    const lastTimeUpdate = useRef(0);

    // Expose imperative methods
    useImperativeHandle(ref, () => ({
      play: async () => {
        const video = videoRef.current;
        if (!video) return;
        if (restartOnInterrupt && wasInterrupted) {
          video.currentTime = 0;
          setCurrentTime(0);
          setWasInterrupted(false);
        }
        await video.play();
      },
      pause: () => videoRef.current?.pause(),
      restart: () => {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = 0;
        setCurrentTime(0);
        hasCompleted.current = false;
        setWasInterrupted(false);
      },
      getVideoElement: () => videoRef.current,
    }));

    // Single effect for all video listeners
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      hasCompleted.current = false;
      setWasInterrupted(false);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);

      // Handlers -------------------------------------------------
      const handleLoadedMetadata = () => {
        let dur = video.duration;
        if (!Number.isFinite(dur) || dur <= 0) {
          if (video.seekable.length > 0) {
            dur = video.seekable.end(video.seekable.length - 1);
          }
        }
        if (Number.isFinite(dur) && dur > 0) {
          setDuration(dur);
        }
      };

      const handleTimeUpdate = () => {
        // Throttle to avoid render churn (iOS is extremely sensitive)
        const throttleMs = isIOS ? 1000 : 250;
        const now = performance.now();
        if (now - lastTimeUpdate.current < throttleMs) return;
        lastTimeUpdate.current = now;
        setCurrentTime(video.currentTime);
      };

      const handlePlay = () => setIsPlaying(true);

      const handlePause = () => {
        setIsPlaying(false);
        // Mark interrupted only if NOT at end
        if (!video.ended && video.currentTime > 0.5) {
          setWasInterrupted(true);
        }
      };

      const handleEnded = () => {
        setIsPlaying(false);
        if (!hasCompleted.current) {
          hasCompleted.current = true;
          onComplete?.(Math.floor(video.duration || 0));
        }
      };

      const handleError = () => {
        const mediaErr = video.error;
        const msg =
          mediaErr?.message ||
          (mediaErr?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
            ? "Video format not supported"
            : "Playback error");
        onError?.(msg);
      };

      // Attach listeners ------------------------------------------
      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      video.addEventListener("durationchange", handleLoadedMetadata);
      video.addEventListener("timeupdate", handleTimeUpdate);
      video.addEventListener("play", handlePlay);
      video.addEventListener("pause", handlePause);
      video.addEventListener("ended", handleEnded);
      video.addEventListener("error", handleError);

      return () => {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video.removeEventListener("durationchange", handleLoadedMetadata);
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("pause", handlePause);
        video.removeEventListener("ended", handleEnded);
        video.removeEventListener("error", handleError);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src]); // only re-bind when src changes

    // Escape to exit widescreen overlay
    useEffect(() => {
      if (!isWidescreen) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsWidescreen(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isWidescreen]);

    // User actions -----------------------------------------------
    const togglePlay = async () => {
      const video = videoRef.current;
      if (!video) return;

      if (isPlaying) {
        video.pause();
      } else {
        try {
          if (restartOnInterrupt && wasInterrupted) {
            video.currentTime = 0;
            setCurrentTime(0);
            setWasInterrupted(false);
          }
          await video.play();
        } catch (err) {
          console.warn("Play failed", err);
        }
      }
    };

    const toggleMute = () => {
      const video = videoRef.current;
      if (!video) return;
      video.muted = !video.muted;
      setIsMuted(video.muted);
    };

    const toggleFullscreen = async () => {
      // iOS Safari fullscreen is a common crash trigger; we disable it entirely.
      if (isIOS) return;

      const el = wrapperRef.current;
      const video = videoRef.current;

      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else if (el?.requestFullscreen) {
          await el.requestFullscreen();
        } else if (video?.requestFullscreen) {
          await video.requestFullscreen();
        }
      } catch (err) {
        console.warn("Fullscreen failed", err);
      }
    };

    const toggleWidescreen = () => {
      // "Widescreen" is an in-app overlay (more stable than true fullscreen on mobile).
      // Users can rotate their device to landscape while in this mode.
      setIsWidescreen((v) => !v);
    };

    const formatTime = (s: number) => {
      if (!Number.isFinite(s) || s < 0) return "--:--";
      const mins = Math.floor(s / 60);
      const secs = Math.floor(s % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    // Render -----------------------------------------------------
    return (
      <div
        ref={wrapperRef}
        className={cn(
          "relative w-full h-full bg-black overflow-hidden group",
          isWidescreen && "fixed inset-0 z-[80] rounded-none",
          className
        )}
      >
        {/* Diagnostics overlay for debugging */}
        {showDiagnostics && (
          <VideoDiagnostics videoRef={videoRef} videoSrc={src} />
        )}

        <video
          ref={videoRef}
          src={src}
          className="theater-video w-full h-full object-contain"
          playsInline
          webkit-playsinline="true"
          preload={isIOS ? "none" : "metadata"}
          disablePictureInPicture
          controls={nativeControls}
          controlsList="nodownload noremoteplayback nofullscreen"
          onClick={isIOS ? undefined : togglePlay}
        />

        {/* Custom controls overlay */}
        {!nativeControls && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 pointer-events-auto">
              {/* Progress bar (non-interactive when seeking disabled) */}
              <div
                className={cn(
                  "h-2 sm:h-1 bg-white/30 rounded-full mb-3 sm:mb-4 overflow-hidden",
                  disableSeeking && "cursor-default touch-none"
                )}
              >
                <div
                  className="h-full bg-gradient-to-r from-gold to-amber-soft transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-4">
                  <Button
                    variant="gold"
                    size="icon"
                    onClick={togglePlay}
                    className="w-10 h-10 sm:w-12 sm:h-12"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="h-8 w-8 sm:h-10 sm:w-10 text-white"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </Button>

                  <span className="text-xs sm:text-sm text-white font-mono bg-black/50 px-2 py-0.5 rounded">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={isIOS ? toggleWidescreen : toggleFullscreen}
                  className="h-8 w-8 sm:h-10 sm:w-10 text-white"
                >
                  {isWidescreen ? (
                    <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

MindMoviePlayer.displayName = "MindMoviePlayer";
