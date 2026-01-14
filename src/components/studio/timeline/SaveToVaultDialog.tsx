import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Film, Plus, Check, Upload } from "lucide-react";
import { useMindMovies, MindMovie } from "@/hooks/useMindMovies";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface SaveToVaultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportedBlobUrl: string | null;
  onSaveComplete: (movieId: string, savedUrl: string) => void;
}

export function SaveToVaultDialog({
  open,
  onOpenChange,
  exportedBlobUrl,
  onSaveComplete,
}: SaveToVaultDialogProps) {
  const { user } = useAuth();
  const { movies, fetchAllMovies, createNewMovie, saveMovieUrl, isLoading: moviesLoading } = useMindMovies();
  
  const [selectedMovieId, setSelectedMovieId] = useState<string | "new">("new");
  const [newMovieTitle, setNewMovieTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load movies when dialog opens
  useEffect(() => {
    if (open) {
      fetchAllMovies();
      setSelectedMovieId("new");
      setNewMovieTitle("");
      setUploadProgress(0);
    }
  }, [open, fetchAllMovies]);

  const handleSave = async () => {
    if (!exportedBlobUrl || !user) return;

    setIsSaving(true);
    setUploadProgress(10);

    try {
      // Fetch the blob from the object URL
      const response = await fetch(exportedBlobUrl);
      const blob = await response.blob();
      setUploadProgress(30);

      // Determine target movie ID
      let targetMovieId = selectedMovieId;

      // Create new movie if needed
      if (selectedMovieId === "new") {
        const newMovie = await createNewMovie(newMovieTitle || undefined);
        if (!newMovie) {
          throw new Error("Failed to create new movie");
        }
        targetMovieId = newMovie.id;
      }
      setUploadProgress(50);

      // Upload to storage
      const fileName = `${user.id}/${targetMovieId}/mind-movie-${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("mind-movies")
        .upload(fileName, blob, {
          contentType: "video/webm",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      setUploadProgress(80);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("mind-movies")
        .getPublicUrl(fileName);

      const savedUrl = urlData.publicUrl;

      // Save URL to movie record
      const success = await saveMovieUrl(targetMovieId, savedUrl);
      if (!success) {
        throw new Error("Failed to save movie URL to database");
      }
      setUploadProgress(100);

      onSaveComplete(targetMovieId, savedUrl);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving to vault:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Save to Mind Movie Vault
          </DialogTitle>
          <DialogDescription>
            Choose where to save your exported video or create a new Mind Movie project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Create New Option */}
          <div
            className={cn(
              "p-4 rounded-lg border-2 cursor-pointer transition-all",
              selectedMovieId === "new"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
            onClick={() => setSelectedMovieId("new")}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center",
                selectedMovieId === "new" ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                <Plus className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Create New Mind Movie</p>
                <p className="text-sm text-muted-foreground">Start a fresh project</p>
              </div>
              {selectedMovieId === "new" && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
            
            {selectedMovieId === "new" && (
              <div className="mt-4">
                <Label htmlFor="newTitle" className="text-sm">Movie Title (optional)</Label>
                <Input
                  id="newTitle"
                  value={newMovieTitle}
                  onChange={(e) => setNewMovieTitle(e.target.value)}
                  placeholder="My Mind Movie"
                  className="mt-1.5"
                />
              </div>
            )}
          </div>

          {/* Existing Movies */}
          {movies.length > 0 && (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex-1 h-px bg-border" />
                <span>or save to existing</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {movies.map((movie) => (
                    <div
                      key={movie.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all",
                        selectedMovieId === movie.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => setSelectedMovieId(movie.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-8 w-8 rounded flex items-center justify-center shrink-0",
                          movie.movie_url ? "bg-green-500/20" : "bg-muted"
                        )}>
                          <Film className={cn(
                            "h-4 w-4",
                            movie.movie_url ? "text-green-500" : "text-muted-foreground"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {movie.title || "Untitled Movie"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {movie.status === "complete" ? "Complete" : "In Progress"}
                            {movie.is_active && " • Active"}
                            {movie.movie_url && " • Has video"}
                          </p>
                        </div>
                        {selectedMovieId === movie.id && (
                          <Check className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}

          {/* Upload Progress */}
          {isSaving && (
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading to vault...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !exportedBlobUrl}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Save to Vault
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
