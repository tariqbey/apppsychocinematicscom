import { useState, useRef } from "react";
import { Upload, Film, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface EpisodeMovieUploadProps {
  episodeId: string;
  episodeTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (movieUrl: string) => void;
}

export function EpisodeMovieUpload({
  episodeId,
  episodeTitle,
  isOpen,
  onClose,
  onSuccess,
}: EpisodeMovieUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["video/mp4", "video/webm", "video/quicktime", "video/mov"];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|webm|mov)$/i)) {
      toast.error("Please upload a valid video file (MP4, WebM, or MOV)");
      return;
    }

    // Validate file size (max 500MB for episode movies)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      toast.error("File too large. Maximum size is 500MB.");
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!user || !selectedFile) return;

    setUploading(true);
    setProgress(0);

    try {
      const timestamp = Date.now();
      const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${user.id}/episodes/${episodeId}/${timestamp}_${sanitizedName}`;

      // Create a mind_movie_script record for this episode movie
      const { data: scriptData, error: scriptError } = await supabase
        .from("mind_movie_scripts")
        .insert({
          user_id: user.id,
          title: `${episodeTitle} - Episode Movie`,
          status: "complete",
          is_active: false,
        })
        .select()
        .single();

      if (scriptError) throw scriptError;

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Upload to mind-movies bucket
      const { error: uploadError } = await supabase.storage
        .from("mind-movies")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      clearInterval(progressInterval);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from("mind-movies")
        .getPublicUrl(filePath);

      const movieUrl = urlData.publicUrl;

      // Update the script with the movie URL
      await supabase
        .from("mind_movie_scripts")
        .update({ movie_url: movieUrl })
        .eq("id", scriptData.id);

      // Link the script to the episode
      const { error: episodeError } = await supabase
        .from("episodes")
        .update({ mind_movie_script_id: scriptData.id })
        .eq("id", episodeId)
        .eq("user_id", user.id);

      if (episodeError) throw episodeError;

      setProgress(100);
      toast.success("Episode movie uploaded successfully!");
      onSuccess(movieUrl);
      handleClose();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload movie. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setProgress(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="w-5 h-5 text-amber-500" />
            Upload Episode Movie
          </DialogTitle>
          <DialogDescription>
            Upload an existing movie for "{episodeTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!selectedFile ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full h-40 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all"
            >
              <Upload className="w-10 h-10 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">Click to select a video</p>
                <p className="text-xs text-muted-foreground mt-1">
                  MP4, WebM, or MOV (max 500MB)
                </p>
              </div>
            </button>
          ) : (
            <div className="p-4 border border-border rounded-xl bg-muted/30">
              <div className="flex items-center gap-3">
                <Film className="w-8 h-8 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
                {!uploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedFile(null)}
                    className="shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {uploading && (
                <div className="mt-3 space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    Uploading... {progress}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Movie
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
