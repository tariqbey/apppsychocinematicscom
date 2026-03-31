import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Video, Square, Play, RotateCcw, Camera, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

interface TestimonialRecorderProps {
  type: "audio" | "video";
  onRecordingComplete: (blob: Blob, thumbnailBlob?: Blob) => void;
  onCancel: () => void;
}

const MAX_DURATION = 30; // 30 seconds

const isIOS = () => /iPad|iPhone|iPod/i.test(navigator.userAgent);

const canPlayVideoType = (mimeType: string) => {
  try {
    const v = document.createElement("video");
    return v.canPlayType(mimeType) !== "";
  } catch {
    return true;
  }
};

// Get supported recording mime type (browser support != playback support on iOS)
const getSupportedMimeType = (isVideo: boolean): string => {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return isVideo ? "video/mp4" : "audio/mp4";
  }

  if (isVideo) {
    const videoTypes = [
      // iOS Safari is most reliable with MP4/H264
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4",
      // WebM fallbacks for Chrome/Android
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];
    for (const type of videoTypes) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return "video/webm";
  }

  const audioTypes = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"];
  for (const type of audioTypes) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "audio/webm";
};

export function TestimonialRecorder({ type, onRecordingComplete, onCancel }: TestimonialRecorderProps) {
  const [isReady, setIsReady] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [isVideoCompressed, setIsVideoCompressed] = useState(false);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // Clean up object URLs to prevent memory leaks
  const cleanupPreviewUrl = useCallback(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
      clearTimer();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [stopStream, clearTimer, previewUrl]);

  const generateThumbnail = useCallback(() => {
    if (type !== "video" || !videoPreviewRef.current || !canvasRef.current) return null;
    
    const video = videoPreviewRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 1280;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.8);
      });
    }
    return null;
  }, [type]);

  const compressVideo = useCallback(async (inputBlob: Blob): Promise<{ blob: Blob; isCompressed: boolean }> => {
    try {
      setIsCompressing(true);
      setCompressionProgress(0);
      setOriginalSize(inputBlob.size);

      const needsPlaybackTranscode =
        isIOS() &&
        !!inputBlob.type &&
        inputBlob.type.includes("webm") &&
        !canPlayVideoType(inputBlob.type);

      const needsSizeCompression = inputBlob.size >= 5 * 1024 * 1024;

      // Skip FFmpeg entirely if we don't need it
      if (!needsPlaybackTranscode && !needsSizeCompression) {
        console.log("Video does not need processing; using original", {
          type: inputBlob.type,
          size: inputBlob.size,
        });
        setCompressedSize(inputBlob.size);
        return { blob: inputBlob, isCompressed: false };
      }

      // Check if we're on a mobile device - FFmpeg WASM may have issues
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Try FFmpeg compression
      try {
        // Initialize FFmpeg if not already done
        if (!ffmpegRef.current) {
          const ffmpeg = new FFmpeg();
          ffmpeg.on("progress", ({ progress }) => {
            setCompressionProgress(Math.round(progress * 100));
          });

          const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
          
          // Use smaller timeout for mobile
          const loadPromise = ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
          });

          // Add timeout for FFmpeg load
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error("FFmpeg load timeout")), isMobile ? 15000 : 30000)
          );

          await Promise.race([loadPromise, timeoutPromise]);
          ffmpegRef.current = ffmpeg;
        }

         const ffmpeg = ffmpegRef.current;

         const inputExt = inputBlob.type.includes("mp4") ? "mp4" : "webm";
         const inputFileName = `input.${inputExt}`;
        const outputFileName = "output.mp4";

        // Write input file
        await ffmpeg.writeFile(inputFileName, await fetchFile(inputBlob));

         // Transcode/compress video with good quality/size balance (and iOS-friendly container)
         await ffmpeg.exec([
           "-i",
           inputFileName,
           "-c:v",
           "libx264",
           "-crf",
           needsSizeCompression ? "28" : "23",
           "-preset",
           "fast",
           "-vf",
           "scale=-2:720",
           "-c:a",
           "aac",
           "-b:a",
           "64k",
           "-movflags",
           "+faststart",
           outputFileName,
         ]);

        // Read the output file
        const data = await ffmpeg.readFile(outputFileName);
        const compressedVideoBlob = new Blob([new Uint8Array(data as unknown as ArrayBuffer).buffer], { type: "video/mp4" });
        
        setCompressedSize(compressedVideoBlob.size);
        console.log(`Compressed video from ${(inputBlob.size / 1024 / 1024).toFixed(2)}MB to ${(compressedVideoBlob.size / 1024 / 1024).toFixed(2)}MB`);

        // Clean up
        await ffmpeg.deleteFile(inputFileName);
        await ffmpeg.deleteFile(outputFileName);

        return { blob: compressedVideoBlob, isCompressed: true };
      } catch (ffmpegError) {
        console.warn("FFmpeg compression failed, using original:", ffmpegError);
        setCompressedSize(inputBlob.size);
        return { blob: inputBlob, isCompressed: false };
      }
    } catch (err) {
      console.error("Video compression failed:", err);
      setCompressedSize(inputBlob.size);
      return { blob: inputBlob, isCompressed: false };
    } finally {
      setIsCompressing(false);
    }
  }, []);

  // Ensure preview video reloads when URL changes (important on iOS)
  useEffect(() => {
    if (type !== "video" || !isPreviewing || !previewUrl || !videoPreviewRef.current) return;
    const video = videoPreviewRef.current;

    const handleLoadedMetadata = () => {
      console.log("[TestimonialRecorder] preview loadedmetadata", {
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
      });
    };

    const handleCanPlay = () => {
      try {
        // Seek slightly forward for a non-black thumbnail frame
        const t = Math.min(0.1, Math.max(0, (video.duration || 0) - 0.1));
        video.currentTime = t;
      } catch {
        // ignore
      }
    };

    const handleSeeked = async () => {
      const thumb = await generateThumbnail();
      if (thumb) setThumbnailBlob(thumb);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("seeked", handleSeeked);
    video.load();

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("seeked", handleSeeked);
    };
  }, [type, isPreviewing, previewUrl, generateThumbnail]);

  const prepareRecording = async () => {
    setError(null);
    
    try {
      const constraints = type === "video" 
        ? { 
            video: { 
              width: { ideal: 720, max: 1280 },
              height: { ideal: 1280, max: 1920 },
              frameRate: { ideal: 30, max: 30 },
              facingMode: "user"
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true
            }
          }
        : { 
            audio: {
              echoCancellation: true,
              noiseSuppression: true
            }
          };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (type === "video" && liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        await liveVideoRef.current.play();
      }
      
      setIsReady(true);
    } catch (err) {
      console.error("Error accessing media devices:", err);
      setError(`Unable to access ${type === "video" ? "camera" : "microphone"}. Please check permissions.`);
    }
  };

  const initiateRecording = () => {
    setIsCountingDown(true);
    setCountdown(3);
    
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          setIsCountingDown(false);
          startRecordingActual();
          return 3;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecordingActual = async () => {
    if (!streamRef.current) {
      await prepareRecording();
      return;
    }
    
    setError(null);
    chunksRef.current = [];
    cleanupPreviewUrl();
    
    try {
      const mimeType = getSupportedMimeType(type === "video");
      console.log("Using mime type:", mimeType);
      
      const options: MediaRecorderOptions = {
        mimeType,
      };
      
      // Higher bitrate for smoother video
      if (type === "video") {
        options.videoBitsPerSecond = 2500000; // 2.5 Mbps for smoother video
        options.audioBitsPerSecond = 128000;  // 128 kbps audio
      } else {
        options.audioBitsPerSecond = 128000;
      }
      
      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const recorderMime = mediaRecorder.mimeType || chunksRef.current?.[0]?.type || "";

        // IMPORTANT: don't hardcode webm here; iOS may record mp4
        const blob = new Blob(chunksRef.current, {
          type: recorderMime || (type === "video" ? "video/mp4" : "audio/mp4"),
        });

        console.log("[TestimonialRecorder] recording complete", {
          chunks: chunksRef.current.length,
          mime: recorderMime,
          blobType: blob.type,
          size: blob.size,
        });

        if (!blob.size) {
          setError("No video data was captured. Please try again.");
          stopStream();
          setIsReady(false);
          setIsRecording(false);
          return;
        }

        setRecordedBlob(blob);
        setIsPreviewing(true);

        // Show preview immediately (then swap to processed MP4 if needed)
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });

        stopStream();
        setIsReady(false);

        if (type === "video") {
          const result = await compressVideo(blob);
          setIsVideoCompressed(result.isCompressed);
          setCompressedBlob(result.blob);

          // If we generated a new blob (transcode/compress), update preview URL
          if (result.blob !== blob) {
            setPreviewUrl((prev) => {
              if (prev) URL.revokeObjectURL(prev);
              return URL.createObjectURL(result.blob);
            });
          }
        }
      };
      
      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setError("Recording error occurred. Please try again.");
      };
      
      // Start recording - iOS can be flaky with very small timeslices
      if (isIOS()) {
        mediaRecorder.start();
      } else {
        mediaRecorder.start(100); // Collect data every 100ms
      }
      setIsRecording(true);
      setTimeElapsed(0);
      
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => {
          if (prev >= MAX_DURATION - 1) {
            stopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (err) {
      console.error("Error starting recording:", err);
      setError(`Unable to start recording. Please try again.`);
    }
  };

  const stopRecording = () => {
    clearTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const resetRecording = () => {
    cleanupPreviewUrl();
    setRecordedBlob(null);
    setCompressedBlob(null);
    setIsVideoCompressed(false);
    setThumbnailBlob(null);
    setIsPreviewing(false);
    setIsCompressing(false);
    setCompressionProgress(0);
    setOriginalSize(0);
    setCompressedSize(0);
    setIsReady(false);
    setIsCountingDown(false);
    setCountdown(3);
    setTimeElapsed(0);
    clearTimer();
    stopStream();
    if (videoPreviewRef.current) {
      videoPreviewRef.current.src = "";
      videoPreviewRef.current.load();
    }
  };

  const handleSubmit = () => {
    // Use compressed blob for video, original for audio
    const blobToSubmit = type === "video" && compressedBlob ? compressedBlob : recordedBlob;
    if (blobToSubmit) {
      onRecordingComplete(blobToSubmit, thumbnailBlob || undefined);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const mb = bytes / 1024 / 1024;
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = (timeElapsed / MAX_DURATION) * 100;

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} className="hidden" />
      
      {error && (
        <div className="p-3 bg-destructive/20 border border-destructive/50 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Live Preview (video - shown when ready or recording) */}
      {type === "video" && !isPreviewing && (
        <div className="relative aspect-[9/16] max-h-[400px] bg-muted rounded-lg overflow-hidden">
          <video
            ref={liveVideoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
            autoPlay
          />
          {!isReady && !isRecording && !isCountingDown && (
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
              <Video className="h-16 w-16 text-muted-foreground/50" />
              <span className="text-sm text-muted-foreground">Camera preview will appear here</span>
            </div>
          )}
          {isCountingDown && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="text-8xl font-bold text-white animate-pulse">{countdown}</span>
            </div>
          )}
          {isRecording && (
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white text-sm font-medium">REC</span>
            </div>
          )}
        </div>
      )}

      {/* Audio - Ready state indicator */}
      {type === "audio" && isReady && !isRecording && !isPreviewing && !isCountingDown && (
        <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
          <div className="flex items-center gap-3 flex-col">
            <Mic className="h-12 w-12 text-primary" />
            <span className="text-lg font-medium">Microphone ready</span>
            <span className="text-sm text-muted-foreground">Click "Start Recording" when ready</span>
          </div>
        </div>
      )}

      {/* Audio - Countdown */}
      {type === "audio" && isCountingDown && (
        <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
          <div className="flex items-center gap-3 flex-col">
            <span className="text-6xl font-bold text-primary animate-pulse">{countdown}</span>
            <span className="text-lg font-medium">Get ready...</span>
          </div>
        </div>
      )}

      {/* Audio Recording Indicator */}
      {type === "audio" && isRecording && (
        <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
            <span className="text-lg font-medium">Recording...</span>
          </div>
        </div>
      )}

      {/* Compression / Processing Progress */}
      {isCompressing && (
        <div className="space-y-3 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-3 justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-lg font-medium">Processing video…</span>
          </div>
          <Progress value={compressionProgress} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">{compressionProgress}% complete</p>
        </div>
      )}

      {/* Preview */}
      {isPreviewing && recordedBlob && previewUrl && (
        <div className="space-y-3">
          {type === "video" ? (
            <>
              <div className="aspect-[9/16] max-h-[400px] bg-muted rounded-lg overflow-hidden">
                <video
                  ref={videoPreviewRef}
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  controls
                  playsInline
                  preload="auto"
                />
              </div>
              {originalSize > 0 && compressedSize > 0 && (
                <div className="text-xs text-muted-foreground text-center space-y-1">
                  <p>Original: {formatFileSize(originalSize)} → Compressed: {formatFileSize(compressedSize)}</p>
                  <p className="text-green-500">
                    Saved {Math.round((1 - compressedSize / originalSize) * 100)}% file size
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 bg-muted rounded-lg">
              <audio
                src={previewUrl}
                controls
                className="w-full"
                preload="auto"
              />
            </div>
          )}
        </div>
      )}

      {/* Timer and Progress */}
      {isRecording && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatTime(timeElapsed)}</span>
            <span>{formatTime(MAX_DURATION)}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 justify-center flex-wrap">
        {/* Initial state - not ready yet */}
        {!isReady && !isRecording && !isPreviewing && !isCountingDown && (
          <>
            <Button onClick={prepareRecording} variant="outline" className="gap-2">
              {type === "video" ? <Camera className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {type === "video" ? "Activate Camera" : "Activate Microphone"}
            </Button>
            <Button onClick={onCancel} variant="ghost">
              Cancel
            </Button>
          </>
        )}

        {/* Ready state - camera/mic active, can start recording */}
        {isReady && !isRecording && !isPreviewing && !isCountingDown && (
          <>
            <Button onClick={initiateRecording} variant="gold" className="gap-2">
              {type === "video" ? <Video className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              Start Recording
            </Button>
            <Button onClick={resetRecording} variant="outline">
              Cancel
            </Button>
          </>
        )}

        {/* Countdown state */}
        {isCountingDown && (
          <Button onClick={resetRecording} variant="outline">
            Cancel
          </Button>
        )}

        {/* Recording state */}
        {isRecording && (
          <Button onClick={stopRecording} variant="destructive" className="gap-2">
            <Square className="h-4 w-4" />
            Stop Recording
          </Button>
        )}

        {/* Preview state */}
        {isPreviewing && (
          <>
            <Button onClick={resetRecording} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Re-record
            </Button>
            <Button onClick={handleSubmit} variant="gold" className="gap-2">
              <Play className="h-4 w-4" />
              Use This Recording
            </Button>
          </>
        )}
      </div>
    </div>
  );
}