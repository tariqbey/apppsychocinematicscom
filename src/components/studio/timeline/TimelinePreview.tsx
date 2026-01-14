import { useRef, useEffect, useState, useCallback } from "react";
import { TimelineClip, TimelineTrack } from "@/hooks/useTimelineEditor";
import { SimpleVUMeter } from "./VUMeter";

interface TimelinePreviewProps {
  clips: TimelineClip[];
  tracks: TimelineTrack[];
  currentTime: number;
  isPlaying: boolean;
  masterVolume: number;
  backgroundAudio: {
    url: string | null;
    volume: number;
    muted: boolean;
  };
}

// Threshold for determining if we need to seek (in seconds)
const SEEK_THRESHOLD = 0.3;

export function TimelinePreview({
  clips,
  tracks,
  currentTime,
  isPlaying,
  masterVolume,
  backgroundAudio,
}: TimelinePreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgAudioRef = useRef<HTMLAudioElement>(null);
  const audioClipRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodesRef = useRef<Map<HTMLMediaElement, MediaElementAudioSourceNode>>(new Map());
  const animationRef = useRef<number>(0);

  const [activeClip, setActiveClip] = useState<TimelineClip | null>(null);
  const [vuLevels, setVuLevels] = useState({ left: 0, right: 0 });
  const lastSyncTimeRef = useRef<number>(0);
  const wasPlayingRef = useRef<boolean>(false);
  const audioWasPlayingRef = useRef<boolean>(false);
  const activeClipIdRef = useRef<string | null>(null);

  const setAudioClipRef = useCallback(
    (clipId: string) => (el: HTMLAudioElement | null) => {
      audioClipRefs.current[clipId] = el;
    },
    []
  );

  // Find active video/image clip at current time
  useEffect(() => {
    const videoClips = clips.filter((c) => c.type === "video" || c.type === "image");
    const active = videoClips.find(
      (clip) =>
        currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration
    );
    setActiveClip(active || null);
  }, [clips, currentTime]);

  // Get track for a clip
  const getTrackForClip = useCallback((clip: TimelineClip) => {
    return tracks.find((t) => t.id === clip.trackId);
  }, [tracks]);

  // Check if any track is soloed
  const hasSoloedTrack = tracks.some((t) => t.solo);

  // Calculate effective volume (clip volume * track volume * master volume, considering mutes and solo)
  const getEffectiveVolume = useCallback((clip: TimelineClip) => {
    const track = getTrackForClip(clip);
    if (!track || track.muted || clip.muted) return 0;
    // If any track is soloed, only soloed tracks are heard
    if (hasSoloedTrack && !track.solo) return 0;
    return clip.volume * track.volume * masterVolume;
  }, [getTrackForClip, masterVolume, hasSoloedTrack]);

  // Calculate expected clip time
  const getExpectedClipTime = useCallback((clip: TimelineClip, timelineTime: number) => {
    return timelineTime - clip.startTime + clip.trimStart;
  }, []);

  // Initialize audio context for VU meter
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationRef.current);
      sourceNodesRef.current.forEach((node) => {
        try { node.disconnect(); } catch {}
      });
      sourceNodesRef.current.clear();
    };
  }, []);

  // VU meter animation
  useEffect(() => {
    const updateVU = () => {
      if (!isPlaying) {
        // Decay when not playing
        setVuLevels(prev => ({
          left: Math.max(0, prev.left - 3),
          right: Math.max(0, prev.right - 3)
        }));
      } else {
        // Collect all active audio sources and calculate combined level
        let totalLevel = 0;
        let sourceCount = 0;

        // Check video element
        if (videoRef.current && !videoRef.current.paused && activeClip?.type === "video") {
          const effectiveVol = getEffectiveVolume(activeClip);
          if (effectiveVol > 0) {
            totalLevel += effectiveVol * 70; // Base level
            sourceCount++;
          }
        }

        // Check background audio
        if (bgAudioRef.current && !bgAudioRef.current.paused && !backgroundAudio.muted) {
          totalLevel += backgroundAudio.volume * masterVolume * 60;
          sourceCount++;
        }

        // Check audio clips
        Object.entries(audioClipRefs.current).forEach(([clipId, audioEl]) => {
          if (audioEl && !audioEl.paused) {
            const clip = clips.find(c => c.id === clipId);
            if (clip) {
              const vol = getEffectiveVolume(clip);
              if (vol > 0) {
                totalLevel += vol * 65;
                sourceCount++;
              }
            }
          }
        });

        if (sourceCount > 0) {
          const avgLevel = totalLevel / sourceCount;
          // Add some variation for realism
          const variation = (Math.random() - 0.5) * 10;
          const leftLevel = Math.min(100, Math.max(0, avgLevel + variation));
          const rightLevel = Math.min(100, Math.max(0, avgLevel + variation * -1));
          setVuLevels({ left: leftLevel, right: rightLevel });
        } else {
          setVuLevels(prev => ({
            left: Math.max(0, prev.left - 5),
            right: Math.max(0, prev.right - 5)
          }));
        }
      }

      animationRef.current = requestAnimationFrame(updateVU);
    };

    updateVU();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, activeClip, clips, backgroundAudio, masterVolume, getEffectiveVolume]);

  // Sync video playback with timeline - optimized to avoid stuttering
  useEffect(() => {
    if (!videoRef.current || !activeClip || activeClip.type !== "video") return;

    const video = videoRef.current;
    const expectedClipTime = getExpectedClipTime(activeClip, currentTime);
    
    // Check if we switched to a different clip
    const clipChanged = activeClipIdRef.current !== activeClip.id;
    activeClipIdRef.current = activeClip.id;

    if (isPlaying) {
      // If we just started playing, switched clips, or drifted too far, seek
      const currentVideoTime = video.currentTime;
      const drift = Math.abs(currentVideoTime - expectedClipTime);
      
      if (!wasPlayingRef.current || clipChanged || drift > SEEK_THRESHOLD) {
        video.currentTime = expectedClipTime;
        lastSyncTimeRef.current = currentTime;
      }
      
      // Start playing if not already
      if (video.paused) {
        video.play().catch(() => {});
      }
    } else {
      // When paused, always seek to exact position
      video.pause();
      
      // Only seek if position changed significantly (prevents micro-stutters)
      const drift = Math.abs(video.currentTime - expectedClipTime);
      if (drift > 0.05 || clipChanged) {
        video.currentTime = expectedClipTime;
      }
    }

    wasPlayingRef.current = isPlaying;
  }, [activeClip, currentTime, isPlaying, getExpectedClipTime]);

  // Sync background audio - optimized similarly
  useEffect(() => {
    if (!bgAudioRef.current || !backgroundAudio.url) return;

    const audio = bgAudioRef.current;
    audio.volume = backgroundAudio.muted ? 0 : backgroundAudio.volume * masterVolume;

    if (isPlaying) {
      const drift = Math.abs(audio.currentTime - currentTime);
      
      // Only seek if drifted too far
      if (drift > SEEK_THRESHOLD) {
        audio.currentTime = currentTime;
      }
      
      if (audio.paused) {
        audio.play().catch(() => {});
      }
    } else {
      audio.pause();
      // Seek to exact position when paused
      const drift = Math.abs(audio.currentTime - currentTime);
      if (drift > 0.05) {
        audio.currentTime = currentTime;
      }
    }
  }, [backgroundAudio, currentTime, isPlaying]);

  // Sync timeline audio clips (audio tracks) with timeline
  useEffect(() => {
    const audioClips = clips.filter((c) => c.type === "audio");

    // Pause/cleanup refs for removed clips
    const audioClipIds = new Set(audioClips.map((c) => c.id));
    Object.keys(audioClipRefs.current).forEach((id) => {
      if (!audioClipIds.has(id)) {
        audioClipRefs.current[id]?.pause();
        delete audioClipRefs.current[id];
      }
    });

    audioClips.forEach((clip) => {
      const audio = audioClipRefs.current[clip.id];
      if (!audio) return;

      const isActive =
        currentTime >= clip.startTime &&
        currentTime < clip.startTime + clip.duration;

      const effectiveVolume = getEffectiveVolume(clip);
      audio.volume = effectiveVolume;
      audio.muted = effectiveVolume === 0;

      if (!isActive) {
        audio.pause();
        try {
          if (audio.currentTime !== 0) audio.currentTime = 0;
        } catch {
          // ignore
        }
        return;
      }

      const expectedTime = getExpectedClipTime(clip, currentTime);
      const clampedExpected = Math.max(0, expectedTime);

      if (isPlaying) {
        const drift = Math.abs(audio.currentTime - clampedExpected);
        if (!audioWasPlayingRef.current || drift > SEEK_THRESHOLD) {
          audio.currentTime = clampedExpected;
        }

        if (effectiveVolume > 0 && audio.paused) {
          audio.play().catch(() => {});
        }
      } else {
        audio.pause();
        const drift = Math.abs(audio.currentTime - clampedExpected);
        if (drift > 0.05) {
          audio.currentTime = clampedExpected;
        }
      }
    });

    audioWasPlayingRef.current = isPlaying;
  }, [clips, currentTime, isPlaying, getExpectedClipTime, getEffectiveVolume]);

  // Render image to canvas if active clip is image
  useEffect(() => {
    if (!canvasRef.current || !activeClip || activeClip.type !== "image") return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvasRef.current!.width = img.width;
      canvasRef.current!.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = activeClip.sourceUrl;
  }, [activeClip]);

  // Apply volume to video element
  useEffect(() => {
    if (!videoRef.current || !activeClip || activeClip.type !== "video") return;
    const effectiveVolume = getEffectiveVolume(activeClip);
    videoRef.current.volume = effectiveVolume;
  }, [activeClip, getEffectiveVolume]);

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      {/* Video preview */}
      {activeClip?.type === "video" && (
        <video
          ref={videoRef}
          src={activeClip.sourceUrl}
          className="w-full h-full object-contain"
          muted={false}
          playsInline
          preload="auto"
        />
      )}

      {/* Image preview */}
      {activeClip?.type === "image" && (
        <canvas ref={canvasRef} className="w-full h-full object-contain" />
      )}

      {/* No content placeholder */}
      {!activeClip && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <p className="text-sm">No clip at current time</p>
        </div>
      )}

      {/* Timeline audio clips */}
      {clips
        .filter((c) => c.type === "audio")
        .map((clip) => (
          <audio
            key={clip.id}
            ref={setAudioClipRef(clip.id)}
            src={clip.sourceUrl}
            preload="auto"
            crossOrigin="anonymous"
          />
        ))}

      {/* Background audio */}
      {backgroundAudio.url && (
        <audio ref={bgAudioRef} src={backgroundAudio.url} loop preload="auto" />
      )}

      {/* VU Meter */}
      <div className="absolute top-2 right-2 h-16 bg-black/70 rounded px-1.5 py-1 flex flex-col items-center">
        <SimpleVUMeter leftLevel={vuLevels.left} rightLevel={vuLevels.right} className="h-full" />
        <span className="text-[8px] text-muted-foreground mt-0.5">VU</span>
      </div>

      {/* Time display */}
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs font-mono">
        {formatTime(currentTime)}
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}
