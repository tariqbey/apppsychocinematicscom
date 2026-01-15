import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, X, Maximize2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface MoviePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movieUrl: string | null;
  movieTitle: string;
}

export function MoviePreviewModal({
  open,
  onOpenChange,
  movieUrl,
  movieTitle,
}: MoviePreviewModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const { toast } = useToast();

  // Reset state when modal opens or URL changes
  useEffect(() => {
    if (open && videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
      setDuration(0);
    }
  }, [open, movieUrl]);

  // Video event listeners with robust duration detection
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    
    // Robust duration detection for WebM and other formats
    const handleDurationUpdate = () => {
      let dur = video.duration;
      
      // If duration is not finite, try seekable ranges as fallback
      if (!Number.isFinite(dur) || dur <= 0) {
        if (video.seekable.length > 0) {
          dur = video.seekable.end(video.seekable.length - 1);
        }
      }
      
      if (dur && Number.isFinite(dur) && dur > 0) {
        setDuration(dur);
      }
    };
    
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      console.error("Video playback error:", video.error);
      toast({
        title: "Playback Error",
        description: "Could not play video. The format may not be supported.",
        variant: "destructive",
      });
    };

    // Check if duration is already available
    if (video.duration && Number.isFinite(video.duration) && video.duration > 0) {
      setDuration(video.duration);
    }

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleDurationUpdate);
    video.addEventListener("durationchange", handleDurationUpdate);
    video.addEventListener("canplay", handleDurationUpdate);
    video.addEventListener("loadeddata", handleDurationUpdate);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleDurationUpdate);
      video.removeEventListener("durationchange", handleDurationUpdate);
      video.removeEventListener("canplay", handleDurationUpdate);
      video.removeEventListener("loadeddata", handleDurationUpdate);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
    };
  }, [toast, movieUrl]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!videoRef.current) return;
    const newVolume = value[0] / 100;
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(duration, percent * duration));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!movieUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-border">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-50 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Video container */}
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            src={movieUrl}
            className="w-full h-full object-contain cursor-pointer"
            playsInline
            preload="metadata"
            crossOrigin="anonymous"
            onClick={togglePlay}
          />

          {/* Play overlay (when paused) */}
          {!isPlaying && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
              onClick={togglePlay}
            >
              <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center">
                <Play className="w-8 h-8 text-primary-foreground ml-1" />
              </div>
            </div>
          )}

          {/* ALWAYS VISIBLE Controls - no auto-hide */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
            {/* Progress bar - custom click-to-seek */}
            <div 
              className="w-full h-2 bg-white/20 rounded-full cursor-pointer mb-3 group"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-gradient-to-r from-gold to-amber-soft rounded-full relative transition-all"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
              </div>
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:text-gold hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>

              {/* Time display - always visible */}
              <span className="text-sm text-white/90 font-mono tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              <div className="flex-1" />

              {/* Volume */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:text-gold hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="w-20"
                />
              </div>

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:text-gold hover:bg-white/20"
                onClick={handleFullscreen}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="p-4 bg-background border-t border-border">
          <h3 className="font-medium truncate">{movieTitle}</h3>
        </div>
      </DialogContent>
    </Dialog>
  );
}
