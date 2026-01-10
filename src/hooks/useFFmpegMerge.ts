import { useState, useCallback } from "react";

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
        // Create video element (muted - we'll replace the audio)
        setProgress({ stage: "downloading", progress: 10, message: "Loading video..." });
        const video = document.createElement("video");
        video.src = videoUrl;
        video.muted = true;
        video.crossOrigin = "anonymous";
        video.playsInline = true;

        // Create audio element
        setProgress({ stage: "downloading", progress: 20, message: "Loading audio..." });
        const audio = document.createElement("audio");
        audio.src = audioUrl;
        audio.crossOrigin = "anonymous";

        // Wait for both to load
        await Promise.all([
          new Promise<void>((resolve, reject) => {
            video.onloadeddata = () => resolve();
            video.onerror = () => reject(new Error("Failed to load video"));
          }),
          new Promise<void>((resolve, reject) => {
            audio.oncanplaythrough = () => resolve();
            audio.onerror = () => reject(new Error("Failed to load audio"));
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
            resolve(mergedUrl);
          };

          recorder.onerror = (e) => {
            setProgress({ stage: "error", progress: 0, message: "Recording failed" });
            setIsProcessing(false);
            audioContext.close();
            reject(new Error("MediaRecorder error"));
          };

          // Draw video frames to canvas
          let frameCount = 0;
          const drawFrame = () => {
            if (video.paused || video.ended) return;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            frameCount++;
            
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

          // Handle errors
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
          }).catch(reject);
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
