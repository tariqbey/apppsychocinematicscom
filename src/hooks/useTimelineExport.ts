import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TimelineClip, TimelineTrack } from "@/hooks/useTimelineEditor";

interface ExportProgress {
  stage: "preparing" | "rendering" | "encoding" | "uploading" | "complete" | "error";
  progress: number;
  message: string;
}

interface AudioClipState {
  element: HTMLAudioElement;
  sourceNode: MediaElementAudioSourceNode;
  gainNode: GainNode;
  clip: TimelineClip;
  track: TimelineTrack;
}

export function useTimelineExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const { toast } = useToast();
  const abortRef = useRef(false);

  const exportTimeline = useCallback(
    async (
      clips: TimelineClip[],
      duration: number,
      backgroundAudio: { url: string | null; volume: number; muted: boolean },
      options: {
        resolution?: "720p" | "1080p" | "4K";
        fps?: number;
        tracks?: TimelineTrack[];
        masterVolume?: number;
      } = {}
    ): Promise<string | null> => {
      if (clips.length === 0) {
        toast({
          title: "Nothing to export",
          description: "Add some clips to the timeline first.",
          variant: "destructive",
        });
        return null;
      }

      setIsExporting(true);
      setProgress({ stage: "preparing", progress: 0, message: "Preparing export..." });
      abortRef.current = false;

      const { resolution = "1080p", fps = 30, tracks = [], masterVolume = 1 } = options;
      const width = resolution === "4K" ? 3840 : resolution === "1080p" ? 1920 : 1280;
      const height = resolution === "4K" ? 2160 : resolution === "1080p" ? 1080 : 720;

      try {
        // Create canvas for rendering
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("Failed to create canvas context");
        }

        // Create audio context for mixing
        const audioContext = new AudioContext();
        const audioDestination = audioContext.createMediaStreamDestination();
        const masterGain = audioContext.createGain();
        masterGain.gain.value = masterVolume;
        masterGain.connect(audioDestination);
        masterGain.connect(audioContext.destination); // So we can hear during export

        // Check if any track is soloed
        const hasSoloedTrack = tracks.some((t) => t.solo);

        // Load all video/image sources
        setProgress({ stage: "preparing", progress: 10, message: "Loading media files..." });
        const mediaElements = await loadMediaElements(clips);

        // Load audio clips (audio track clips)
        const audioClips = clips.filter((c) => c.type === "audio");
        const audioClipStates: AudioClipState[] = [];

        for (const clip of audioClips) {
          const track = tracks.find((t) => t.id === clip.trackId);
          if (!track) continue;

          // Skip if track is muted or (soloed track exists and this isn't soloed)
          if (track.muted || (hasSoloedTrack && !track.solo)) continue;

          try {
            const audio = document.createElement("audio");
            audio.src = clip.sourceUrl;
            audio.crossOrigin = "anonymous";
            audio.preload = "auto";

            await new Promise<void>((resolve, reject) => {
              audio.oncanplaythrough = () => resolve();
              audio.onerror = () => reject(new Error(`Failed to load audio: ${clip.name}`));
              audio.load();
              setTimeout(resolve, 5000); // Timeout fallback
            });

            const sourceNode = audioContext.createMediaElementSource(audio);
            const gainNode = audioContext.createGain();
            // Apply clip volume * track volume
            gainNode.gain.value = clip.muted ? 0 : clip.volume * track.volume;
            sourceNode.connect(gainNode);
            gainNode.connect(masterGain);

            audioClipStates.push({
              element: audio,
              sourceNode,
              gainNode,
              clip,
              track,
            });
          } catch (err) {
            console.warn(`Failed to load audio clip ${clip.name}:`, err);
          }
        }

        // Load video audio sources
        const videoClips = clips.filter((c) => c.type === "video");
        const videoAudioStates: AudioClipState[] = [];

        for (const clip of videoClips) {
          const track = tracks.find((t) => t.id === clip.trackId);
          if (!track || clip.muted || track.muted) continue;
          if (hasSoloedTrack && !track.solo) continue;

          const mediaEl = mediaElements.get(clip.id);
          if (!(mediaEl instanceof HTMLVideoElement)) continue;

          try {
            // Create a separate audio element for video audio
            const audio = document.createElement("audio");
            audio.src = clip.sourceUrl;
            audio.crossOrigin = "anonymous";
            audio.preload = "auto";

            await new Promise<void>((resolve) => {
              audio.oncanplaythrough = () => resolve();
              audio.onerror = () => resolve(); // Videos might not have audio
              audio.load();
              setTimeout(resolve, 3000);
            });

            const sourceNode = audioContext.createMediaElementSource(audio);
            const gainNode = audioContext.createGain();
            gainNode.gain.value = clip.volume * (track?.volume || 1);
            sourceNode.connect(gainNode);
            gainNode.connect(masterGain);

            videoAudioStates.push({
              element: audio,
              sourceNode,
              gainNode,
              clip,
              track: track!,
            });
          } catch (err) {
            console.warn(`Failed to load video audio for ${clip.name}:`, err);
          }
        }

        // Load background audio if present
        let bgAudioSource: MediaElementAudioSourceNode | null = null;
        let bgAudioElement: HTMLAudioElement | null = null;

        if (backgroundAudio.url && !backgroundAudio.muted) {
          bgAudioElement = document.createElement("audio");
          bgAudioElement.src = backgroundAudio.url;
          bgAudioElement.crossOrigin = "anonymous";
          bgAudioElement.loop = true;
          await new Promise<void>((resolve) => {
            bgAudioElement!.oncanplaythrough = () => resolve();
            bgAudioElement!.load();
            setTimeout(resolve, 5000);
          });

          bgAudioSource = audioContext.createMediaElementSource(bgAudioElement);
          const gainNode = audioContext.createGain();
          gainNode.gain.value = backgroundAudio.volume;
          bgAudioSource.connect(gainNode);
          gainNode.connect(masterGain);
        }

        // Set up canvas stream
        const canvasStream = canvas.captureStream(fps);

        // Combine video and audio streams
        const combinedStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...audioDestination.stream.getAudioTracks(),
        ]);

        // Set up MediaRecorder
        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
          ? "video/webm;codecs=vp9,opus"
          : "video/webm";

        const recorder = new MediaRecorder(combinedStream, {
          mimeType,
          videoBitsPerSecond: resolution === "1080p" ? 8000000 : 5000000,
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        setProgress({ stage: "rendering", progress: 20, message: "Rendering timeline..." });

        return new Promise((resolve, reject) => {
          recorder.onstop = async () => {
            try {
              setProgress({ stage: "encoding", progress: 90, message: "Finalizing video..." });

              const blob = new Blob(chunks, { type: mimeType });
              const url = URL.createObjectURL(blob);

              // Cleanup
              audioContext.close();
              mediaElements.forEach((el) => {
                if (el instanceof HTMLVideoElement) {
                  el.pause();
                  el.src = "";
                }
              });
              audioClipStates.forEach((s) => {
                s.element.pause();
                s.element.src = "";
              });
              videoAudioStates.forEach((s) => {
                s.element.pause();
                s.element.src = "";
              });

              setProgress({ stage: "complete", progress: 100, message: "Export complete!" });
              setIsExporting(false);

              resolve(url);
            } catch (error) {
              reject(error);
            }
          };

          recorder.onerror = (e) => {
            setProgress({ stage: "error", progress: 0, message: "Recording failed" });
            setIsExporting(false);
            reject(new Error("MediaRecorder error"));
          };

          // Start recording
          recorder.start(100);

          if (bgAudioElement) {
            bgAudioElement.currentTime = 0;
            bgAudioElement.play().catch(() => {});
          }

          // Render frames
          let currentTime = 0;
          const frameInterval = 1000 / fps;
          const totalFrames = Math.ceil(duration * fps);
          let frameCount = 0;

          const renderFrame = () => {
            if (abortRef.current || currentTime >= duration) {
              // Stop all media
              mediaElements.forEach((el) => {
                if (el instanceof HTMLVideoElement) {
                  el.pause();
                }
              });
              audioClipStates.forEach((s) => s.element.pause());
              videoAudioStates.forEach((s) => s.element.pause());
              if (bgAudioElement) {
                bgAudioElement.pause();
              }

              setTimeout(() => recorder.stop(), 100);
              return;
            }

            // Clear canvas
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, width, height);

            // Find and render active video/image clip
            const visualClips = clips.filter((c) => c.type === "video" || c.type === "image");
            const activeClip = visualClips.find(
              (clip) =>
                currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration
            );

            if (activeClip) {
              const element = mediaElements.get(activeClip.id);
              if (element) {
                if (element instanceof HTMLVideoElement) {
                  const clipTime = currentTime - activeClip.startTime + activeClip.trimStart;
                  element.currentTime = clipTime;

                  // Mute video element itself - audio comes from separate audio element
                  element.muted = true;
                }

                // Draw to canvas with proper scaling
                const sourceWidth =
                  element instanceof HTMLVideoElement ? element.videoWidth : element.width;
                const sourceHeight =
                  element instanceof HTMLVideoElement ? element.videoHeight : element.height;

                if (sourceWidth && sourceHeight) {
                  const scale = Math.min(width / sourceWidth, height / sourceHeight);
                  const drawWidth = sourceWidth * scale;
                  const drawHeight = sourceHeight * scale;
                  const drawX = (width - drawWidth) / 2;
                  const drawY = (height - drawHeight) / 2;

                  ctx.drawImage(element, drawX, drawY, drawWidth, drawHeight);
                }
              }
            }

            // Sync audio clips (start/stop/seek based on currentTime)
            for (const audioState of audioClipStates) {
              const { element, clip, gainNode, track } = audioState;
              const isActive =
                currentTime >= clip.startTime &&
                currentTime < clip.startTime + clip.duration;

              // Update gain in case mute changed
              gainNode.gain.value = clip.muted ? 0 : clip.volume * track.volume;

              if (isActive) {
                const expectedTime = currentTime - clip.startTime + clip.trimStart;
                if (element.paused) {
                  element.currentTime = expectedTime;
                  element.play().catch(() => {});
                } else {
                  // Correct drift
                  const drift = Math.abs(element.currentTime - expectedTime);
                  if (drift > 0.3) {
                    element.currentTime = expectedTime;
                  }
                }
              } else {
                if (!element.paused) {
                  element.pause();
                }
              }
            }

            // Sync video audio clips
            for (const audioState of videoAudioStates) {
              const { element, clip, gainNode, track } = audioState;
              const isActive =
                currentTime >= clip.startTime &&
                currentTime < clip.startTime + clip.duration;

              gainNode.gain.value = clip.muted ? 0 : clip.volume * track.volume;

              if (isActive) {
                const expectedTime = currentTime - clip.startTime + clip.trimStart;
                if (element.paused) {
                  element.currentTime = expectedTime;
                  element.play().catch(() => {});
                } else {
                  const drift = Math.abs(element.currentTime - expectedTime);
                  if (drift > 0.3) {
                    element.currentTime = expectedTime;
                  }
                }
              } else {
                if (!element.paused) {
                  element.pause();
                }
              }
            }

            // Update progress
            frameCount++;
            const progressPercent = 20 + (frameCount / totalFrames) * 70;
            setProgress({
              stage: "rendering",
              progress: Math.min(90, progressPercent),
              message: `Rendering: ${Math.round((currentTime / duration) * 100)}%`,
            });

            currentTime += frameInterval / 1000;
            requestAnimationFrame(renderFrame);
          };

          renderFrame();
        });
      } catch (error) {
        console.error("Export failed:", error);
        setProgress({
          stage: "error",
          progress: 0,
          message: error instanceof Error ? error.message : "Export failed",
        });
        setIsExporting(false);
        return null;
      }
    },
    [toast]
  );

  const cancelExport = useCallback(() => {
    abortRef.current = true;
  }, []);

  const reset = useCallback(() => {
    setProgress(null);
    setIsExporting(false);
  }, []);

  return {
    exportTimeline,
    cancelExport,
    isExporting,
    progress,
    reset,
  };
}

// Helper function to load all media elements
async function loadMediaElements(
  clips: TimelineClip[]
): Promise<Map<string, HTMLVideoElement | HTMLImageElement>> {
  const elements = new Map<string, HTMLVideoElement | HTMLImageElement>();

  await Promise.all(
    clips.map(async (clip) => {
      if (clip.type === "video") {
        const video = document.createElement("video");
        video.src = clip.sourceUrl;
        video.crossOrigin = "anonymous";
        video.muted = true; // We'll handle audio separately
        video.preload = "auto";

        await new Promise<void>((resolve, reject) => {
          video.onloadeddata = () => resolve();
          video.onerror = () => reject(new Error(`Failed to load video: ${clip.name}`));
          video.load();
          setTimeout(resolve, 5000);
        });

        elements.set(clip.id, video);
      } else if (clip.type === "image") {
        const img = new Image();
        img.crossOrigin = "anonymous";

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load image: ${clip.name}`));
          img.src = clip.sourceUrl;
        });

        elements.set(clip.id, img);
      }
    })
  );

  return elements;
}
