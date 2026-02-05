import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Zap, Calendar, Target, Film, Upload, Play, 
  CheckCircle, Pause, Trash2, AlertCircle, Sparkles, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Episode, useEpisodes } from "@/hooks/useEpisodes";
import { EpisodeRitualSection } from "./EpisodeRitualSection";
import { EpisodeMovieUpload } from "./EpisodeMovieUpload";
import { EpisodeMoviePreview } from "./EpisodeMoviePreview";
import { EpisodeTaskSuggestions } from "./EpisodeTaskSuggestions";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface EpisodeDetailViewProps {
  episode: Episode;
  onBack: () => void;
  onComplete: () => void;
  onPause: () => void;
  onResume: () => void;
  onDelete: () => void;
  onCreateMindMovie?: () => void;
}

export function EpisodeDetailView({
  episode,
  onBack,
  onComplete,
  onPause,
  onResume,
  onDelete,
  onCreateMindMovie,
}: EpisodeDetailViewProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getDaysRemaining, getProgress, fetchEpisodes } = useEpisodes();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [movieUrl, setMovieUrl] = useState<string | null>(null);
  const [sendingTelegram, setSendingTelegram] = useState(false);

  const daysRemaining = getDaysRemaining(episode.deadline);
  const progress = getProgress(episode);
  const isOverdue = daysRemaining < 0 && episode.status === "active";

  // Fetch movie URL if episode has a linked script
  useEffect(() => {
    const fetchMovieUrl = async () => {
      if (!episode.mind_movie_script_id) return;

      const { data } = await supabase
        .from("mind_movie_scripts")
        .select("movie_url")
        .eq("id", episode.mind_movie_script_id)
        .single();

      if (data?.movie_url) {
        setMovieUrl(data.movie_url);
      }
    };

    fetchMovieUrl();
  }, [episode.mind_movie_script_id]);

  const handleMovieUploadSuccess = async (url: string) => {
    setMovieUrl(url);
    await fetchEpisodes();
  };

  const handleWatchMovie = () => {
    if (movieUrl) {
      // Open movie in theater view or a modal
      navigate(`/?movie=${encodeURIComponent(movieUrl)}`);
    }
  };

  const handleViewActions = () => {
    navigate("/actions");
  };

  const handleSendTelegram = async () => {
    if (!user) return;
    
    setSendingTelegram(true);
    try {
      // Check if telegram is configured
      const { data: integration } = await supabase
        .from("user_integrations")
        .select("api_key")
        .eq("user_id", user.id)
        .eq("service_name", "telegram")
        .single();
      
      if (!integration?.api_key) {
        toast.error("Please configure your Telegram integration in Settings first");
        return;
      }
      
      const daysLeft = getDaysRemaining(episode.deadline);
      const message = `🎬 *Episode Update: ${episode.title}*\n\n` +
        `📋 *Objective:* ${episode.objective}\n\n` +
        `⏰ *Time Remaining:* ${daysLeft > 0 ? `${daysLeft} days left` : `${Math.abs(daysLeft)} days overdue`}\n\n` +
        `🔥 Stay focused and make it happen, Director!`;
      
      const { data, error } = await supabase.functions.invoke("telegram-proactive", {
        body: {
          userId: user.id,
          messageType: "episode_reminder",
          customMessage: message,
        },
      });
      
      if (error) throw error;

      if (!data?.success) {
        toast.error(data?.error || "Failed to send Telegram message");
        return;
      }

      toast.success("Episode reminder sent to Telegram!");
    } catch (error) {
      console.error("Telegram send error:", error);
      toast.error("Failed to send Telegram message");
    } finally {
      setSendingTelegram(false);
    }
  };

  return (
    <div className="space-y-6 relative pb-20 sm:pb-6">
      {/* Header */}
      <div className="flex items-start gap-3 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0 mt-1 hidden sm:flex"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {episode.status === "active" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                Active
              </span>
            )}
            {episode.status === "completed" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                Completed
              </span>
            )}
            {episode.status === "paused" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                Paused
              </span>
            )}
            {episode.alignment_score && (
              <span className={`text-xs ${
                episode.alignment_score >= 70 ? "text-green-400" :
                episode.alignment_score >= 50 ? "text-amber-400" :
                "text-orange-400"
              }`}>
                {episode.alignment_score}% aligned
              </span>
            )}
          </div>
          
          <h1 className="text-2xl font-display tracking-wide mb-2">{episode.title}</h1>
          
          <p className="text-muted-foreground">{episode.objective}</p>
        </div>
      </div>

      {/* Progress Card */}
      {(episode.status === "active" || episode.status === "paused") && (
        <div className="glass-card p-4 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Deadline: {format(new Date(episode.deadline), "MMM d, yyyy")}
              </span>
            </div>
            <span className={`text-sm font-medium ${isOverdue ? "text-red-400" : ""}`}>
              {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`}
            </span>
          </div>
          
          <Progress 
            value={progress} 
            className={`h-2 ${isOverdue ? "[&>div]:bg-red-500" : ""}`}
          />
          
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {Math.round(progress)}% of time elapsed
          </p>
        </div>
      )}

      {/* Episode Movie Section */}
      <div className="glass-card p-4 border border-amber-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
              <Film className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-medium">Episode Movie</h3>
              <p className="text-xs text-muted-foreground">
                {movieUrl ? "Your visualization for this episode" : "No movie attached yet"}
              </p>
            </div>
          </div>
        </div>

        {movieUrl ? (
          <div className="space-y-3">
            {/* Movie Preview */}
            <div className="aspect-video rounded-lg overflow-hidden bg-black/50 relative group cursor-pointer" onClick={handleWatchMovie}>
              <video
                src={movieUrl}
                className="w-full h-full object-cover"
                muted
                playsInline
                poster={movieUrl.replace('.mp4', '_thumb.jpg')}
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-500/90 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                  <Play className="w-7 h-7 sm:w-8 sm:h-8 text-black ml-1" />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleWatchMovie}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Play Movie
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUploadModal(true)}
              >
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => setShowUploadModal(true)}
              variant="outline"
              className="w-full border-dashed border-2 h-24 flex flex-col gap-2"
            >
              <Upload className="w-6 h-6 text-amber-500" />
              <span>Upload Existing Movie</span>
            </Button>
            
            {onCreateMindMovie && (
              <Button
                onClick={onCreateMindMovie}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Create New Episode Movie
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Episode Ritual Section */}
      <EpisodeRitualSection
        episode={episode}
        onWatchMovie={handleWatchMovie}
        onViewActions={handleViewActions}
      />

      {/* AI Task Suggestions */}
      <EpisodeTaskSuggestions episode={episode} />

      {/* Actions */}
      {episode.status !== "abandoned" && episode.status !== "completed" && (
        <div className="glass-card p-4 border border-border">
          <h3 className="font-medium mb-3">Episode Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={onComplete}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Episode
            </Button>
            
            <Button
              variant="outline"
              onClick={episode.status === "paused" ? onResume : onPause}
            >
              {episode.status === "paused" ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              )}
            </Button>

            {/* Telegram Reminder Button */}
            <Button
              variant="outline"
              onClick={handleSendTelegram}
              disabled={sendingTelegram}
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              <Send className="w-4 h-4 mr-2" />
              {sendingTelegram ? "Sending..." : "Send to Telegram"}
            </Button>
            
            <Button
              variant="ghost"
              onClick={onDelete}
              className="text-red-400 hover:text-red-400 hover:bg-red-500/10 ml-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <EpisodeMovieUpload
        episodeId={episode.id}
        episodeTitle={episode.title}
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleMovieUploadSuccess}
      />

      {/* Floating back button for mobile - easy thumb access */}
      <Button
        variant="default"
        size="lg"
        onClick={onBack}
        className="fixed bottom-6 left-4 z-50 h-14 w-14 rounded-full bg-gold/90 hover:bg-gold text-black shadow-lg shadow-gold/30 sm:hidden"
      >
        <ArrowLeft className="w-7 h-7" />
      </Button>
    </div>
  );
}
