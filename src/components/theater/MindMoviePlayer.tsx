import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Play, Pause, VolumeX, Volume2, Maximize, Minimize2, Loader2 } from "lucide-react";
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

    const prefersNoHover = useMemo(() => {
      if (typeof window === "undefined" || !window.matchMedia) return false;
      return window.matchMedia("(hover: none)").matches;
    }, []);

    // On mobile/touch devices, we still auto-hide controls while playing to keep the
    // video unobstructed. User interaction will reveal controls temporarily.
    const isTouchUI = isIOS || prefersNoHover;

    // iOS Safari is extremely sensitive to imperfect Range/206 responses.
    // Route storage URLs through our Range-safe proxy automatically.
    const effectiveSrc = useMemo(() => {
      if (!isIOS) return src;
      if (!src) return src;
      if (src.includes("/functions/v1/video-proxy")) return src;
      if (!src.includes("/storage/v1/object/")) return src;

      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!baseUrl) return src;
      return `${baseUrl}/functions/v1/video-proxy?url=${encodeURIComponent(src)}`;
    }, [isIOS, src]);

    // Playback state
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [wasInterrupted, setWasInterrupted] = useState(false);
    const [isWidescreen, setIsWidescreen] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [bufferedPercent, setBufferedPercent] = useState(0);

    // Controls auto-hide state
    const [controlsVisible, setControlsVisible] = useState(true);
    const hideControlsTimeoutRef = useRef<number | null>(null);

    // Distinguish user-requested pauses from system/network pauses (iOS can fire
    // pause events during buffering). Only user pauses count as "interruption".
    const pauseRequestedRef = useRef(false);
    const autoResumeTimeoutRef = useRef<number | null>(null);

    // Track user intent for mute so we can recover from iOS/system-induced mute flips.
    const desiredMutedRef = useRef(false);

    // iOS audio watchdog: some devices can resume video after buffering with silent audio.
    const sawBufferingRef = useRef(false);
    const lastBufferingAtRef = useRef(0);
    const lastAudioBytesRef = useRef<number | null>(null);
    const hasSeenNonZeroAudioBytesRef = useRef(false);
    const lastAudioNudgeAtRef = useRef(0);
    const lastMediaTimeRef = useRef(0);
    const docHiddenRef = useRef(false);

    // Reduce false positives: require consecutive stalled samples before we recover.
    const audioStallCountRef = useRef(0);
    const audioRecoveryAttemptsRef = useRef(0);
    const audioNudgeTimeoutRef = useRef<number | null>(null);

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
      setControlsVisible(true);

      // Ensure audio is enabled by default
      video.muted = false;
      video.defaultMuted = false;
      video.volume = 1;
      desiredMutedRef.current = false;
      setIsMuted(false);

      sawBufferingRef.current = false;
      lastBufferingAtRef.current = 0;
      lastAudioBytesRef.current = null;
      hasSeenNonZeroAudioBytesRef.current = false;
      lastAudioNudgeAtRef.current = 0;
      lastMediaTimeRef.current = 0;
      docHiddenRef.current = typeof document !== "undefined" ? document.hidden : false;

      audioStallCountRef.current = 0;
      audioRecoveryAttemptsRef.current = 0;
      if (audioNudgeTimeoutRef.current) {
        window.clearTimeout(audioNudgeTimeoutRef.current);
        audioNudgeTimeoutRef.current = null;
      }

      const getAudioDecodedBytes = () => {
        const anyVideo = video as unknown as { webkitAudioDecodedByteCount?: unknown };
        const v = anyVideo.webkitAudioDecodedByteCount;
        return typeof v === "number" && Number.isFinite(v) ? v : null;
      };

      const ensureUnmuted = () => {
        if (desiredMutedRef.current) return;
        if (video.muted) {
          video.muted = false;
          video.defaultMuted = false;
        }
        if (video.volume === 0) video.volume = 1;
        setIsMuted(video.muted);
      };

      const nudgeAudioPipeline = (reason: string) => {
        // Throttle nudges to avoid Safari instability.
        const now = Date.now();
        if (now - lastAudioNudgeAtRef.current < 12000) return;
        lastAudioNudgeAtRef.current = now;

        if (desiredMutedRef.current) return;

        try {
          // iOS Safari: a brief mute/unmute is the least disruptive reinit.
          // Avoid volume manipulation (can cause audible drops + extra events).
          video.muted = true;
          video.defaultMuted = true;
          setIsMuted(true);

          if (audioNudgeTimeoutRef.current) window.clearTimeout(audioNudgeTimeoutRef.current);
          audioNudgeTimeoutRef.current = window.setTimeout(() => {
            const v = videoRef.current;
            if (!v) return;
            if (desiredMutedRef.current) return;
            v.muted = false;
            v.defaultMuted = false;
            if (v.volume === 0) v.volume = 1;
            setIsMuted(false);
            // Re-assert play to help iOS rehydrate the audio pipeline.
            void v.play().catch(() => {
              // User can tap play if needed.
            });
          }, 120);
        } catch (e) {
          // Never throw from here.
          console.warn("Audio nudge failed", { reason, e });
        }
      };

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

      const handlePlay = () => {
        setIsPlaying(true);
        setIsBuffering(false);
      };

      const handlePlaying = () => {
        setIsPlaying(true);
        setIsBuffering(false);
        ensureUnmuted();

        // If we just recovered from buffering, nudge the audio pipeline once.
        if (isIOS && sawBufferingRef.current) {
          nudgeAudioPipeline("buffer-recover");
          sawBufferingRef.current = false;
        }
      };

      const handleWaiting = () => {
        sawBufferingRef.current = true;
        lastBufferingAtRef.current = Date.now();
        setIsBuffering(true);
      };

      const handleStalled = () => {
        sawBufferingRef.current = true;
        lastBufferingAtRef.current = Date.now();
        setIsBuffering(true);
      };

      const handleCanPlay = () => {
        setIsBuffering(false);
      };

      const handleProgress = () => {
        // Update buffered percentage for visual feedback
        if (video.buffered.length > 0 && video.duration > 0) {
          const bufferedEnd = video.buffered.end(video.buffered.length - 1);
          const percent = (bufferedEnd / video.duration) * 100;
          setBufferedPercent(Math.min(100, percent));
        }
      };

      const handleVolumeChange = () => {
        // Keep React state in sync with the element.
        setIsMuted(video.muted);

        // iOS can sometimes flip muted during route changes / interruptions.
        if (!desiredMutedRef.current && (video.muted || video.volume === 0)) {
          video.muted = false;
          video.defaultMuted = false;
          if (video.volume === 0) video.volume = 1;
          setIsMuted(false);
        }
      };

      const handlePause = () => {
        setIsPlaying(false);

        const userPaused = pauseRequestedRef.current;
        pauseRequestedRef.current = false;

        // Mark interrupted only if user requested pause and NOT at end
        if (userPaused && !video.ended && video.currentTime > 0.5) {
          setWasInterrupted(true);
          return;
        }

        // If the pause was not user-requested, attempt a gentle resume.
        // IMPORTANT: only do this if we *just* buffered; otherwise we can create
        // play/pause loops that feel like "stuttering".
        const recentlyBuffered = Date.now() - (lastBufferingAtRef.current || 0) < 2500;
        if (!userPaused && recentlyBuffered && !video.ended && video.currentTime > 0.5) {
          if (autoResumeTimeoutRef.current) window.clearTimeout(autoResumeTimeoutRef.current);
          autoResumeTimeoutRef.current = window.setTimeout(() => {
            // Only resume if we are still paused and the user didn't mute/stop intentionally.
            if (!videoRef.current) return;
            if (!videoRef.current.paused) return;
            if (docHiddenRef.current) return;
            // Avoid calling play() while the media isn't ready; it can lead to weird iOS states.
            if (videoRef.current.readyState < 2) return;
            // If we want audio, enforce it before resuming.
            if (!desiredMutedRef.current) {
              videoRef.current.muted = false;
              videoRef.current.defaultMuted = false;
              if (videoRef.current.volume === 0) videoRef.current.volume = 1;
            }
            void videoRef.current.play().catch(() => {
              // Let the user retry manually.
            });
          }, 400);
        }
      };

      const handleEnded = () => {
        setIsPlaying(false);

        // iOS Safari can fire 'ended' prematurely due to network issues or metadata problems.
        // Guard: only complete if we're actually near the end of the video (within 2 seconds)
        // and the duration is a reasonable length (> 10 seconds for mind movies).
        const dur = video.duration;
        const pos = video.currentTime;
        const isNearEnd = Number.isFinite(dur) && dur > 10 && pos >= dur - 2;

        if (!hasCompleted.current && isNearEnd) {
          hasCompleted.current = true;
          onComplete?.(Math.floor(dur));
        } else if (!hasCompleted.current && !isNearEnd) {
          // Video "ended" prematurely - likely iOS network issue.
          // Try to recover by reloading.
          console.warn(`Video ended prematurely at ${pos.toFixed(1)}s / ${dur}s - attempting recovery`);
          // On iOS, calling load() can help reset the stream.
          video.load();
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

      const handleVisibilityChange = () => {
        docHiddenRef.current = document.hidden;

        // If the doc becomes visible again and video is paused unexpectedly,
        // give it a chance to resume with audio intact.
        if (!docHiddenRef.current) {
          ensureUnmuted();
          if (!video.ended && video.paused && video.currentTime > 0.5 && video.readyState >= 2) {
            // A small delay helps iOS rehydrate its media pipeline.
            window.setTimeout(() => {
              if (!videoRef.current) return;
              if (document.hidden) return;
              if (!videoRef.current.paused) return;
              ensureUnmuted();
              void videoRef.current.play().catch(() => {
                // User can tap play.
              });
            }, 250);
          }
        }
      };

      // iOS audio watchdog interval (only if Safari exposes decoded audio byte count)
      const audioWatchdogInterval = window.setInterval(() => {
        if (!isIOS) return;
        if (docHiddenRef.current) return;
        if (video.paused || video.ended) return;
        if (desiredMutedRef.current || video.muted || video.volume === 0) return;

        const bytes = getAudioDecodedBytes();
        if (bytes == null) return;
        if (bytes > 0) hasSeenNonZeroAudioBytesRef.current = true;

        // Only attempt recovery if we've *ever* seen non-zero bytes (avoids false positives).
        if (hasSeenNonZeroAudioBytesRef.current && lastAudioBytesRef.current != null) {
          const timeAdvanced = video.currentTime - (lastMediaTimeRef.current || 0);
          const bytesStalled = bytes === lastAudioBytesRef.current;

          // Require consecutive stalled samples before nudging.
          if (video.currentTime > 2 && timeAdvanced > 0.9 && bytesStalled) {
            audioStallCountRef.current += 1;
          } else {
            audioStallCountRef.current = 0;
            audioRecoveryAttemptsRef.current = 0;
          }

          if (audioStallCountRef.current >= 2) {
            audioStallCountRef.current = 0;
            audioRecoveryAttemptsRef.current += 1;

            // Step 1: gentle nudge. Step 2+: nudge again (throttled).
            // We avoid programmatic reload/seek here because it can be more unstable than silence.
            nudgeAudioPipeline(audioRecoveryAttemptsRef.current > 1 ? "watchdog-repeat" : "watchdog");
          }
        }

        lastMediaTimeRef.current = video.currentTime;
        lastAudioBytesRef.current = bytes;
      }, 2000);

      // Attach listeners ------------------------------------------
      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      video.addEventListener("durationchange", handleLoadedMetadata);
      video.addEventListener("timeupdate", handleTimeUpdate);
      video.addEventListener("play", handlePlay);
      video.addEventListener("playing", handlePlaying);
      video.addEventListener("waiting", handleWaiting);
      video.addEventListener("stalled", handleStalled);
      video.addEventListener("canplay", handleCanPlay);
      video.addEventListener("progress", handleProgress);
      video.addEventListener("pause", handlePause);
      video.addEventListener("ended", handleEnded);
      video.addEventListener("error", handleError);
      video.addEventListener("volumechange", handleVolumeChange);
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        if (hideControlsTimeoutRef.current) window.clearTimeout(hideControlsTimeoutRef.current);
        if (autoResumeTimeoutRef.current) window.clearTimeout(autoResumeTimeoutRef.current);
        if (audioNudgeTimeoutRef.current) window.clearTimeout(audioNudgeTimeoutRef.current);
        window.clearInterval(audioWatchdogInterval);
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video.removeEventListener("durationchange", handleLoadedMetadata);
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("playing", handlePlaying);
        video.removeEventListener("waiting", handleWaiting);
        video.removeEventListener("stalled", handleStalled);
        video.removeEventListener("canplay", handleCanPlay);
        video.removeEventListener("progress", handleProgress);
        video.removeEventListener("pause", handlePause);
        video.removeEventListener("ended", handleEnded);
        video.removeEventListener("error", handleError);
        video.removeEventListener("volumechange", handleVolumeChange);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectiveSrc]); // only re-bind when src changes

    const scheduleHideControls = useCallback(
      (delayMs = 1600) => {
        if (hideControlsTimeoutRef.current) window.clearTimeout(hideControlsTimeoutRef.current);
        if (!isPlaying) {
          setControlsVisible(true);
          return;
        }
        hideControlsTimeoutRef.current = window.setTimeout(() => {
          setControlsVisible(false);
        }, delayMs);
      },
      [isPlaying]
    );

    const revealControls = useCallback(() => {
      setControlsVisible(true);
      scheduleHideControls();
    }, [scheduleHideControls]);

    // Auto-hide controls while playing
    useEffect(() => {
      if (!isPlaying) {
        setControlsVisible(true);
        return;
      }
      scheduleHideControls();
      return () => {
        if (hideControlsTimeoutRef.current) window.clearTimeout(hideControlsTimeoutRef.current);
      };
    }, [isPlaying, scheduleHideControls]);

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
        pauseRequestedRef.current = true;
        video.pause();
      } else {
        try {
          if (restartOnInterrupt && wasInterrupted) {
            video.currentTime = 0;
            setCurrentTime(0);
            setWasInterrupted(false);
          }
          await video.play();
          scheduleHideControls();
        } catch (err) {
          console.warn("Play failed", err);
        }
      }
    };

    const toggleMute = () => {
      const video = videoRef.current;
      if (!video) return;
      video.muted = !video.muted;
      desiredMutedRef.current = video.muted;
      setIsMuted(video.muted);
      revealControls();
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
      revealControls();
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
        onMouseMove={revealControls}
        onTouchStart={revealControls}
      >
        {/* Diagnostics overlay for debugging */}
        {showDiagnostics && (
          <VideoDiagnostics videoRef={videoRef} videoSrc={src} />
        )}

        <video
          ref={videoRef}
          src={effectiveSrc}
          className="theater-video w-full h-full object-contain"
          playsInline
          webkit-playsinline="true"
          preload="auto"
          disablePictureInPicture
          controls={nativeControls}
          controlsList="nodownload noremoteplayback nofullscreen"
          onClick={isIOS ? undefined : togglePlay}
        />

        {/* Buffering indicator */}
        {isBuffering && isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-black/60 rounded-full p-4">
              <Loader2 className="w-10 h-10 text-gold animate-spin" />
            </div>
          </div>
        )}

        {/* Custom controls overlay */}
        {!nativeControls && (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 pointer-events-none",
              controlsVisible ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 pointer-events-auto">
              {/* Progress bar (non-interactive when seeking disabled) */}
              <div
                className={cn(
                  "relative h-2 sm:h-1 bg-white/20 rounded-full mb-3 sm:mb-4 overflow-hidden",
                  disableSeeking && "cursor-default touch-none"
                )}
              >
                {/* Buffered progress (shows how much is loaded) */}
                <div
                  className="absolute inset-y-0 left-0 bg-white/30 transition-all"
                  style={{ width: `${bufferedPercent}%` }}
                />
                {/* Playback progress */}
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
