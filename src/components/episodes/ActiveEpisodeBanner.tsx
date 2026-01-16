import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Calendar, CheckCircle, MoreVertical, Pause, X, ChevronRight, Film, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEpisodes, Episode } from "@/hooks/useEpisodes";
import { format } from "date-fns";

interface ActiveEpisodeBannerProps {
  episode?: Episode;
  onCreateMindMovie?: () => void;
  onContinueProduction?: () => void;
  /** If true, clicking the banner navigates to /episodes */
  clickToNavigate?: boolean;
}

export function ActiveEpisodeBanner({ 
  episode: providedEpisode, 
  onCreateMindMovie, 
  onContinueProduction,
  clickToNavigate = false 
}: ActiveEpisodeBannerProps) {
  const navigate = useNavigate();
  const { activeEpisode, completeEpisode, pauseEpisode, abandonEpisode, getDaysRemaining, getProgress } = useEpisodes();
  const [loading, setLoading] = useState<string | null>(null);

  // Use provided episode or fall back to active episode from hook
  const episode = providedEpisode || activeEpisode;
  
  if (!episode) return null;

  const daysRemaining = getDaysRemaining(episode.deadline);
  const progress = getProgress(episode);
  const isOverdue = daysRemaining < 0;

  const handleAction = async (action: "complete" | "pause" | "abandon") => {
    setLoading(action);
    switch (action) {
      case "complete":
        await completeEpisode(episode.id);
        break;
      case "pause":
        await pauseEpisode(episode.id);
        break;
      case "abandon":
        await abandonEpisode(episode.id);
        break;
    }
    setLoading(null);
  };

  const handleCardClick = () => {
    if (clickToNavigate) {
      navigate("/episodes");
    }
  };

  return (
    <div 
      className={`glass-card p-4 cinematic-border bg-gradient-to-r from-amber-500/5 to-orange-600/5 animate-fade-in ${
        clickToNavigate ? "cursor-pointer hover:border-amber-500/50 transition-all duration-300 group" : ""
      }`}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
          <Zap className="w-6 h-6 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-amber-500 uppercase tracking-wider">Active Episode</span>
            {episode.alignment_score && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                episode.alignment_score >= 70 ? "bg-green-500/20 text-green-400" :
                episode.alignment_score >= 50 ? "bg-gold/20 text-gold" :
                "bg-amber-500/20 text-amber-400"
              }`}>
                {episode.alignment_score}% aligned
              </span>
            )}
          </div>

          <h3 className="font-display text-lg tracking-wide truncate">
            {episode.title}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
            {episode.objective}
          </p>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className={isOverdue ? "text-red-400" : "text-muted-foreground"}>
                  {isOverdue 
                    ? `${Math.abs(daysRemaining)} days overdue`
                    : daysRemaining === 0 
                      ? "Due today"
                      : `${daysRemaining} days left`
                  }
                </span>
              </div>
            </div>
            <Progress 
              value={progress} 
              className={`h-2 ${isOverdue ? "[&>div]:bg-red-500" : "[&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-600"}`}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {clickToNavigate ? (
            <Button
              size="sm"
              variant="outline"
              className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hidden sm:flex"
              onClick={() => navigate("/episodes")}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Manage Episodes
            </Button>
          ) : onContinueProduction && (
            <Button
              size="sm"
              variant="outline"
              className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hidden sm:flex"
              onClick={onContinueProduction}
            >
              <Film className="w-4 h-4 mr-1" />
              Continue Production
            </Button>
          )}
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 hidden sm:flex"
            onClick={() => handleAction("complete")}
            disabled={loading === "complete"}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Complete
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background border-border">
              <DropdownMenuItem 
                className="sm:hidden"
                onClick={() => handleAction("complete")}
              >
                <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                Complete Episode
              </DropdownMenuItem>
              {onContinueProduction && (
                <DropdownMenuItem onClick={onContinueProduction} className="sm:hidden">
                  <Film className="w-4 h-4 mr-2 text-amber-500" />
                  Continue Production
                </DropdownMenuItem>
              )}
              {onCreateMindMovie && (
                <DropdownMenuItem onClick={onCreateMindMovie}>
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Create Episode Movie
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAction("pause")}>
                <Pause className="w-4 h-4 mr-2" />
                Pause Episode
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleAction("abandon")}
                className="text-red-400 focus:text-red-400"
              >
                <X className="w-4 h-4 mr-2" />
                Abandon Episode
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
