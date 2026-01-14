import { useState, useEffect } from "react";
import { Film, Plus, Play, Star, Trash2, Copy, Edit3, Check, Loader2, X, Clapperboard, Eye, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMindMovies, MindMovie } from "@/hooks/useMindMovies";
import { useStorageUsage } from "@/hooks/useStorageUsage";
import { MoviePreviewModal } from "./MoviePreviewModal";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface MovieVaultProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMovie: (movie: MindMovie) => void;
  onCreateNew: () => void;
}

export function MovieVault({ isOpen, onClose, onSelectMovie, onCreateNew }: MovieVaultProps) {
  const { movies, isLoading, fetchAllMovies, setMovieAsActive, deleteMovie, duplicateMovie } =
    useMindMovies();
  const { usage, isLoading: isLoadingUsage, calculateUsage, formatUsage, STORAGE_LIMIT_GB } = useStorageUsage();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingActiveId, setSettingActiveId] = useState<string | null>(null);
  const [previewMovie, setPreviewMovie] = useState<MindMovie | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAllMovies();
      calculateUsage();
    }
  }, [isOpen, fetchAllMovies, calculateUsage]);

  const handleSetActive = async (movieId: string) => {
    setSettingActiveId(movieId);
    await setMovieAsActive(movieId);
    setSettingActiveId(null);
  };

  const handleDelete = async (movieId: string) => {
    setDeletingId(movieId);
    await deleteMovie(movieId);
    setDeletingId(null);
    // Recalculate storage after delete
    calculateUsage();
  };

  const handlePreview = (movie: MindMovie) => {
    if (movie.movie_url) {
      setPreviewMovie(movie);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-amber-soft flex items-center justify-center">
            <Clapperboard className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-display tracking-wide">Mind Movie Vault</h2>
            <p className="text-sm text-muted-foreground">
              {movies.length} movie{movies.length !== 1 ? "s" : ""} • Manage your collection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Storage Usage Indicator */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/50 border border-border">
            <HardDrive className="w-4 h-4 text-muted-foreground" />
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-muted-foreground">Storage</span>
                <span className="text-xs font-medium">
                  {isLoadingUsage ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : usage ? (
                    `${formatUsage(usage.totalBytes)} / ${STORAGE_LIMIT_GB} GB`
                  ) : (
                    "Calculating..."
                  )}
                </span>
              </div>
              <Progress 
                value={usage?.percentUsed || 0} 
                className="h-1.5 w-32"
              />
            </div>
          </div>

          <Button variant="gold" onClick={onCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Start New Movie
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Film className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Mind Movies Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create your first Mind Movie to visualize your goals and manifest your dreams.
            </p>
            <Button variant="gold" onClick={onCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Movie
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                isDeleting={deletingId === movie.id}
                isSettingActive={settingActiveId === movie.id}
                onSelect={() => onSelectMovie(movie)}
                onSetActive={() => handleSetActive(movie.id)}
                onDelete={() => handleDelete(movie.id)}
                onDuplicate={() => duplicateMovie(movie.id)}
                onPreview={() => handlePreview(movie)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Preview Modal */}
      <MoviePreviewModal
        open={!!previewMovie}
        onOpenChange={(open) => !open && setPreviewMovie(null)}
        movieUrl={previewMovie?.movie_url || null}
        movieTitle={previewMovie?.title || "Mind Movie Preview"}
      />
    </div>
  );
}

interface MovieCardProps {
  movie: MindMovie;
  isDeleting: boolean;
  isSettingActive: boolean;
  onSelect: () => void;
  onSetActive: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onPreview: () => void;
}

function MovieCard({
  movie,
  isDeleting,
  isSettingActive,
  onSelect,
  onSetActive,
  onDelete,
  onDuplicate,
  onPreview,
}: MovieCardProps) {
  const hasVideo = !!movie.movie_url;
  const hasScenes = movie.scenes && movie.scenes.length > 0;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all hover:border-gold/50",
        movie.is_active && "border-gold ring-1 ring-gold/30"
      )}
    >
      {/* Thumbnail / Preview */}
      <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 relative">
        {hasVideo ? (
          <video
            src={movie.movie_url!}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
          />
        ) : movie.scenes?.[0]?.generatedImageUrl ? (
          <img
            src={movie.scenes[0].generatedImageUrl}
            alt="Movie thumbnail"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Film className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Active badge */}
        {movie.is_active && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md bg-gold/90 text-primary-foreground text-xs font-medium">
            <Star className="w-3 h-3 fill-current" />
            Active
          </div>
        )}

        {/* Status badge */}
        <Badge
          variant={movie.status === "complete" ? "default" : "secondary"}
          className="absolute top-2 right-2"
        >
          {movie.status === "complete" ? "Complete" : "Draft"}
        </Badge>

        {/* Play/Preview overlay */}
        {hasVideo && (
          <button
            onClick={onPreview}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div className="w-14 h-14 rounded-full bg-gold/90 flex items-center justify-center">
              <Play className="w-6 h-6 text-primary-foreground ml-1" />
            </div>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium truncate mb-1">{movie.title || "Untitled Movie"}</h3>
        <p className="text-xs text-muted-foreground mb-3">
          {hasScenes ? `${movie.scenes.length} scenes` : "No scenes"} •{" "}
          {format(new Date(movie.updated_at || movie.created_at), "MMM d, yyyy")}
        </p>

        {/* Chief Aim Preview */}
        {movie.chief_aim_snapshot?.what && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 italic">
            "{movie.chief_aim_snapshot.what}"
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onSelect}>
            <Edit3 className="w-3 h-3 mr-1" />
            Edit
          </Button>

          {hasVideo && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onPreview}
              title="Preview movie"
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}

          {!movie.is_active && hasVideo && (
            <Button
              variant="gold"
              size="sm"
              onClick={onSetActive}
              disabled={isSettingActive}
              className="flex-1"
            >
              {isSettingActive ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Set Active
                </>
              )}
            </Button>
          )}

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDuplicate}>
            <Copy className="w-3 h-3" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Mind Movie?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{movie.title || "Untitled Movie"}" and all its
                  scenes. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
}
