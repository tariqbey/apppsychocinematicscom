import { useState, useRef, useEffect } from "react";
import { Play, Pause, Flame, Film, VolumeX, Volume2, Maximize, X, Upload, CheckCircle, Sparkles, Target, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { VideoUploader } from "./VideoUploader";
import { MediaStudio } from "@/components/studio/MediaStudio";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Task {
  id: string;
  task_text: string;
  is_completed: boolean;
  priority: number;
}

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
  const hasRecordedViewingRef = useRef(false);
  const [showThreeThings, setShowThreeThings] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const { profile, updateProfile, recordViewing } = useUserProfile();
  const { user } = useAuth();
  const { toast } = useToast();

  const streak = profile?.current_streak || 0;
  const videoUrl = profile?.mind_movie_url;

  useEffect(() => {
    // Reset the per-session “recorded” flag when switching videos.
    setHasRecordedViewing(false);
    hasRecordedViewingRef.current = false;

    if (videoRef.current) {
      videoRef.current.addEventListener("timeupdate", handleTimeUpdate);
      videoRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);
      videoRef.current.addEventListener("durationchange", handleLoadedMetadata);
      videoRef.current.addEventListener("canplay", handleLoadedMetadata);
      videoRef.current.addEventListener("ended", handleVideoEnd);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener("timeupdate", handleTimeUpdate);
        videoRef.current.removeEventListener("loadedmetadata", handleLoadedMetadata);
        videoRef.current.removeEventListener("durationchange", handleLoadedMetadata);
        videoRef.current.removeEventListener("canplay", handleLoadedMetadata);
        videoRef.current.removeEventListener("ended", handleVideoEnd);
      }
    };
  }, [videoUrl]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;

    setCurrentTime(videoRef.current.currentTime);

    // Record viewing when 50% watched (guarded by a ref to avoid stale-closure spam).
    if (
      !hasRecordedViewingRef.current &&
      videoRef.current.duration > 0 &&
      videoRef.current.currentTime > videoRef.current.duration * 0.5
    ) {
      hasRecordedViewingRef.current = true;
      setHasRecordedViewing(true);
      void recordViewing(Math.floor(videoRef.current.currentTime));

      toast({
        title: "Viewing Recorded! 🎬",
        description: "Your streak has been updated.",
      });
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      let dur = videoRef.current.duration;
      // Fallback to seekable range if duration is not finite
      if (!Number.isFinite(dur) || dur <= 0) {
        if (videoRef.current.seekable.length > 0) {
          dur = videoRef.current.seekable.end(videoRef.current.seekable.length - 1);
        }
      }
      if (dur && Number.isFinite(dur) && dur > 0) {
        setDuration(dur);
      }
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);

    if (!hasRecordedViewingRef.current) {
      hasRecordedViewingRef.current = true;
      setHasRecordedViewing(true);
      void recordViewing(Math.floor(videoRef.current?.duration ?? duration));
    }

    // Show Three Things prompt after video ends
    setShowThreeThings(true);
    loadTodaysTasks();
  };

  // Load today's tasks
  const loadTodaysTasks = async () => {
    if (!user) return;
    setIsLoadingTasks(true);

    const dateStr = format(new Date(), "yyyy-MM-dd");
    const { data, error } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("task_date", dateStr)
      .order("priority");

    if (!error && data) {
      setTasks(data);
    }
    setIsLoadingTasks(false);
  };

  // Add a task
  const addTask = async () => {
    if (!user || !newTaskText.trim()) return;
    if (tasks.length >= 3) {
      toast({
        title: "Maximum 3 tasks",
        description: "Focus on your top 3 priorities for the day.",
        variant: "destructive",
      });
      return;
    }

    const dateStr = format(new Date(), "yyyy-MM-dd");
    const { data, error } = await supabase
      .from("daily_tasks")
      .insert({
        user_id: user.id,
        task_text: newTaskText.trim(),
        task_date: dateStr,
        priority: tasks.length + 1,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to add task", variant: "destructive" });
    } else if (data) {
      setTasks([...tasks, data]);
      setNewTaskText("");
    }
  };

  // Toggle task completion
  const toggleTask = async (task: Task) => {
    const { error } = await supabase
      .from("daily_tasks")
      .update({ is_completed: !task.is_completed })
      .eq("id", task.id);

    if (!error) {
      setTasks(tasks.map(t => t.id === task.id ? { ...t, is_completed: !t.is_completed } : t));
    }
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from("daily_tasks")
      .delete()
      .eq("id", taskId);

    if (!error) {
      setTasks(tasks.filter(t => t.id !== taskId));
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

  const toggleFullscreen = async () => {
    const playerEl = playerRef.current;
    const videoEl = videoRef.current;

    // Detect iOS (iPhone, iPad, iPod, or iPad with desktop mode)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // iOS Safari specific path - only webkitEnterFullscreen works on video elements
    if (isIOS && videoEl) {
      const anyVideo = videoEl as unknown as { 
        webkitEnterFullscreen?: () => void;
        webkitExitFullscreen?: () => void;
        webkitDisplayingFullscreen?: boolean;
      };
      
      if (anyVideo.webkitDisplayingFullscreen) {
        try {
          anyVideo.webkitExitFullscreen?.();
        } catch {
          // ignore
        }
      } else {
        try {
          anyVideo.webkitEnterFullscreen?.();
        } catch {
          // ignore
        }
      }
      return;
    }

    // Standard path for Android/Desktop
    // If we're already in fullscreen, exit.
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // ignore
      }
      return;
    }

    // Prefer fullscreen on the container so controls/layout fill the screen.
    if (playerEl?.requestFullscreen) {
      try {
        await playerEl.requestFullscreen();
        return;
      } catch {
        // fall through
      }
    }

    // Fallback to video fullscreen when supported.
    if (videoEl?.requestFullscreen) {
      try {
        await videoEl.requestFullscreen();
        return;
      } catch {
        // fall through
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
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
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border/50">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-gold to-amber-soft flex items-center justify-center flex-shrink-0">
              <Film className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-display tracking-wide truncate">The Theater</h2>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Your Mind Movie Awaits</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Streak Counter */}
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r from-amber-soft/20 to-cinematic-red/20 border border-amber-soft/30">
              <Flame className={cn("w-4 h-4 sm:w-5 sm:h-5 text-amber-soft", streak > 0 && "streak-fire")} />
              <span className="font-display text-lg sm:text-xl text-foreground">{streak}</span>
              <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">Day Streak</span>
            </div>

            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 sm:h-10 sm:w-10">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>

        {/* Video Player Area - Responsive with full-width on mobile */}
          <div className="flex-1 flex items-center justify-center p-2 sm:p-4 md:p-8 relative overflow-hidden">
            <div ref={playerRef} className="theater-player w-full h-full sm:h-auto sm:max-w-5xl sm:aspect-video rounded-lg sm:rounded-xl bg-card border border-border overflow-hidden relative group">
            {videoUrl ? (
              <>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="theater-video w-full h-full object-contain bg-black"
                  playsInline
                  webkit-playsinline="true"
                  controls={false}
                  onClick={togglePlay}
                  preload="auto"
                  onError={(e) => {
                    console.error("Video error:", e);
                    // Attempt to reload the video on error
                    const video = e.currentTarget;
                    const currentSrc = video.src;
                    video.src = '';
                    setTimeout(() => {
                      video.src = currentSrc;
                      video.load();
                    }, 100);
                  }}
                  onStalled={() => {
                    // Handle stalled playback
                    if (videoRef.current && isPlaying) {
                      videoRef.current.play().catch(() => {});
                    }
                  }}
                  onWaiting={() => {
                    // Video is buffering - this is expected behavior
                  }}
                />

                {/* Video Controls Overlay - Always visible on mobile, hover on desktop */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 pointer-events-auto">
                    {/* Progress bar */}
                    <div 
                      className="h-2 sm:h-1 bg-muted rounded-full mb-3 sm:mb-4 overflow-hidden cursor-pointer touch-none"
                      onClick={(e) => {
                        if (videoRef.current) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const percent = (e.clientX - rect.left) / rect.width;
                          videoRef.current.currentTime = percent * duration;
                        }
                      }}
                      onTouchStart={(e) => {
                        if (videoRef.current && e.touches[0]) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const percent = (e.touches[0].clientX - rect.left) / rect.width;
                          videoRef.current.currentTime = Math.max(0, Math.min(1, percent)) * duration;
                        }
                      }}
                    >
                      <div
                        className="h-full bg-gradient-to-r from-gold to-amber-soft transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-4">
                        <Button
                          variant="gold"
                          size="icon"
                          onClick={togglePlay}
                          className="w-10 h-10 sm:w-12 sm:h-12"
                        >
                          {isPlaying ? (
                            <Pause className="w-5 h-5 sm:w-6 sm:h-6" />
                          ) : (
                            <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8 sm:h-10 sm:w-10">
                          {isMuted ? (
                            <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                          ) : (
                            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </Button>
                        <span className="text-xs sm:text-sm text-white font-mono bg-black/50 px-2 py-0.5 rounded">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>

                      <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-8 w-8 sm:h-10 sm:w-10">
                        <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Viewing recorded badge */}
                {hasRecordedViewing && (
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg bg-green-500/20 border border-green-500/30">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                    <span className="text-xs sm:text-sm text-green-400">Recorded</span>
                  </div>
                )}
              </>
            ) : (
              /* Placeholder for no video */
              <div className="absolute inset-0 bg-gradient-to-br from-cinematic-charcoal to-cinematic-midnight flex items-center justify-center p-4">
                <div className="text-center">
                  <Film className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4 opacity-50" />
                  <p className="text-muted-foreground text-sm sm:text-base mb-1 sm:mb-2">No Mind Movie Yet</p>
                  <p className="text-xs sm:text-sm text-muted-foreground/70 mb-4 sm:mb-6">
                    Create with AI or upload your own
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                    <Button variant="gold" onClick={() => setShowMediaStudio(true)} className="text-sm">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create with AI
                    </Button>
                    <Button variant="cinematic" onClick={() => setShowUploader(true)} className="text-sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Video
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Three Things Panel - appears after video ends */}
        {showThreeThings && (
          <div className="absolute inset-0 z-10 bg-cinematic-midnight/95 backdrop-blur-sm flex items-center justify-center animate-fade-in p-4">
            <div className="w-full max-w-xl p-4 sm:p-8 rounded-2xl bg-card border border-gold/30 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gradient-to-br from-gold to-amber-soft flex items-center justify-center">
                  <Target className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl sm:text-2xl font-display tracking-wide mb-2">
                  Now, Your Three Things
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  What are the 3 most important things you'll accomplish today?
                </p>
              </div>

              {/* Tasks List */}
              <div className="space-y-2 sm:space-y-3 mb-4">
                {isLoadingTasks ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <p>No tasks yet. Add your priorities below.</p>
                  </div>
                ) : (
                  tasks.map((task, index) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-colors ${
                        task.is_completed
                          ? "bg-muted/30 border-border/30"
                          : "bg-muted/50 border-border/50"
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-bold text-gold w-5 sm:w-6">#{index + 1}</span>
                      <Checkbox
                        checked={task.is_completed}
                        onCheckedChange={() => toggleTask(task)}
                      />
                      <span className={`flex-1 text-sm sm:text-base ${task.is_completed ? "line-through text-muted-foreground" : ""}`}>
                        {task.task_text}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Task Input */}
              {tasks.length < 3 && (
                <div className="flex gap-2 mb-4 sm:mb-6">
                  <Input
                    placeholder={`Add priority #${tasks.length + 1}...`}
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTask()}
                    className="bg-background/50 text-sm"
                  />
                  <Button onClick={addTask} disabled={!newTaskText.trim()} variant="gold" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Progress indicator */}
              <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
                {[1, 2, 3].map((num) => (
                  <div
                    key={num}
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-colors ${
                      tasks.length >= num ? "bg-gold" : "bg-muted"
                    }`}
                  />
                ))}
                <span className="text-xs sm:text-sm text-muted-foreground ml-2">{tasks.length}/3 set</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowThreeThings(false)}
                  className="text-sm"
                >
                  Back to Theater
                </Button>
                <Button
                  variant="gold"
                  onClick={onClose}
                  disabled={tasks.length === 0}
                  className="text-sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Start My Day
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions - Responsive */}
        <div className="p-3 sm:p-6 border-t border-border/50">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-muted-foreground text-xs sm:text-sm text-center sm:text-left hidden sm:block">
              Watch your Mind Movie daily to reinforce your new identity
            </p>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
              <Button variant="outline" size="sm" onClick={() => setShowMediaStudio(true)} className="text-xs sm:text-sm">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Create with AI</span>
                <span className="sm:hidden">AI</span>
              </Button>
              <Button variant="cinematic" size="sm" onClick={() => setShowUploader(true)} className="text-xs sm:text-sm">
                <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{videoUrl ? "Replace Video" : "Upload Video"}</span>
                <span className="sm:hidden">Upload</span>
              </Button>
              {videoUrl && (
                <Button variant="gold" size="sm" onClick={togglePlay} className="text-xs sm:text-sm">
                  <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{isPlaying ? "Pause" : "Start Screening"}</span>
                  <span className="sm:hidden">{isPlaying ? "Pause" : "Play"}</span>
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
