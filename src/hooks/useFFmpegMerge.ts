import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MergeProgress {
  stage: "loading" | "downloading" | "merging" | "complete" | "error";
  progress: number;
  message: string;
}

export function useFFmpegMerge() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<MergeProgress | null>(null);

  const mergeAudioVideo = useCallback(
    async (videoUrl: string, audioUrl: string): Promise<string> => {
      setIsProcessing(true);
      setProgress({ stage: "loading", progress: 0, message: "Initializing..." });

      try {
        const fetchBlob = async (
          url: string,
          label: "video" | "audio",
          proxyProgress: number
        ): Promise<Blob> => {
          try {
            const res = await fetch(url);
            if (!res.ok) {
              throw new Error(`Failed to download ${label}: ${res.status}`);
            }
            return await res.blob();
          } catch (err) {
            console.warn(`Direct fetch failed for ${label}, falling back to secure proxy`, err);
            setProgress({
              stage: "downloading",
              progress: proxyProgress,
              message: `Downloading ${label} (secure mode)...`,
            });

            const { data, error } = await supabase.functions.invoke("media-proxy", {
              body: { url },
            });

            if (error) {
              throw new Error(error.message || `Proxy download failed for ${label}`);
            }

            if (!(data instanceof Blob)) {
              throw new Error(`Proxy returned unexpected data for ${label}`);
            }

            return data;
          }
        };

        // Fetch media as blobs (fallback to proxy for CORS-blocked hosts)
        setProgress({ stage: "downloading", progress: 5, message: "Downloading video..." });
        const videoBlob = await fetchBlob(videoUrl, "video", 8);
        const videoBlobUrl = URL.createObjectURL(videoBlob);

        setProgress({ stage: "downloading", progress: 15, message: "Downloading audio..." });
        const audioBlob = await fetchBlob(audioUrl, "audio", 18);
        const audioBlobUrl = URL.createObjectURL(audioBlob);


        // Create video element (muted - we'll replace the audio)
        setProgress({ stage: "downloading", progress: 20, message: "Loading media..." });
        const video = document.createElement("video");
        video.src = videoBlobUrl;
        video.muted = true;
        video.playsInline = true;

        // Create audio element
        const audio = document.createElement("audio");
        audio.src = audioBlobUrl;

        // Wait for both to load
        await Promise.all([
          new Promise<void>((resolve, reject) => {
            video.onloadeddata = () => resolve();
            video.onerror = (e) => {
              console.error("Video load error:", e);
              reject(new Error("Failed to load video"));
            };
          }),
          new Promise<void>((resolve, reject) => {
            audio.oncanplaythrough = () => resolve();
            audio.onerror = (e) => {
              console.error("Audio load error:", e);
              reject(new Error("Failed to load audio"));
            };
          }),
        ]);

        setProgress({ stage: "merging", progress: 30, message: "Setting up recording..." });

        // Create canvas to capture video frames
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("Failed to get canvas context");
        }

        // Get video stream from canvas
        const canvasStream = canvas.captureStream(30);

        // Get audio stream
        const audioContext = new AudioContext();
        const audioSource = audioContext.createMediaElementSource(audio);
        const audioDestination = audioContext.createMediaStreamDestination();
        audioSource.connect(audioDestination);
        audioSource.connect(audioContext.destination); // So we can hear it too

        // Combine video and audio streams
        const combinedStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...audioDestination.stream.getAudioTracks(),
        ]);

        // Set up MediaRecorder
        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
          ? "video/webm;codecs=vp9,opus"
          : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
          ? "video/webm;codecs=vp8,opus"
          : "video/webm";

        const recorder = new MediaRecorder(combinedStream, {
          mimeType,
          videoBitsPerSecond: 5000000, // 5 Mbps
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        return new Promise((resolve, reject) => {
          recorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            const mergedUrl = URL.createObjectURL(blob);
            setProgress({ stage: "complete", progress: 100, message: "Complete!" });
            setIsProcessing(false);
            audioContext.close();
            // Cleanup blob URLs
            URL.revokeObjectURL(videoBlobUrl);
            URL.revokeObjectURL(audioBlobUrl);
            resolve(mergedUrl);
          };

          recorder.onerror = (e) => {
            console.error("Recorder error:", e);
            setProgress({ stage: "error", progress: 0, message: "Recording failed" });
            setIsProcessing(false);
            audioContext.close();
            URL.revokeObjectURL(videoBlobUrl);
            URL.revokeObjectURL(audioBlobUrl);
            reject(new Error("MediaRecorder error"));
          };

          // Draw video frames to canvas
          const drawFrame = () => {
            if (video.paused || video.ended) return;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Update progress based on video time
            const progressPercent = 30 + (video.currentTime / video.duration) * 65;
            setProgress({
              stage: "merging",
              progress: Math.min(95, progressPercent),
              message: `Recording: ${Math.round((video.currentTime / video.duration) * 100)}%`,
            });
            
            requestAnimationFrame(drawFrame);
          };

          // Handle video end
          video.onended = () => {
            setTimeout(() => {
              audio.pause();
              recorder.stop();
            }, 100); // Small delay to ensure all frames are captured
          };

          // Handle errors during playback
          video.onerror = () => {
            recorder.stop();
            reject(new Error("Video playback error"));
          };

          // Start everything
          setProgress({ stage: "merging", progress: 30, message: "Recording..." });
          recorder.start(100); // Collect data every 100ms
          
          // Sync playback
          video.currentTime = 0;
          audio.currentTime = 0;
          
          video.play().then(() => {
            audio.play();
            drawFrame();
          }).catch((e) => {
            console.error("Play error:", e);
            reject(new Error("Failed to start playback"));
          });
        });

      } catch (error) {
        console.error("Merge failed:", error);
        setProgress({
          stage: "error",
          progress: 0,
          message: error instanceof Error ? error.message : "Merge failed",
        });
        setIsProcessing(false);
        throw error;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setProgress(null);
    setIsProcessing(false);
  }, []);

  return {
    mergeAudioVideo,
    isProcessing,
    progress,
    reset,
  };
}
