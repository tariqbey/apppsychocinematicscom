import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Video, Square, Play, RotateCcw, Camera } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TestimonialRecorderProps {
  type: "audio" | "video";
  onRecordingComplete: (blob: Blob, thumbnailBlob?: Blob) => void;
  onCancel: () => void;
}

const MAX_DURATION = 30; // 30 seconds

// Get supported video mime type
const getSupportedMimeType = (isVideo: boolean): string => {
  if (isVideo) {
    // Try different codecs in order of preference
    const videoTypes = [
      'video/mp4',
      'video/webm;codecs=h264',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ];
    for (const type of videoTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return 'video/webm';
  } else {
    const audioTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4'
    ];
    for (const type of audioTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return 'audio/webm';
  }
};

export function TestimonialRecorder({ type, onRecordingComplete, onCancel }: TestimonialRecorderProps) {
  const [isReady, setIsReady] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      stopStream();
      clearTimer();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
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
        // Create blob from all chunks
        const blobType = type === "video" ? "video/webm" : "audio/webm";
        const blob = new Blob(chunksRef.current, { type: blobType });
        
        console.log("Recording complete, blob size:", blob.size, "bytes");
        
        setRecordedBlob(blob);
        setIsPreviewing(true);
        stopStream();
        setIsReady(false);
        
        // Create object URL for preview
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        
        // Set video source and generate thumbnail
        if (type === "video" && videoPreviewRef.current) {
          videoPreviewRef.current.src = url;
          videoPreviewRef.current.load();
          
          videoPreviewRef.current.onloadedmetadata = () => {
            console.log("Video duration:", videoPreviewRef.current?.duration);
          };
          
          videoPreviewRef.current.oncanplay = async () => {
            // Seek to start and generate thumbnail
            if (videoPreviewRef.current) {
              videoPreviewRef.current.currentTime = 0.1;
            }
          };
          
          videoPreviewRef.current.onseeked = async () => {
            const thumb = await generateThumbnail();
            if (thumb) setThumbnailBlob(thumb);
          };
        }
      };
      
      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setError("Recording error occurred. Please try again.");
      };
      
      // Start recording - collect data more frequently for smoother results
      mediaRecorder.start(100); // Collect data every 100ms
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
    setThumbnailBlob(null);
    setIsPreviewing(false);
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
    if (recordedBlob) {
      onRecordingComplete(recordedBlob, thumbnailBlob || undefined);
    }
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

      {/* Preview */}
      {isPreviewing && recordedBlob && previewUrl && (
        <div className="space-y-3">
          {type === "video" ? (
            <div className="aspect-[9/16] max-h-[400px] bg-muted rounded-lg overflow-hidden">
              <video
                ref={videoPreviewRef}
                className="w-full h-full object-cover"
                controls
                playsInline
                preload="auto"
              />
            </div>
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