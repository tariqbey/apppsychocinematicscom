import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Flame,
  Film,
  X,
  Upload,
  CheckCircle,
  Sparkles,
  Target,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
 import { EpisodeMovieSelector } from "./EpisodeMovieSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { VideoUploader } from "./VideoUploader";
import { MindMoviePlayer, MindMoviePlayerHandle } from "./MindMoviePlayer";
import { MediaStudio } from "@/components/studio/MediaStudio";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useAudioOptional } from "@/hooks/useGlobalAudio";

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
  const [showUploader, setShowUploader] = useState(false);
  const [showMediaStudio, setShowMediaStudio] = useState(false);
  const [hasRecordedViewing, setHasRecordedViewing] = useState(false);
  const [showThreeThings, setShowThreeThings] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
   
   // Episode movie mode
   const [videoSource, setVideoSource] = useState<"mind-movie" | "episode">("mind-movie");
   const [selectedEpisode, setSelectedEpisode] = useState<{
     id: string;
     title: string;
     movie_url: string;
   } | null>(null);

  const playerRef = useRef<MindMoviePlayerHandle>(null);
  const { profile, recordViewing } = useUserProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const globalAudio = useAudioOptional();

  const streak = profile?.current_streak || 0;
   const mindMovieUrl = profile?.mind_movie_url;
   
   // Determine which video to play based on source
   const videoUrl = videoSource === "episode" && selectedEpisode?.movie_url 
     ? selectedEpisode.movie_url 
     : mindMovieUrl;

  // Force stop all media on close — safe pause only, no source destruction
  const stopAllMedia = useCallback(() => {
    try {
      playerRef.current?.pause();
    } catch {
      // Ignore
    }
    globalAudio?.stopAudio();
  }, [globalAudio]);

  // Close handler with cleanup
  const closeTheater = useCallback(() => {
    stopAllMedia();
    onClose();
  }, [stopAllMedia, onClose]);

  // Stop background audio when Theater opens
  useEffect(() => {
    globalAudio?.stopAudio();
  }, [globalAudio]);

  const isIOS = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  }, []);

  const isStandalone = useMemo(() => {
    if (typeof window === "undefined") return false;
    const mql = window.matchMedia?.("(display-mode: standalone)");
    const legacyIOSStandalone = (navigator as any)?.standalone === true;
    return Boolean(mql?.matches || legacyIOSStandalone);
  }, []);

  const isIOSStandalone = isIOS && isStandalone;

   // Use direct URL - MindMoviePlayer handles playback natively
   const playbackSrc = videoUrl || null;

  // Load today's tasks
  const loadTodaysTasks = useCallback(async () => {
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
  }, [user]);

  // Reset completion state when video URL changes
  useEffect(() => {
    setHasRecordedViewing(false);
  }, [videoUrl]);

  // Video completed → record viewing + show tasks
  const handleVideoComplete = useCallback(
    (durationSeconds: number) => {
      if (hasRecordedViewing) return;
      setHasRecordedViewing(true);
      void recordViewing(durationSeconds);
      toast({
        title: "Mind Movie completed",
        description: "Completion recorded.",
      });
      setShowThreeThings(true);
      loadTodaysTasks();
    },
    [hasRecordedViewing, recordViewing, toast, loadTodaysTasks]
  );

  const handleVideoError = useCallback(
    (message: string) => {
      toast({
        title: "Video playback issue",
        description: message,
        variant: "destructive",
      });
    },
    [toast]
  );

  // Task CRUD ------------------------------------------------
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
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      });
    } else if (data) {
      setTasks([...tasks, data]);
      setNewTaskText("");
    }
  };

  const toggleTask = async (task: Task) => {
    const { error } = await supabase
      .from("daily_tasks")
      .update({ is_completed: !task.is_completed })
      .eq("id", task.id);

    if (!error) {
      setTasks(
        tasks.map((t) =>
          t.id === task.id ? { ...t, is_completed: !t.is_completed } : t
        )
      );
    }
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from("daily_tasks")
      .delete()
      .eq("id", taskId);

    if (!error) {
      setTasks(tasks.filter((t) => t.id !== taskId));
    }
  };

  const handleUploadComplete = () => {
    setShowUploader(false);
  };

  // Render ---------------------------------------------------
  return (
    <>
      <div className="fixed inset-0 z-50 bg-cinematic-midnight flex flex-col animate-fade-in-opacity">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border/50">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-gold to-amber-soft flex items-center justify-center flex-shrink-0">
              <Film className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-display tracking-wide truncate">
                The Theater
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Your Mind Movie Awaits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
             {/* Episode Movie Selector */}
             <EpisodeMovieSelector
               currentSource={videoSource}
               currentEpisodeId={selectedEpisode?.id}
               onSelectMindMovie={() => {
                 setVideoSource("mind-movie");
                 setSelectedEpisode(null);
               }}
               onSelectEpisode={(episode) => {
                 if (episode.movie_url) {
                   setVideoSource("episode");
                   setSelectedEpisode({
                     id: episode.id,
                     title: episode.title,
                     movie_url: episode.movie_url,
                   });
                 }
               }}
             />
             
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r from-amber-soft/20 to-cinematic-red/20 border border-amber-soft/30">
              <Flame
                className={cn(
                  "w-4 h-4 sm:w-5 sm:h-5 text-amber-soft",
                  streak > 0 && "streak-fire"
                )}
              />
              <span className="font-display text-lg sm:text-xl text-foreground">
                {streak}
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">
                Day Streak
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={closeTheater}
              className="h-12 w-12 sm:h-14 sm:w-14 bg-gold/20 hover:bg-gold/30 border border-gold/40 rounded-full ml-2"
            >
              <X className="w-6 h-6 sm:w-7 sm:h-7 text-gold" />
            </Button>
          </div>
        </div>

        {/* Floating close button for mobile - positioned lower for easy thumb access */}
        <Button
          variant="default"
          size="lg"
          onClick={closeTheater}
          className="fixed bottom-24 right-4 z-50 h-14 w-14 rounded-full bg-gold/90 hover:bg-gold text-black shadow-lg shadow-gold/30 sm:hidden"
        >
          <X className="w-7 h-7" />
        </Button>

        {/* Video Player Area */}
        <div
          className="flex-1 flex items-center justify-center p-2 sm:p-4 md:p-8 relative overflow-visible"
        >
          <div
            className="theater-player w-full h-full sm:h-auto sm:max-w-5xl sm:aspect-video bg-card border border-border relative"
          >
            {playbackSrc ? (
              <>
                <MindMoviePlayer
                  ref={playerRef}
                  src={playbackSrc}
                  disableSeeking
                  restartOnInterrupt
                  onComplete={handleVideoComplete}
                  onError={handleVideoError}
                  className="w-full h-full"
                />

                {hasRecordedViewing && (
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg bg-green-500/20 border border-green-500/30 z-10">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                    <span className="text-xs sm:text-sm text-green-400">
                      Recorded
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-cinematic-charcoal to-cinematic-midnight flex items-center justify-center p-4">
                <div className="text-center">
                  <Film className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4 opacity-50" />
                  <p className="text-muted-foreground text-sm sm:text-base mb-1 sm:mb-2">
                    No Mind Movie Yet
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground/70 mb-4 sm:mb-6">
                    Create with AI or upload your own
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                    <Button
                      variant="gold"
                      onClick={() => setShowMediaStudio(true)}
                      className="text-sm"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create with AI
                    </Button>
                    <Button
                      variant="cinematic"
                      onClick={() => setShowUploader(true)}
                      className="text-sm"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Video
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Three Things Panel */}
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
                      <span className="text-xs sm:text-sm font-bold text-gold w-5 sm:w-6">
                        #{index + 1}
                      </span>
                      <Checkbox
                        checked={task.is_completed}
                        onCheckedChange={() => toggleTask(task)}
                      />
                      <span
                        className={`flex-1 text-sm sm:text-base ${
                          task.is_completed
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
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

              {tasks.length < 3 && (
                <div className="flex gap-2 mb-4 sm:mb-6">
                  <Input
                    placeholder={`Add priority #${tasks.length + 1}...`}
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTask()}
                    className="bg-background/50 text-sm"
                  />
                  <Button
                    onClick={addTask}
                    disabled={!newTaskText.trim()}
                    variant="gold"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
                {[1, 2, 3].map((num) => (
                  <div
                    key={num}
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-colors ${
                      tasks.length >= num ? "bg-gold" : "bg-muted"
                    }`}
                  />
                ))}
                <span className="text-xs sm:text-sm text-muted-foreground ml-2">
                  {tasks.length}/3 set
                </span>
              </div>

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
                  onClick={closeTheater}
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

        {/* Bottom Actions */}
        <div className="p-3 sm:p-6 border-t border-border/50">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-muted-foreground text-xs sm:text-sm text-center sm:text-left hidden sm:block">
              Watch your Mind Movie daily to reinforce your new identity
            </p>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMediaStudio(true)}
                className="text-xs sm:text-sm"
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Create with AI</span>
                <span className="sm:hidden">AI</span>
              </Button>
              <Button
                variant="cinematic"
                size="sm"
                onClick={() => setShowUploader(true)}
                className="text-xs sm:text-sm"
              >
                <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">
                  {videoUrl ? "Replace Video" : "Upload Video"}
                </span>
                <span className="sm:hidden">Upload</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showUploader && (
        <VideoUploader
          currentVideoUrl={videoUrl || null}
          onUploadComplete={handleUploadComplete}
          onClose={() => setShowUploader(false)}
        />
      )}

      <MediaStudio open={showMediaStudio} onOpenChange={setShowMediaStudio} />
    </>
  );
};
