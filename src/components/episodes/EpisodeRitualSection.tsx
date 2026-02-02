import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Film, ScrollText, Rocket, Check, Play, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Episode } from "@/hooks/useEpisodes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface EpisodeRitualSectionProps {
  episode: Episode;
  onWatchMovie?: () => void;
  onViewActions?: () => void;
}

interface EpisodeRitualState {
  watched_movie: boolean;
  read_mission: boolean;
  reviewed_actions: boolean;
}

export function EpisodeRitualSection({ episode, onWatchMovie, onViewActions }: EpisodeRitualSectionProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ritualState, setRitualState] = useState<EpisodeRitualState>({
    watched_movie: false,
    read_mission: false,
    reviewed_actions: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // For now, store in localStorage per episode/date
  // Could be moved to a database table for persistence
  useEffect(() => {
    if (!user || !episode) return;

    const today = format(new Date(), "yyyy-MM-dd");
    const key = `episode_ritual_${episode.id}_${today}`;
    const saved = localStorage.getItem(key);

    if (saved) {
      try {
        setRitualState(JSON.parse(saved));
      } catch {
        // Ignore parse errors
      }
    }
    setIsLoading(false);
  }, [user, episode]);

  const saveRitualState = (newState: EpisodeRitualState) => {
    if (!episode) return;

    const today = format(new Date(), "yyyy-MM-dd");
    const key = `episode_ritual_${episode.id}_${today}`;
    localStorage.setItem(key, JSON.stringify(newState));
    setRitualState(newState);
  };

  const toggleRitual = (field: keyof EpisodeRitualState) => {
    const newState = {
      ...ritualState,
      [field]: !ritualState[field],
    };
    saveRitualState(newState);
  };

  const handleWatchMovie = () => {
    toggleRitual("watched_movie");
    if (onWatchMovie) {
      onWatchMovie();
    }
  };

  const handleReadMission = () => {
    toggleRitual("read_mission");
    // Could open a modal or scroll to mission statement
  };

  const handleReviewActions = () => {
    toggleRitual("reviewed_actions");
    if (onViewActions) {
      onViewActions();
    } else {
      navigate("/actions");
    }
  };

  const completedCount = Object.values(ritualState).filter(Boolean).length;
  const totalRituals = 3;
  const progress = (completedCount / totalRituals) * 100;

  const ritualItems = [
    {
      id: "watched_movie",
      title: "Watch Episode Movie",
      subtitle: episode.mind_movie_script_id 
        ? "Visualize your episode success"
        : "No movie uploaded yet",
      icon: <Film className="w-5 h-5" />,
      completed: ritualState.watched_movie,
      color: "#D4AF37",
      disabled: !episode.mind_movie_script_id,
      onClick: handleWatchMovie,
    },
    {
      id: "read_mission",
      title: "Read Mission Statement",
      subtitle: episode.objective?.slice(0, 50) + (episode.objective?.length > 50 ? "..." : "") || "Episode objective",
      icon: <ScrollText className="w-5 h-5" />,
      completed: ritualState.read_mission,
      color: "#22D3EE",
      onClick: handleReadMission,
    },
    {
      id: "reviewed_actions",
      title: "Episode Actions",
      subtitle: "Complete your three things for this episode",
      icon: <Rocket className="w-5 h-5" />,
      completed: ritualState.reviewed_actions,
      color: "#F59E0B",
      onClick: handleReviewActions,
    },
  ];

  if (isLoading) {
    return (
      <div className="glass-card p-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-muted rounded" />
          <div className="h-16 bg-muted rounded" />
          <div className="h-16 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 sm:p-5 space-y-4 border border-amber-500/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/30 to-orange-600/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-display text-lg tracking-wide">Episode Ritual</h3>
            <p className="text-xs text-muted-foreground">Daily focus for "{episode.title}"</p>
          </div>
        </div>
        <span className="text-sm text-muted-foreground bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          {completedCount}/{totalRituals}
        </span>
      </div>

      {/* Progress */}
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all duration-500 rounded-full"
          style={{ 
            width: `${progress}%`,
            boxShadow: progress > 0 ? '0 0 10px rgba(245, 158, 11, 0.5)' : undefined,
          }}
        />
      </div>

      {/* Ritual Items */}
      <div className="space-y-3">
        {ritualItems.map((ritual) => (
          <button
            key={ritual.id}
            onClick={ritual.onClick}
            disabled={ritual.disabled}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 text-left border",
              ritual.completed
                ? "bg-gradient-to-br from-amber-500/15 to-transparent border-amber-500/40"
                : ritual.disabled
                  ? "bg-muted/30 border-border/30 opacity-50 cursor-not-allowed"
                  : "bg-card/50 border-border/40 hover:border-amber-500/40 hover:bg-amber-500/5"
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all",
                ritual.completed
                  ? "bg-amber-500/20"
                  : "bg-muted"
              )}
              style={{ color: ritual.completed ? ritual.color : undefined }}
            >
              {ritual.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-medium text-sm",
                ritual.completed && "text-amber-400"
              )}>
                {ritual.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {ritual.subtitle}
              </p>
            </div>

            {/* Status */}
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all",
              ritual.completed
                ? "bg-amber-500 text-black"
                : "border-2 border-border"
            )}>
              {ritual.completed && <Check className="w-4 h-4" />}
            </div>
          </button>
        ))}
      </div>

      {/* All Complete Message */}
      {completedCount === totalRituals && (
        <div className="flex items-center justify-center gap-2 text-amber-400 text-sm py-2">
          <Sparkles className="w-4 h-4" />
          <span>Episode ritual complete for today!</span>
          <Sparkles className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
