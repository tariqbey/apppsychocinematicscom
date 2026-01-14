import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TimelineClip } from "@/hooks/useTimelineEditor";

interface ExportProgress {
  stage: "preparing" | "rendering" | "encoding" | "uploading" | "complete" | "error";
  progress: number;
  message: string;
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
        resolution?: "720p" | "1080p";
        fps?: number;
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

      const { resolution = "1080p", fps = 30 } = options;
      const width = resolution === "1080p" ? 1920 : 1280;
      const height = resolution === "1080p" ? 1080 : 720;

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

        // Load all video/image sources
        setProgress({ stage: "preparing", progress: 10, message: "Loading media files..." });
        const mediaElements = await loadMediaElements(clips);

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
          });
          
          bgAudioSource = audioContext.createMediaElementSource(bgAudioElement);
          const gainNode = audioContext.createGain();
          gainNode.gain.value = backgroundAudio.volume;
          bgAudioSource.connect(gainNode);
          gainNode.connect(audioDestination);
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
            const videoClips = clips.filter((c) => c.type === "video" || c.type === "image");
            const activeClip = videoClips.find(
              (clip) =>
                currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration
            );

            if (activeClip) {
              const element = mediaElements.get(activeClip.id);
              if (element) {
                if (element instanceof HTMLVideoElement) {
                  const clipTime = currentTime - activeClip.startTime + activeClip.trimStart;
                  element.currentTime = clipTime;
                  
                  // Connect audio if not muted
                  if (!activeClip.muted && element.paused) {
                    element.play().catch(() => {});
                  }
                }
                
                // Draw to canvas with proper scaling
                const sourceWidth = element instanceof HTMLVideoElement ? element.videoWidth : element.width;
                const sourceHeight = element instanceof HTMLVideoElement ? element.videoHeight : element.height;
                
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
