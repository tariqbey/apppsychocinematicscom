import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Play, Pause, VolumeX, Volume2, Maximize, Minimize2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * MindMoviePlayer – Simplified, stable video player.
 * 
 * Key principles:
 * - Minimal state management
 * - No complex recovery loops that cause crashes
 * - Native browser fullscreen only (no custom overlays that conflict with z-index)
 * - Clean unmount cleanup
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
      nativeControls = false,
      showDiagnostics = false,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const hasCompletedRef = useRef(false);
    const pauseRequestedRef = useRef(false);
    const lastTimeUpdateMsRef = useRef(0);
    const bufferingTimerRef = useRef<number | null>(null);
    const iosNativeFullscreenRef = useRef(false);

    // Simple state
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isBuffering, setIsBuffering] = useState(false);
    const [wasInterrupted, setWasInterrupted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);

    // Control visibility timer
    const hideTimerRef = useRef<number | null>(null);

    // Detect iOS for special handling
    const isIOS = useMemo(() => {
      if (typeof navigator === "undefined") return false;
      return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    }, []);

    // Proxy video URLs through video-proxy for iOS Range request compatibility
    const effectiveSrc = useMemo(() => {
      if (!isIOS || !src) return src;
      if (src.includes("/functions/v1/video-proxy")) return src;
      if (!src.includes("/storage/v1/object/")) return src;
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!baseUrl) return src;
      return `${baseUrl}/functions/v1/video-proxy?url=${encodeURIComponent(src)}`;
    }, [isIOS, src]);

    // Expose imperative handle
    useImperativeHandle(ref, () => ({
      play: async () => {
        const video = videoRef.current;
        if (!video) return;
        if (restartOnInterrupt && wasInterrupted) {
          video.currentTime = 0;
          setWasInterrupted(false);
        }
        await video.play();
      },
      pause: () => videoRef.current?.pause(),
      restart: () => {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = 0;
        hasCompletedRef.current = false;
        setWasInterrupted(false);
      },
      getVideoElement: () => videoRef.current,
    }));

    // Cleanup on unmount - force stop everything
    useEffect(() => {
      return () => {
        console.log('[MindMoviePlayer] Unmount cleanup');
        const video = videoRef.current;
        if (video) {
          try {
            video.pause();
            video.removeAttribute('src');
            video.load();
          } catch (e) {
            console.warn('[MindMoviePlayer] Cleanup error:', e);
          }
        }
        if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
        if (bufferingTimerRef.current) window.clearTimeout(bufferingTimerRef.current);
      };
    }, []);

    // Reset on src change
    useEffect(() => {
      hasCompletedRef.current = false;
      setWasInterrupted(false);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
    }, [effectiveSrc]);

    // Video event handlers
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const handleLoadedMetadata = () => {
        const dur = video.duration;
        if (Number.isFinite(dur) && dur > 0) {
          setDuration(dur);
        }
      };

      const handleTimeUpdate = () => {
        // Throttle time state updates to avoid heavy rerendering on mobile fullscreen/rotation.
        const now = typeof performance !== "undefined" ? performance.now() : Date.now();
        if (now - lastTimeUpdateMsRef.current < 250) return;
        lastTimeUpdateMsRef.current = now;
        setCurrentTime(video.currentTime);
      };

      const handlePlay = () => {
        setIsPlaying(true);
        setIsBuffering(false);
      };

      const handlePause = () => {
        setIsPlaying(false);
        if (pauseRequestedRef.current && !video.ended && video.currentTime > 0.5) {
          setWasInterrupted(true);
        }
        pauseRequestedRef.current = false;
      };

      const setBufferingDelayed = () => {
        // Avoid spinner flashing during brief stalls.
        if (bufferingTimerRef.current) window.clearTimeout(bufferingTimerRef.current);
        bufferingTimerRef.current = window.setTimeout(() => {
          setIsBuffering(true);
        }, 450);
      };

      const clearBuffering = () => {
        if (bufferingTimerRef.current) window.clearTimeout(bufferingTimerRef.current);
        bufferingTimerRef.current = null;
        setIsBuffering(false);
      };

      const handleWaiting = () => setBufferingDelayed();
      const handlePlaying = () => clearBuffering();
      const handleCanPlay = () => clearBuffering();

      const handleEnded = () => {
        setIsPlaying(false);
        const dur = video.duration;
        const pos = video.currentTime;
        
        // Only count as complete if we're genuinely near the end
        if (!hasCompletedRef.current && Number.isFinite(dur) && dur > 5 && pos >= dur - 2) {
          hasCompletedRef.current = true;
          console.log('[MindMoviePlayer] Video completed');
          onComplete?.(Math.floor(dur));
        }
      };

      const handleError = () => {
        const err = video.error;
        const msg = err?.message || "Playback error";
        console.error('[MindMoviePlayer] Error:', msg);
        onError?.(msg);
      };

      const handleFullscreenChange = () => {
        const isFs = !!document.fullscreenElement;
        setIsFullscreen(isFs || iosNativeFullscreenRef.current);
      };

      // iOS native fullscreen events (not reflected in document.fullscreenElement)
      const handleWebkitBeginFullscreen = () => {
        iosNativeFullscreenRef.current = true;
        setIsFullscreen(true);
      };

      const handleWebkitEndFullscreen = () => {
        iosNativeFullscreenRef.current = false;
        setIsFullscreen(!!document.fullscreenElement);
      };

      // Rotation can pause/stall playback in fullscreen on some devices.
      const handleOrientationChange = () => {
        const v = videoRef.current;
        if (!v) return;
        const wasPlayingBefore = !v.paused && !v.ended;

        // Let the browser finish relayout, then try to resume if it got paused.
        window.setTimeout(() => {
          const vv = videoRef.current;
          if (!vv) return;
          if (wasPlayingBefore && vv.paused && !vv.ended) {
            vv.play().catch(() => {
              // Autoplay restrictions may block this; ignore.
            });
          }
        }, 250);
      };

      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      video.addEventListener("timeupdate", handleTimeUpdate);
      video.addEventListener("play", handlePlay);
      video.addEventListener("pause", handlePause);
      video.addEventListener("waiting", handleWaiting);
      video.addEventListener("playing", handlePlaying);
      video.addEventListener("canplay", handleCanPlay);
      video.addEventListener("ended", handleEnded);
      video.addEventListener("error", handleError);
      video.addEventListener("webkitbeginfullscreen" as any, handleWebkitBeginFullscreen);
      video.addEventListener("webkitendfullscreen" as any, handleWebkitEndFullscreen);
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      window.addEventListener("orientationchange", handleOrientationChange);

      return () => {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("pause", handlePause);
        video.removeEventListener("waiting", handleWaiting);
        video.removeEventListener("playing", handlePlaying);
        video.removeEventListener("canplay", handleCanPlay);
        video.removeEventListener("ended", handleEnded);
        video.removeEventListener("error", handleError);
        video.removeEventListener("webkitbeginfullscreen" as any, handleWebkitBeginFullscreen);
        video.removeEventListener("webkitendfullscreen" as any, handleWebkitEndFullscreen);
        document.removeEventListener("fullscreenchange", handleFullscreenChange);
        window.removeEventListener("orientationchange", handleOrientationChange);
      };
    }, [effectiveSrc, onComplete, onError]);

    // Auto-hide controls
    const scheduleHide = useCallback(() => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
      if (isPlaying) {
        hideTimerRef.current = window.setTimeout(() => {
          setControlsVisible(false);
        }, 2500);
      }
    }, [isPlaying]);

    const showControls = useCallback(() => {
      setControlsVisible(true);
      scheduleHide();
    }, [scheduleHide]);

    useEffect(() => {
      if (!isPlaying) {
        setControlsVisible(true);
      } else {
        scheduleHide();
      }
    }, [isPlaying, scheduleHide]);

    // User actions
    const togglePlay = async () => {
      const video = videoRef.current;
      if (!video) return;

      if (isPlaying) {
        pauseRequestedRef.current = true;
        video.pause();
      } else {
        if (restartOnInterrupt && wasInterrupted) {
          video.currentTime = 0;
          setWasInterrupted(false);
        }
        try {
          await video.play();
        } catch (e) {
          console.warn('[MindMoviePlayer] Play failed:', e);
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
      const video = videoRef.current;
      const wrapper = wrapperRef.current;
      const theaterContainer = (wrapper?.closest?.(".theater-player") as HTMLElement | null) ?? null;

      try {
        // If iOS native fullscreen is active, exit it first.
        if (iosNativeFullscreenRef.current && (video as any)?.webkitExitFullscreen) {
          (video as any).webkitExitFullscreen();
          return;
        }

        if (document.fullscreenElement) {
          await document.exitFullscreen();
          return;
        }

        // On iOS, prefer native video fullscreen (more stable during rotation).
        if (isIOS && (video as any)?.webkitEnterFullscreen) {
          (video as any).webkitEnterFullscreen();
          return;
        }

        // On other browsers, fullscreen the outer Theater container so our fullscreen CSS applies.
        const target = theaterContainer ?? wrapper;
        if (target?.requestFullscreen) {
          await target.requestFullscreen();
          return;
        }

        // Final fallback.
        if ((video as any)?.webkitEnterFullscreen) {
          (video as any).webkitEnterFullscreen();
        }
      } catch (e) {
        console.warn('[MindMoviePlayer] Fullscreen toggle failed:', e);
      }
    };

    const formatTime = (s: number) => {
      if (!Number.isFinite(s) || s < 0) return "--:--";
      const mins = Math.floor(s / 60);
      const secs = Math.floor(s % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
      <div
        ref={wrapperRef}
        className={cn(
          "relative w-full h-full bg-black overflow-hidden",
          className
        )}
        onMouseMove={showControls}
        onTouchStart={showControls}
      >
        <video
          ref={videoRef}
          src={effectiveSrc}
          className="theater-video w-full h-full object-contain"
          playsInline
          preload="auto"
          controls={nativeControls}
          controlsList="nodownload noremoteplayback"
          onClick={togglePlay}
        />

        {/* Buffering indicator */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-black/60 rounded-full p-4">
              <Loader2 className="w-10 h-10 text-gold animate-spin" />
            </div>
          </div>
        )}

        {/* Custom controls */}
        {!nativeControls && (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 pointer-events-none",
              controlsVisible ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 pointer-events-auto">
              {/* Progress bar */}
              <div
                className={cn(
                  "relative h-2 sm:h-1 bg-white/20 rounded-full mb-3 sm:mb-4 overflow-hidden",
                  disableSeeking && "cursor-default touch-none"
                )}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold to-amber-soft transition-all"
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
                  onClick={toggleFullscreen}
                  className="h-8 w-8 sm:h-10 sm:w-10 text-white"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Debug info */}
        {showDiagnostics && (
          <div className="absolute top-2 left-2 bg-black/80 text-white text-xs p-2 rounded z-20">
            <div>Playing: {isPlaying ? "Yes" : "No"}</div>
            <div>Buffering: {isBuffering ? "Yes" : "No"}</div>
            <div>Time: {currentTime.toFixed(1)}s / {duration.toFixed(1)}s</div>
            <div>Fullscreen: {isFullscreen ? "Yes" : "No"}</div>
          </div>
        )}
      </div>
    );
  }
);

MindMoviePlayer.displayName = "MindMoviePlayer";
