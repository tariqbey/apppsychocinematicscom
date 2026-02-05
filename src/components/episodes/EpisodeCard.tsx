import { useState } from "react";
import { Zap, Calendar, CheckCircle, Pause, Play, Trash2, ChevronDown, ChevronUp, Film, Pencil, Upload, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useEpisodes, Episode } from "@/hooks/useEpisodes";
import { EpisodeMoviePreview } from "./EpisodeMoviePreview";
import { EpisodeMovieUpload } from "./EpisodeMovieUpload";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface EpisodeCardProps {
  episode: Episode;
  variant?: "compact" | "full";
  onCreateMindMovie?: (episode: Episode) => void;
  onEditMindMovie?: (episode: Episode) => void;
  onUploadMovie?: (episode: Episode) => void;
  onDelete?: (episodeId: string) => Promise<boolean>;
  onComplete?: (episodeId: string) => Promise<boolean>;
  onPause?: (episodeId: string) => Promise<boolean>;
  onResume?: (episodeId: string) => Promise<boolean>;
  onClick?: () => void;
}

export function EpisodeCard({ 
  episode, 
  variant = "compact", 
  onCreateMindMovie,
  onEditMindMovie,
  onUploadMovie,
  onDelete,
  onComplete,
  onPause,
  onResume,
  onClick
}: EpisodeCardProps) {
  const { user } = useAuth();
  const { completeEpisode, pauseEpisode, resumeEpisode, deleteEpisode, getDaysRemaining, getProgress, fetchEpisodes } = useEpisodes();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [sendingTelegram, setSendingTelegram] = useState(false);
  const daysRemaining = getDaysRemaining(episode.deadline);
  const progress = getProgress(episode);
  const isOverdue = daysRemaining < 0 && episode.status === "active";

  const getStatusBadge = () => {
    switch (episode.status) {
      case "active":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">Active</span>;
      case "completed":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">Completed</span>;
      case "paused":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Paused</span>;
      case "abandoned":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Abandoned</span>;
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    if (onComplete) {
      await onComplete(episode.id);
    } else {
      await completeEpisode(episode.id);
    }
    setLoading(false);
  };

  const handlePauseResume = async () => {
    setLoading(true);
    if (episode.status === "paused") {
      if (onResume) {
        await onResume(episode.id);
      } else {
        await resumeEpisode(episode.id);
      }
    } else {
      if (onPause) {
        await onPause(episode.id);
      } else {
        await pauseEpisode(episode.id);
      }
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this episode?")) {
      setLoading(true);
      if (onDelete) {
        await onDelete(episode.id);
      } else {
        await deleteEpisode(episode.id);
      }
      setLoading(false);
    }
  };

  const handleSendTelegram = async () => {
    if (!user) return;
    
    setSendingTelegram(true);
    try {
      // Get user's telegram settings from user_integrations
      const { data: integration } = await supabase
        .from("user_integrations")
        .select("api_key, settings")
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

  const handleUploadSuccess = async () => {
    await fetchEpisodes();
    setShowUploadModal(false);
    toast.success("Movie uploaded successfully!");
  };

  return (
    <div 
      className={`glass-card p-4 border transition-all ${
        episode.status === "active" ? "border-amber-500/30" : "border-border"
      } ${onClick ? "cursor-pointer hover:border-amber-500/50" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          episode.status === "completed" 
            ? "bg-green-500/20" 
            : episode.status === "active"
              ? "bg-gradient-to-br from-amber-500/20 to-orange-600/20"
              : "bg-muted"
        }`}>
          {episode.status === "completed" ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <Zap className={`w-5 h-5 ${episode.status === "active" ? "text-amber-500" : "text-muted-foreground"}`} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getStatusBadge()}
            {episode.alignment_score && (
              <span className={`text-xs ${
                episode.alignment_score >= 70 ? "text-green-400" :
                episode.alignment_score >= 50 ? "text-gold" :
                "text-amber-500"
              }`}>
                {episode.alignment_score}%
              </span>
            )}
            {/* Movie indicator shown inline */}
            {episode.mind_movie_script_id && (
              <EpisodeMoviePreview scriptId={episode.mind_movie_script_id} variant="badge" />
            )}
          </div>

          <h4 className="font-medium truncate">{episode.title}</h4>
          
          <p className={`text-sm text-muted-foreground ${expanded ? "" : "line-clamp-1"}`}>
            {episode.objective}
          </p>

          {/* Progress (for active/paused) */}
          {(episode.status === "active" || episode.status === "paused") && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Time elapsed</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span className={isOverdue ? "text-red-400" : ""}>
                    {format(new Date(episode.deadline), "MMM d")}
                  </span>
                </div>
              </div>
              <Progress 
                value={progress} 
                className={`h-1.5 ${isOverdue ? "[&>div]:bg-red-500" : ""}`}
              />
            </div>
          )}

          {/* Completed date */}
          {episode.status === "completed" && episode.completed_at && (
            <p className="text-xs text-muted-foreground mt-1">
              Completed {format(new Date(episode.completed_at), "MMM d, yyyy")}
            </p>
          )}

          {/* Expanded content */}
          {expanded && (
            <div className="mt-3 pt-3 border-t border-border space-y-2">
              {episode.alignment_reasoning && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Alignment Analysis:</p>
                  <p className="text-sm">{episode.alignment_reasoning}</p>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Created: {format(new Date(episode.created_at), "MMM d, yyyy")}</span>
                <span>•</span>
                <span>Duration: {episode.duration_type.replace("-", " ")}</span>
              </div>
            </div>
          )}
        </div>

        {/* Toggle expand */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Actions (when expanded) */}
       {expanded && (
        <div 
          className="flex items-center gap-2 mt-4 pt-3 border-t border-border flex-wrap"
          onClick={(e) => e.stopPropagation()}
        >
           {episode.status === "active" && (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleComplete}
              disabled={loading}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Complete
            </Button>
          )}
          
          {/* Create Mind Movie Button */}
          {onCreateMindMovie && !episode.mind_movie_script_id && episode.status !== "completed" && (
            <Button
              size="sm"
              variant="outline"
              className="border-gold/30 text-gold hover:bg-gold/10"
              onClick={() => onCreateMindMovie(episode)}
            >
              <Film className="w-4 h-4 mr-1" />
              Create Movie
            </Button>
          )}
          
          {/* Upload Movie Button */}
          {!episode.mind_movie_script_id && episode.status !== "completed" && (
            <Button
              size="sm"
              variant="outline"
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              onClick={() => setShowUploadModal(true)}
            >
              <Upload className="w-4 h-4 mr-1" />
              Upload Movie
            </Button>
          )}
          
          {/* Edit Mind Movie Button for Episodes with existing Movies */}
          {onEditMindMovie && episode.mind_movie_script_id && episode.status !== "completed" && (
            <Button
              size="sm"
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => onEditMindMovie(episode)}
            >
              <Pencil className="w-4 h-4 mr-1" />
              Edit Movie
            </Button>
          )}

          {/* Send Telegram Reminder */}
          {episode.status === "active" && (
            <Button
              size="sm"
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              onClick={handleSendTelegram}
              disabled={sendingTelegram}
            >
              <Send className="w-4 h-4 mr-1" />
              {sendingTelegram ? "Sending..." : "Telegram"}
            </Button>
          )}
          
          {/* Quick Preview Button for Episodes with Movies */}
          {episode.mind_movie_script_id && (
            <EpisodeMoviePreview scriptId={episode.mind_movie_script_id} variant="button" />
          )}

           {episode.status !== "completed" && episode.status !== "abandoned" && (
            <Button
              size="sm"
              variant="outline"
              onClick={handlePauseResume}
              disabled={loading}
            >
              {episode.status === "paused" ? (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </>
              )}
            </Button>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            className="text-red-400 hover:text-red-400 hover:bg-red-500/10 ml-auto"
            onClick={handleDelete}
             disabled={loading}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Upload Movie Modal */}
      <EpisodeMovieUpload
        episodeId={episode.id}
        episodeTitle={episode.title}
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
