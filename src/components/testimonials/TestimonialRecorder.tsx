import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Video, Square, Play, RotateCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TestimonialRecorderProps {
  type: "audio" | "video";
  onRecordingComplete: (blob: Blob, thumbnailBlob?: Blob) => void;
  onCancel: () => void;
}

const MAX_DURATION = 30; // 30 seconds

export function TestimonialRecorder({ type, onRecordingComplete, onCancel }: TestimonialRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
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
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
      clearTimer();
    };
  }, [stopStream, clearTimer]);

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

  const startRecording = async () => {
    setError(null);
    chunksRef.current = [];
    
    try {
      const constraints = type === "video" 
        ? { 
            video: { 
              width: { ideal: 720 },
              height: { ideal: 1280 },
              facingMode: "user"
            },
            audio: true 
          }
        : { audio: true };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (type === "video" && liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.play();
      }
      
      const mimeType = type === "video" 
        ? "video/webm;codecs=vp8,opus"
        : "audio/webm;codecs=opus";
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: type === "video" ? 500000 : undefined,
        audioBitsPerSecond: 64000
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { 
          type: type === "video" ? "video/webm" : "audio/webm" 
        });
        setRecordedBlob(blob);
        setIsPreviewing(true);
        stopStream();
        
        // Generate thumbnail for video after setting preview
        if (type === "video" && videoPreviewRef.current) {
          videoPreviewRef.current.src = URL.createObjectURL(blob);
          videoPreviewRef.current.onloadeddata = async () => {
            const thumb = await generateThumbnail();
            if (thumb) setThumbnailBlob(thumb);
          };
        }
      };
      
      mediaRecorder.start(1000);
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
      console.error("Error accessing media devices:", err);
      setError(`Unable to access ${type === "video" ? "camera" : "microphone"}. Please check permissions.`);
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
    setRecordedBlob(null);
    setThumbnailBlob(null);
    setIsPreviewing(false);
    setTimeElapsed(0);
    if (videoPreviewRef.current) {
      videoPreviewRef.current.src = "";
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

      {/* Live Preview (while recording video) */}
      {type === "video" && !isPreviewing && (
        <div className="relative aspect-[9/16] max-h-[400px] bg-muted rounded-lg overflow-hidden">
          <video
            ref={liveVideoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
          {!isRecording && !streamRef.current && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Video className="h-16 w-16 text-muted-foreground/50" />
            </div>
          )}
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
      {isPreviewing && recordedBlob && (
        <div className="space-y-3">
          {type === "video" ? (
            <div className="aspect-[9/16] max-h-[400px] bg-muted rounded-lg overflow-hidden">
              <video
                ref={videoPreviewRef}
                className="w-full h-full object-cover"
                controls
                playsInline
              />
            </div>
          ) : (
            <div className="p-4 bg-muted rounded-lg">
              <audio
                src={URL.createObjectURL(recordedBlob)}
                controls
                className="w-full"
              />
            </div>
          )}
        </div>
      )}

      {/* Timer and Progress */}
      {(isRecording || isPreviewing) && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatTime(timeElapsed)}</span>
            <span>{formatTime(MAX_DURATION)}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        {!isRecording && !isPreviewing && (
          <>
            <Button onClick={startRecording} variant="gold" className="gap-2">
              {type === "video" ? <Video className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              Start Recording
            </Button>
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
          </>
        )}

        {isRecording && (
          <Button onClick={stopRecording} variant="destructive" className="gap-2">
            <Square className="h-4 w-4" />
            Stop Recording
          </Button>
        )}

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
