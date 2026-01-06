import { useState, useRef } from "react";
import { Upload, Film, Loader2, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface VideoUploaderProps {
  currentVideoUrl: string | null;
  onUploadComplete: (url: string) => void;
  onClose: () => void;
}

export const VideoUploader = ({
  currentVideoUrl,
  onUploadComplete,
  onClose,
}: VideoUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Not authenticated",
        description: "Please sign in to upload your Mind Movie.",
      });
      return;
    }

    // Validate file type
    const validTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an MP4, WebM, MOV, or AVI video.",
      });
      return;
    }

    // Validate file size (1GB max)
    if (file.size > 1024 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Maximum file size is 1GB.",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/mind-movie-${Date.now()}.${fileExt}`;

      // Simulate progress (Supabase doesn't provide progress callbacks)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const { data, error } = await supabase.storage
        .from("mind-movies")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      clearInterval(progressInterval);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("mind-movies")
        .getPublicUrl(data.path);

      setUploadProgress(100);

      // Update user profile with video URL
      await supabase
        .from("user_profiles")
        .update({ mind_movie_url: urlData.publicUrl })
        .eq("user_id", user.id);

      toast({
        title: "Mind Movie Uploaded!",
        description: "Your vision is now ready for daily screening.",
      });

      onUploadComplete(urlData.publicUrl);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Something went wrong",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-cinematic-midnight/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg glass-card cinematic-border overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-amber-soft flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-display tracking-wide">Upload Mind Movie</h2>
              <p className="text-sm text-muted-foreground">Your AI-generated vision</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Upload Area */}
        <div className="p-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300",
              isDragging
                ? "border-gold bg-gold/10"
                : "border-border hover:border-gold/50 hover:bg-secondary/50",
              isUploading && "pointer-events-none"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
              onChange={handleFileSelect}
              className="hidden"
            />

            {isUploading ? (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 text-gold mx-auto animate-spin" />
                <p className="text-foreground font-medium">Uploading your vision...</p>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold to-amber-soft transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
              </div>
            ) : uploadProgress === 100 ? (
              <div className="space-y-4">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <p className="text-foreground font-medium">Upload Complete!</p>
                <p className="text-sm text-muted-foreground">
                  Your Mind Movie is ready for screening
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-secondary mx-auto flex items-center justify-center">
                  <Film className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-foreground font-medium">
                    Drop your Mind Movie here
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  MP4, WebM, MOV, AVI • Max 1GB
                </p>
              </div>
            )}
          </div>

          {currentVideoUrl && (
            <div className="mt-4 p-4 rounded-lg bg-secondary/50 border border-border">
              <p className="text-sm text-muted-foreground mb-2">Current Video:</p>
              <p className="text-sm text-foreground truncate">{currentVideoUrl}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex justify-end gap-3">
          <Button variant="cinematic" onClick={onClose}>
            Cancel
          </Button>
          {uploadProgress === 100 && (
            <Button variant="gold" onClick={onClose}>
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
