import { useState, useEffect } from "react";
import { Film, Play, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MindMoviePlayer } from "@/components/theater/MindMoviePlayer";
import { supabase } from "@/integrations/supabase/client";

interface EpisodeMoviePreviewProps {
  scriptId: string;
  variant?: "badge" | "button";
}

interface MindMovieData {
  id: string;
  title: string | null;
  movie_url: string | null;
  status: string | null;
}

export function EpisodeMoviePreview({ scriptId, variant = "badge" }: EpisodeMoviePreviewProps) {
  const [movieData, setMovieData] = useState<MindMovieData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovie = async () => {
      const { data } = await supabase
        .from("mind_movie_scripts")
        .select("id, title, movie_url, status")
        .eq("id", scriptId)
        .single();

      if (data) {
        setMovieData(data as MindMovieData);
      }
      setLoading(false);
    };

    fetchMovie();
  }, [scriptId]);

  if (loading) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Film className="w-3 h-3 animate-pulse" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!movieData) return null;

  const hasVideo = !!movieData.movie_url;
  const isProcessing = movieData.status === "processing" || movieData.status === "generating";

  if (variant === "badge") {
    return (
      <>
        <button
          onClick={() => hasVideo && setShowPreview(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all ${
            hasVideo
              ? "bg-gold/20 text-gold hover:bg-gold/30 cursor-pointer"
              : isProcessing
                ? "bg-amber-500/20 text-amber-400"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {hasVideo ? (
            <>
              <Play className="w-3 h-3" />
              <span>Watch Movie</span>
            </>
          ) : isProcessing ? (
            <>
              <Film className="w-3 h-3 animate-pulse" />
              <span>Creating...</span>
            </>
          ) : (
            <>
              <Film className="w-3 h-3" />
              <span>Movie Draft</span>
            </>
          )}
        </button>

        <MoviePreviewDialog
          open={showPreview}
          onClose={() => setShowPreview(false)}
          movie={movieData}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 border-gold/30 text-gold hover:bg-gold/10"
        onClick={() => hasVideo && setShowPreview(true)}
        disabled={!hasVideo}
      >
        {hasVideo ? (
          <>
            <Eye className="w-4 h-4" />
            Preview Movie
          </>
        ) : isProcessing ? (
          <>
            <Film className="w-4 h-4 animate-pulse" />
            Creating...
          </>
        ) : (
          <>
            <Film className="w-4 h-4" />
            No Video Yet
          </>
        )}
      </Button>

      <MoviePreviewDialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        movie={movieData}
      />
    </>
  );
}

interface MoviePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  movie: MindMovieData | null;
}

function MoviePreviewDialog({ open, onClose, movie }: MoviePreviewDialogProps) {
  const videoUrl = movie?.movie_url;

  if (!videoUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 bg-black/95 border-gold/20 overflow-hidden">
        <DialogHeader className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-gold" />
              {movie?.title || "Episode Movie"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="pt-14 aspect-video">
          <MindMoviePlayer
            src={videoUrl}
            disableSeeking={false}
            restartOnInterrupt={false}
            className="w-full h-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
