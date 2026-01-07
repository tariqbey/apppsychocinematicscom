import { useState, useRef, useEffect } from "react";
import { Play, Pause, Flame, Film, VolumeX, Volume2, Maximize, X, Upload, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoUploader } from "./VideoUploader";
import { MediaStudio } from "@/components/studio/MediaStudio";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TheaterViewProps {
  onClose: () => void;
}

export const TheaterView = ({ onClose }: TheaterViewProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [showMediaStudio, setShowMediaStudio] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasRecordedViewing, setHasRecordedViewing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { profile, updateProfile, recordViewing } = useUserProfile();
  const { toast } = useToast();

  const streak = profile?.current_streak || 0;
  const videoUrl = profile?.mind_movie_url;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.addEventListener("timeupdate", handleTimeUpdate);
      videoRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);
      videoRef.current.addEventListener("ended", handleVideoEnd);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener("timeupdate", handleTimeUpdate);
        videoRef.current.removeEventListener("loadedmetadata", handleLoadedMetadata);
        videoRef.current.removeEventListener("ended", handleVideoEnd);
      }
    };
  }, [videoUrl]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      
      // Record viewing when 50% watched
      if (!hasRecordedViewing && videoRef.current.currentTime > videoRef.current.duration * 0.5) {
        recordViewing(Math.floor(videoRef.current.currentTime));
        setHasRecordedViewing(true);
        toast({
          title: "Viewing Recorded! 🎬",
          description: "Your streak has been updated.",
        });
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    if (!hasRecordedViewing) {
      recordViewing(Math.floor(duration));
      setHasRecordedViewing(true);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleUploadComplete = (url: string) => {
    setShowUploader(false);
  };


  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-cinematic-midnight flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-amber-soft flex items-center justify-center">
              <Film className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-display tracking-wide">The Theater</h2>
              <p className="text-sm text-muted-foreground">Your Mind Movie Awaits</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Streak Counter */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-soft/20 to-cinematic-red/20 border border-amber-soft/30">
              <Flame className={cn("w-5 h-5 text-amber-soft", streak > 0 && "streak-fire")} />
              <span className="font-display text-xl text-foreground">{streak}</span>
              <span className="text-sm text-muted-foreground">Day Streak</span>
            </div>

            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Video Player Area */}
        <div className="flex-1 flex items-center justify-center p-8 relative">
          <div className="w-full max-w-5xl aspect-video rounded-xl bg-card border border-border overflow-hidden relative group">
            {videoUrl ? (
              <>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-contain bg-black"
                  playsInline
                />

                {/* Video Controls Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    {/* Progress bar */}
                    <div className="h-1 bg-muted rounded-full mb-4 overflow-hidden cursor-pointer"
                      onClick={(e) => {
                        if (videoRef.current) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const percent = (e.clientX - rect.left) / rect.width;
                          videoRef.current.currentTime = percent * duration;
                        }
                      }}
                    >
                      <div
                        className="h-full bg-gradient-to-r from-gold to-amber-soft transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="gold"
                          size="icon"
                          onClick={togglePlay}
                          className="w-12 h-12"
                        >
                          {isPlaying ? (
                            <Pause className="w-6 h-6" />
                          ) : (
                            <Play className="w-6 h-6 ml-1" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={toggleMute}>
                          {isMuted ? (
                            <VolumeX className="w-5 h-5" />
                          ) : (
                            <Volume2 className="w-5 h-5" />
                          )}
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>

                      <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                        <Maximize className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Viewing recorded badge */}
                {hasRecordedViewing && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/20 border border-green-500/30">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-400">Viewing Recorded</span>
                  </div>
                )}
              </>
            ) : (
              /* Placeholder for no video */
              <div className="absolute inset-0 bg-gradient-to-br from-cinematic-charcoal to-cinematic-midnight flex items-center justify-center">
                <div className="text-center">
                  <Film className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-2">No Mind Movie Yet</p>
                  <p className="text-sm text-muted-foreground/70 mb-6">
                    Create with AI or upload your own
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="gold" onClick={() => setShowMediaStudio(true)}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create with AI
                    </Button>
                    <Button variant="cinematic" onClick={() => setShowUploader(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Video
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-6 border-t border-border/50">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Watch your Mind Movie daily to reinforce your new identity
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setShowMediaStudio(true)}>
                <Sparkles className="w-4 h-4 mr-2" />
                Create with AI
              </Button>
              <Button variant="cinematic" onClick={() => setShowUploader(true)}>
                <Upload className="w-4 h-4 mr-2" />
                {videoUrl ? "Replace Video" : "Upload Video"}
              </Button>
              {videoUrl && (
                <Button variant="gold" onClick={togglePlay}>
                  <Play className="w-4 h-4 mr-2" />
                  {isPlaying ? "Pause" : "Start Screening"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Uploader Modal */}
      {showUploader && (
        <VideoUploader
          currentVideoUrl={videoUrl || null}
          onUploadComplete={handleUploadComplete}
          onClose={() => setShowUploader(false)}
        />
      )}

      {/* AI Media Studio Modal */}
      <MediaStudio
        open={showMediaStudio}
        onOpenChange={setShowMediaStudio}
      />
    </>
  );
};
