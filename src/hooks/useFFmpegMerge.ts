import { useState, useRef, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

interface MergeProgress {
  stage: "loading" | "downloading" | "merging" | "complete" | "error";
  progress: number;
  message: string;
}

export function useFFmpegMerge() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<MergeProgress | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const loadedRef = useRef(false);

  const loadFFmpeg = useCallback(async () => {
    if (loadedRef.current && ffmpegRef.current) {
      return ffmpegRef.current;
    }

    setProgress({ stage: "loading", progress: 0, message: "Loading FFmpeg..." });

    const ffmpeg = new FFmpeg();
    ffmpegRef.current = ffmpeg;

    ffmpeg.on("progress", ({ progress: p }) => {
      setProgress({
        stage: "merging",
        progress: Math.round(p * 100),
        message: `Merging: ${Math.round(p * 100)}%`,
      });
    });

    ffmpeg.on("log", ({ message }) => {
      console.log("[FFmpeg]", message);
    });

    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
      loadedRef.current = true;
      console.log("FFmpeg loaded successfully");
      return ffmpeg;
    } catch (error) {
      console.error("Failed to load FFmpeg:", error);
      throw new Error("Failed to load video processing engine");
    }
  }, []);

  const mergeAudioVideo = useCallback(
    async (videoUrl: string, audioUrl: string): Promise<string> => {
      setIsProcessing(true);
      setProgress({ stage: "loading", progress: 0, message: "Initializing..." });

      try {
        const ffmpeg = await loadFFmpeg();

        // Download video
        setProgress({ stage: "downloading", progress: 20, message: "Downloading video..." });
        const videoData = await fetchFile(videoUrl);
        await ffmpeg.writeFile("input.mp4", videoData);

        // Download audio
        setProgress({ stage: "downloading", progress: 40, message: "Downloading audio..." });
        const audioData = await fetchFile(audioUrl);
        await ffmpeg.writeFile("audio.mp3", audioData);

        // Merge: Replace video audio with new audio
        setProgress({ stage: "merging", progress: 50, message: "Merging audio and video..." });
        
        // -i input.mp4: Input video
        // -i audio.mp3: Input audio
        // -c:v copy: Copy video stream without re-encoding (fast)
        // -c:a aac: Encode audio as AAC
        // -map 0:v:0: Use video from first input
        // -map 1:a:0: Use audio from second input
        // -shortest: Match output duration to shortest input
        await ffmpeg.exec([
          "-i", "input.mp4",
          "-i", "audio.mp3",
          "-c:v", "copy",
          "-c:a", "aac",
          "-b:a", "192k",
          "-map", "0:v:0",
          "-map", "1:a:0",
          "-shortest",
          "output.mp4",
        ]);

        // Read output
        setProgress({ stage: "merging", progress: 90, message: "Finalizing..." });
        const outputData = await ffmpeg.readFile("output.mp4");
        
        // Create blob URL - ensure we have an ArrayBuffer
        let arrayBuffer: ArrayBuffer;
        if (typeof outputData === "string") {
          // If it's a string (base64), decode it
          const binaryString = atob(outputData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          arrayBuffer = bytes.buffer as ArrayBuffer;
        } else {
          // It's a Uint8Array - copy to ensure we have a proper ArrayBuffer
          arrayBuffer = new Uint8Array(outputData).buffer as ArrayBuffer;
        }
        const blob = new Blob([arrayBuffer], { type: "video/mp4" });
        const mergedUrl = URL.createObjectURL(blob);

        // Cleanup
        await ffmpeg.deleteFile("input.mp4");
        await ffmpeg.deleteFile("audio.mp3");
        await ffmpeg.deleteFile("output.mp4");

        setProgress({ stage: "complete", progress: 100, message: "Complete!" });
        return mergedUrl;
      } catch (error) {
        console.error("Merge failed:", error);
        setProgress({
          stage: "error",
          progress: 0,
          message: error instanceof Error ? error.message : "Merge failed",
        });
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [loadFFmpeg]
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
