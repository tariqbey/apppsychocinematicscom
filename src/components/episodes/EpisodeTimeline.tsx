import { useState, useEffect } from "react";
import { Film, Zap, CheckCircle, Pause, Clock, Play, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Episode } from "@/hooks/useEpisodes";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface EpisodeTimelineProps {
  episodes: Episode[];
}

interface MindMovieInfo {
  id: string;
  title: string | null;
  movie_url: string | null;
}

export function EpisodeTimeline({ episodes }: EpisodeTimelineProps) {
  const [movieData, setMovieData] = useState<Record<string, MindMovieInfo>>({});
  const [previewMovie, setPreviewMovie] = useState<MindMovieInfo | null>(null);

  // Fetch movie data for episodes with mind_movie_script_id
  useEffect(() => {
    const fetchMovieData = async () => {
      const movieIds = episodes
        .filter(ep => ep.mind_movie_script_id)
        .map(ep => ep.mind_movie_script_id as string);
      
      if (movieIds.length === 0) return;

      const { data } = await supabase
        .from("mind_movie_scripts")
        .select("id, title, movie_url")
        .in("id", movieIds);

      if (data) {
        const movieMap: Record<string, MindMovieInfo> = {};
        data.forEach(m => {
          movieMap[m.id] = m as MindMovieInfo;
        });
        setMovieData(movieMap);
      }
    };

    fetchMovieData();
  }, [episodes]);

  // Sort episodes by creation date for timeline
  const sortedEpisodes = [...episodes].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const getStatusIcon = (status: Episode["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "active":
        return <Zap className="w-4 h-4 text-amber-500" />;
      case "paused":
        return <Pause className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: Episode["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "active":
        return "bg-amber-500";
      case "paused":
        return "bg-muted-foreground";
      default:
        return "bg-red-500/50";
    }
  };

  if (sortedEpisodes.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Episodes Yet</h3>
        <p className="text-sm text-muted-foreground">
          Your transformation timeline will appear here as you create episodes.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
          <Clock className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="font-display text-lg tracking-wide">Transformation Timeline</h3>
          <p className="text-sm text-muted-foreground">Your story arc visualized</p>
        </div>
      </div>

      <ScrollArea className="w-full pb-4">
        <div className="relative flex items-start gap-0 min-w-max py-4">
          {/* Timeline line */}
          <div className="absolute top-[2.75rem] left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/50 via-gold/30 to-purple-500/50" />

          {sortedEpisodes.map((episode, index) => {
            const movie = episode.mind_movie_script_id 
              ? movieData[episode.mind_movie_script_id] 
              : null;
            const hasMovie = !!movie?.movie_url;

            return (
              <div
                key={episode.id}
                className="relative flex flex-col items-center min-w-[180px] px-2"
              >
                {/* Node */}
                <div
                  className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                    episode.status === "completed"
                      ? "border-green-500 bg-green-500/20"
                      : episode.status === "active"
                        ? "border-amber-500 bg-amber-500/20 animate-pulse"
                        : "border-muted bg-muted/50"
                  }`}
                >
                  {hasMovie ? (
                    <Film className="w-5 h-5 text-gold" />
                  ) : (
                    getStatusIcon(episode.status)
                  )}
                </div>

                {/* Connecting line indicator */}
                {episode.status === "completed" && index < sortedEpisodes.length - 1 && (
                  <div className="absolute top-[2.75rem] left-1/2 w-full h-0.5 bg-green-500/50" />
                )}

                {/* Episode Card */}
                <div className="mt-3 w-full max-w-[160px]">
                  <div className="glass-card p-3 text-center border border-border/50 hover:border-gold/30 transition-colors">
                    <p className="text-xs text-muted-foreground mb-1">
                      {format(new Date(episode.created_at), "MMM d")}
                    </p>
                    <h4 className="font-medium text-sm truncate mb-1">{episode.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {episode.objective}
                    </p>

                    {/* Status Badge */}
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                      episode.status === "completed"
                        ? "bg-green-500/20 text-green-400"
                        : episode.status === "active"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-muted text-muted-foreground"
                    }`}>
                      {getStatusIcon(episode.status)}
                      <span className="capitalize">{episode.status}</span>
                    </div>

                    {/* Movie Preview Button */}
                    {hasMovie && movie && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2 text-xs text-gold hover:bg-gold/10"
                        onClick={() => setPreviewMovie(movie)}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Watch Movie
                      </Button>
                    )}

                    {episode.mind_movie_script_id && !hasMovie && (
                      <div className="mt-2 text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Film className="w-3 h-3" />
                        Movie in progress
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Movie Preview Dialog */}
      <Dialog open={!!previewMovie} onOpenChange={() => setPreviewMovie(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black overflow-hidden">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
              onClick={() => setPreviewMovie(null)}
            >
              <X className="w-5 h-5" />
            </Button>
            {previewMovie?.movie_url && (
              <video
                src={previewMovie.movie_url}
                controls
                autoPlay
                className="w-full aspect-video"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
