import { useState, useEffect, useRef } from "react";
import { Film, Plus, Play, Star, Trash2, Copy, Edit3, Check, Loader2, X, Clapperboard, Eye, HardDrive, Download, Share2, Zap, Users, Crown, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useUserProfile } from "@/hooks/useUserProfile";
import { MoviePreviewModal } from "./MoviePreviewModal";
import { ShareToCommunityDialog } from "@/components/sharing/ShareToCommunityDialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

type VaultFilter = "all" | "main" | "episode";

interface MovieVaultProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMovie: (movie: MindMovie) => void;
  onCreateNew: () => void;
}

export function MovieVault({ isOpen, onClose, onSelectMovie, onCreateNew }: MovieVaultProps) {
  const { movies, isLoading, fetchAllMovies, setMovieAsActive, deleteMovie, duplicateMovie } =
    useMindMovies();
  const { profile } = useUserProfile();
  const { usage, isLoading: isLoadingUsage, calculateUsage, formatUsage, STORAGE_LIMIT_GB } = useStorageUsage();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingActiveId, setSettingActiveId] = useState<string | null>(null);
  const [previewMovie, setPreviewMovie] = useState<MindMovie | null>(null);
  const [previewRitualMovie, setPreviewRitualMovie] = useState(false);
  const [vaultFilter, setVaultFilter] = useState<VaultFilter>("all");
  const [episodeMovieIds, setEpisodeMovieIds] = useState<Set<string>>(new Set());
  const [shareMovie, setShareMovie] = useState<MindMovie | null>(null);
  const [shareRitualMovie, setShareRitualMovie] = useState(false);
  const [isReplacingRitual, setIsReplacingRitual] = useState(false);
  const ritualFileInputRef = useRef<HTMLInputElement>(null);
  const { updateProfile, refetch: refetchProfile } = useUserProfile();

  // The main ritual movie URL from user profile
  const ritualMovieUrl = profile?.mind_movie_url;

  useEffect(() => {
    if (isOpen) {
      fetchAllMovies();
      calculateUsage();
      // Fetch episode-linked movie IDs
      const fetchEpisodeMovies = async () => {
        const { data } = await supabase
          .from("episodes")
          .select("mind_movie_script_id")
          .not("mind_movie_script_id", "is", null);
        if (data) {
          setEpisodeMovieIds(new Set(data.map(e => e.mind_movie_script_id!)));
        }
      };
      fetchEpisodeMovies();
    }
  }, [isOpen, fetchAllMovies, calculateUsage]);

  // Filter movies based on selected filter
  const filteredMovies = movies.filter(movie => {
    if (vaultFilter === "all") return true;
    const isEpisodeMovie = episodeMovieIds.has(movie.id) || movie.title?.startsWith("Episode:");
    if (vaultFilter === "episode") return isEpisodeMovie;
    if (vaultFilter === "main") return !isEpisodeMovie;
    return true;
  });

  // Check if ritual movie is the same as any script movie (to avoid duplicate display)
  const ritualMovieMatchesScript = ritualMovieUrl && movies.some(m => m.movie_url === ritualMovieUrl);
  const showRitualMovieCard = ritualMovieUrl && !ritualMovieMatchesScript && (vaultFilter === "all" || vaultFilter === "main");

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

  const handleReplaceRitualMovie = () => {
    ritualFileInputRef.current?.click();
  };

  const handleRitualFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error("Please upload a video file");
      return;
    }

    setIsReplacingRitual(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to upload");
        return;
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
      const fileName = `${user.id}/mind-movie-${Date.now()}.${fileExt}`;

      // Upload to mind-movies bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('mind-movies')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('mind-movies')
        .getPublicUrl(fileName);

      const newMovieUrl = urlData.publicUrl;

      // Update user profile with new mind_movie_url
      await updateProfile({ mind_movie_url: newMovieUrl });
      await refetchProfile();
      
      toast.success("Mind Movie replaced successfully!");
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error("Failed to upload movie. Please try again.");
    } finally {
      setIsReplacingRitual(false);
      // Reset input
      if (ritualFileInputRef.current) {
        ritualFileInputRef.current.value = '';
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col animate-fade-in">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border-b border-border gap-3">
        {/* Top row: Back button, title, close */}
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-gold to-amber-soft flex items-center justify-center shrink-0">
              <Clapperboard className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-display tracking-wide truncate">Mind Movie Vault</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {movies.length} movie{movies.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {/* Mobile: Create button in header row */}
          <Button variant="gold" size="icon" onClick={onCreateNew} className="sm:hidden shrink-0">
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Second row on mobile: Storage + Create button */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
          {/* Storage Usage Indicator */}
          <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-muted/50 border border-border flex-1 sm:flex-initial">
            <HardDrive className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0">
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <span className="text-xs text-muted-foreground hidden sm:inline">Storage</span>
                <span className="text-xs font-medium truncate">
                  {isLoadingUsage ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : usage ? (
                    `${formatUsage(usage.totalBytes)} / ${STORAGE_LIMIT_GB} GB`
                  ) : (
                    "..."
                  )}
                </span>
              </div>
              <Progress 
                value={usage?.percentUsed || 0} 
                className="h-1 sm:h-1.5 w-20 sm:w-32"
              />
            </div>
          </div>

          {/* Desktop: Create button */}
          <Button variant="gold" onClick={onCreateNew} className="hidden sm:flex">
            <Plus className="w-4 h-4 mr-2" />
            Start New Movie
          </Button>
        </div>
      </div>

      {/* Filter Tabs - Scrollable on mobile */}
      <div className="px-2 sm:px-4 border-b border-border overflow-x-auto">
        <Tabs value={vaultFilter} onValueChange={(v) => setVaultFilter(v as VaultFilter)}>
          <TabsList className="bg-transparent border-b-0 w-max min-w-full sm:w-auto">
            <TabsTrigger value="all" className="data-[state=active]:bg-muted text-xs sm:text-sm px-2 sm:px-3">
              All
            </TabsTrigger>
            <TabsTrigger value="main" className="data-[state=active]:bg-muted text-xs sm:text-sm px-2 sm:px-3">
              <Film className="w-3 h-3 mr-1 sm:mr-1.5" />
              Main
            </TabsTrigger>
            <TabsTrigger value="episode" className="data-[state=active]:bg-muted text-xs sm:text-sm px-2 sm:px-3">
              <Zap className="w-3 h-3 mr-1 sm:mr-1.5" />
              Episode
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (filteredMovies.length === 0 && !showRitualMovieCard) ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Film className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {vaultFilter === "all" ? "No Mind Movies Yet" : 
               vaultFilter === "episode" ? "No Episode Movies Yet" : "No Main Movies Yet"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {vaultFilter === "episode" 
                ? "Create a Mind Movie from your episodes to visualize your short-term sprints."
                : "Create your first Mind Movie to visualize your goals and manifest your dreams."
              }
            </p>
            {vaultFilter !== "episode" && (
              <Button variant="gold" onClick={onCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Movie
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Main Ritual Movie Card - Shows the movie from TheaterView */}
            {showRitualMovieCard && (
              <RitualMovieCard
                movieUrl={ritualMovieUrl!}
                displayName={profile?.display_name || "Director"}
                onPreview={() => setPreviewRitualMovie(true)}
                onShareToCommunity={() => setShareRitualMovie(true)}
                onReplace={handleReplaceRitualMovie}
                isReplacing={isReplacingRitual}
              />
            )}
            
            {filteredMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                isEpisodeMovie={episodeMovieIds.has(movie.id) || movie.title?.startsWith("Episode:")}
                isDeleting={deletingId === movie.id}
                isSettingActive={settingActiveId === movie.id}
                onSelect={() => onSelectMovie(movie)}
                onSetActive={() => handleSetActive(movie.id)}
                onDelete={() => handleDelete(movie.id)}
                onDuplicate={() => duplicateMovie(movie.id)}
                onPreview={() => handlePreview(movie)}
                onDownload={async () => {
                  if (!movie.movie_url) return;
                  try {
                    const response = await fetch(movie.movie_url);
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    const ext = movie.movie_url.includes('.webm') ? 'webm' : 'mp4';
                    a.download = `${movie.title || 'mind-movie'}.${ext}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Download failed:', error);
                  }
                }}
                onShareToCommunity={() => {
                  if (!movie.movie_url) {
                    toast.error("Complete your movie first before sharing");
                    return;
                  }
                  setShareMovie(movie);
                }}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Preview Modal for script-based movies */}
      <MoviePreviewModal
        open={!!previewMovie}
        onOpenChange={(open) => !open && setPreviewMovie(null)}
        movieUrl={previewMovie?.movie_url || null}
        movieTitle={previewMovie?.title || "Mind Movie Preview"}
      />

      {/* Preview Modal for ritual movie */}
      <MoviePreviewModal
        open={previewRitualMovie}
        onOpenChange={(open) => !open && setPreviewRitualMovie(false)}
        movieUrl={ritualMovieUrl || null}
        movieTitle="My Mind Movie"
      />

      {/* Share to Community Dialog for script movies */}
      <ShareToCommunityDialog
        isOpen={!!shareMovie}
        onClose={() => setShareMovie(null)}
        mediaUrl={shareMovie?.movie_url || ""}
        mediaType="video"
        defaultCaption={shareMovie?.chief_aim_snapshot?.what as string || `Check out my Mind Movie: ${shareMovie?.title || "My Vision"}`}
      />

      {/* Share to Community Dialog for ritual movie */}
      <ShareToCommunityDialog
        isOpen={shareRitualMovie}
        onClose={() => setShareRitualMovie(false)}
        mediaUrl={ritualMovieUrl || ""}
        mediaType="video"
        defaultCaption={profile?.chief_aim_what || "Check out my Mind Movie!"}
      />

      {/* Hidden file input for replacing ritual movie */}
      <input
        ref={ritualFileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleRitualFileChange}
      />
    </div>
  );
}

// Special card for the main ritual movie (from user_profiles.mind_movie_url)
interface RitualMovieCardProps {
  movieUrl: string;
  displayName: string;
  onPreview: () => void;
  onShareToCommunity: () => void;
  onReplace: () => void;
  isReplacing?: boolean;
}

function RitualMovieCard({ movieUrl, displayName, onPreview, onShareToCommunity, onReplace, isReplacing }: RitualMovieCardProps) {
  const [duration, setDuration] = useState<number | null>(null);

  useEffect(() => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = movieUrl;
    
    const handleLoadedMetadata = () => {
      if (video.duration && Number.isFinite(video.duration)) {
        setDuration(video.duration);
      }
    };
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.src = '';
    };
  }, [movieUrl]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(movieUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = movieUrl.includes('.webm') ? 'webm' : 'mp4';
      a.download = `my-mind-movie.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error("Failed to download movie");
    }
  };

  return (
    <Card className="group relative overflow-hidden transition-all border-gold ring-1 ring-gold/30 hover:ring-gold/50">
      {/* Thumbnail / Preview */}
      <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 relative">
        <video
          src={movieUrl}
          className="w-full h-full object-cover"
          muted
          preload="metadata"
        />

        {/* Duration badge */}
        {duration !== null && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-xs font-mono tabular-nums">
            {formatDuration(duration)}
          </div>
        )}

        {/* Main Movie badge with crown */}
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-gold to-amber-500 text-primary-foreground text-xs font-medium shadow-lg">
          <Crown className="w-3 h-3" />
          My Movie
        </div>

        {/* Active indicator */}
        <Badge variant="default" className="absolute top-2 right-2 bg-green-600">
          Active
        </Badge>

        {/* Play overlay */}
        <button
          onClick={onPreview}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="w-14 h-14 rounded-full bg-gold/90 flex items-center justify-center">
            <Play className="w-6 h-6 text-primary-foreground ml-1" />
          </div>
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium truncate mb-1">My Mind Movie</h3>
        <p className="text-xs text-muted-foreground mb-3">
          {displayName}'s daily ritual movie
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 italic">
          This is your main Mind Movie that plays during your morning ritual.
        </p>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <Button variant="gold" size="sm" className="flex-1 min-w-[80px]" onClick={onPreview}>
            <Play className="w-3 h-3 mr-1" />
            Play
          </Button>

          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={onReplace}
              disabled={isReplacing}
              title="Replace movie"
            >
              {isReplacing ? (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={onPreview}
              title="Preview movie"
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={handleDownload}
              title="Download movie"
            >
              <Download className="w-3 h-3" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 text-gold hover:text-gold/80"
              onClick={onShareToCommunity}
              title="Share to Director's Corner"
            >
              <Users className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

interface MovieCardProps {
  movie: MindMovie;
  isEpisodeMovie?: boolean;
  isDeleting: boolean;
  isSettingActive: boolean;
  onSelect: () => void;
  onSetActive: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onPreview: () => void;
  onDownload: () => void;
  onShareToCommunity: () => void;
}

function MovieCard({
  movie,
  isEpisodeMovie,
  isDeleting,
  isSettingActive,
  onSelect,
  onSetActive,
  onDelete,
  onDuplicate,
  onPreview,
  onDownload,
  onShareToCommunity,
}: MovieCardProps) {
  const hasVideo = !!movie.movie_url;
  const hasScenes = movie.scenes && movie.scenes.length > 0;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<number | null>(null);

  // Get video duration when component mounts
  useEffect(() => {
    if (!hasVideo || !movie.movie_url) return;
    
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = movie.movie_url;
    
    const handleLoadedMetadata = () => {
      if (video.duration && Number.isFinite(video.duration)) {
        setDuration(video.duration);
      }
    };
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.src = '';
    };
  }, [hasVideo, movie.movie_url]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
            ref={videoRef}
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

        {/* Duration badge - bottom right corner */}
        {hasVideo && duration !== null && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-xs font-mono tabular-nums">
            {formatDuration(duration)}
          </div>
        )}

        {/* Active badge */}
        {movie.is_active && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md bg-gold/90 text-primary-foreground text-xs font-medium">
            <Star className="w-3 h-3 fill-current" />
            Active
          </div>
        )}

        {/* Episode badge */}
        {isEpisodeMovie && !movie.is_active && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/90 text-primary-foreground text-xs font-medium">
            <Zap className="w-3 h-3" />
            Episode
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

        {/* Actions - Responsive grid */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <Button variant="outline" size="sm" className="flex-1 min-w-[80px]" onClick={onSelect}>
            <Edit3 className="w-3 h-3 mr-1" />
            Edit
          </Button>

          {!movie.is_active && hasVideo && (
            <Button
              variant="gold"
              size="sm"
              onClick={onSetActive}
              disabled={isSettingActive}
              className="flex-1 min-w-[80px]"
            >
              {isSettingActive ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Set </span>Active
                </>
              )}
            </Button>
          )}

          {/* Icon buttons row */}
          <div className="flex items-center gap-1 ml-auto">
            {hasVideo && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={onPreview}
                title="Preview movie"
              >
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            )}

            {hasVideo && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={onDownload}
                title="Download movie"
              >
                <Download className="w-3 h-3" />
              </Button>
            )}

            {hasVideo && movie.status === "complete" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 text-gold hover:text-gold/80"
                onClick={onShareToCommunity}
                title="Share to Director's Corner"
              >
                <Users className="w-3 h-3" />
              </Button>
            )}

            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={onDuplicate} title="Duplicate">
              <Copy className="w-3 h-3" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive"
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
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
      </div>
    </Card>
  );
}
