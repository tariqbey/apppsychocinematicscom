import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Image, Video, Clock, AlertCircle, Loader2, Download, Trash2, HardDrive, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useMediaGeneration, GeneratedMedia } from "@/hooks/useMediaGeneration";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MediaLibraryProps {
  filter?: "image" | "video" | "all";
  onSelect?: (media: GeneratedMedia) => void;
}

const MAX_STORAGE_BYTES = 5 * 1024 * 1024 * 1024; // 5GB

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function MediaLibrary({ filter = "all", onSelect }: MediaLibraryProps) {
  const [history, setHistory] = useState<GeneratedMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageUsed, setStorageUsed] = useState(0);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [lightboxMedia, setLightboxMedia] = useState<GeneratedMedia | null>(null);
  const { fetchGenerationHistory } = useMediaGeneration();
  const { toast } = useToast();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    const data = await fetchGenerationHistory();
    setHistory(data);
    
    // Estimate storage based on media count (rough estimate: 2MB per image, 50MB per video)
    const estimatedStorage = data.reduce((acc, item) => {
      if (item.status === "completed" && item.media_url) {
        return acc + (item.media_type === "image" ? 2 * 1024 * 1024 : 50 * 1024 * 1024);
      }
      return acc;
    }, 0);
    setStorageUsed(estimatedStorage);
    
    setIsLoading(false);
  };

  const handleDownload = async (media: GeneratedMedia, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!media.media_url) return;

    try {
      const response = await fetch(media.media_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${media.media_type}-${media.id.slice(0, 8)}.${media.media_type === "image" ? "png" : "mp4"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: `Your ${media.media_type} is downloading.`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Unable to download the file.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (media: GeneratedMedia, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsDeleting(media.id);

    try {
      const { error } = await supabase
        .from("generated_media")
        .delete()
        .eq("id", media.id);

      if (error) throw error;

      setHistory((prev) => prev.filter((item) => item.id !== media.id));
      
      // Update storage estimate
      const removedSize = media.media_type === "image" ? 2 * 1024 * 1024 : 50 * 1024 * 1024;
      setStorageUsed((prev) => Math.max(0, prev - removedSize));
      
      // Close lightbox if the deleted item was being viewed
      if (lightboxMedia?.id === media.id) {
        setLightboxMedia(null);
      }
      
      toast({
        title: "Deleted",
        description: `${media.media_type === "image" ? "Image" : "Video"} removed from library.`,
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Unable to delete the file.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredHistory = filter === "all" 
    ? history 
    : history.filter(item => item.media_type === filter);

  const completedMedia = filteredHistory.filter(item => item.status === "completed" && item.media_url);

  const currentIndex = lightboxMedia ? completedMedia.findIndex(m => m.id === lightboxMedia.id) : -1;

  const navigateLightbox = (direction: "prev" | "next") => {
    if (currentIndex === -1) return;
    const newIndex = direction === "prev" 
      ? (currentIndex - 1 + completedMedia.length) % completedMedia.length
      : (currentIndex + 1) % completedMedia.length;
    setLightboxMedia(completedMedia[newIndex]);
  };

  const storagePercentage = (storageUsed / MAX_STORAGE_BYTES) * 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lightbox Modal */}
      <Dialog open={!!lightboxMedia} onOpenChange={(open) => !open && setLightboxMedia(null)}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-border/50 overflow-hidden">
          {lightboxMedia && (
            <div className="relative">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
                onClick={() => setLightboxMedia(null)}
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Navigation Arrows */}
              {completedMedia.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                    onClick={() => navigateLightbox("prev")}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                    onClick={() => navigateLightbox("next")}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}

              {/* Media Display */}
              <div className="flex items-center justify-center min-h-[400px] max-h-[70vh]">
                {lightboxMedia.media_type === "image" ? (
                  <img 
                    src={lightboxMedia.media_url!} 
                    alt="" 
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                ) : (
                  <video 
                    src={lightboxMedia.media_url!} 
                    controls 
                    autoPlay
                    className="max-w-full max-h-[70vh]"
                  />
                )}
              </div>

              {/* Info Bar */}
              <div className="p-4 bg-background/80 backdrop-blur-sm border-t border-border/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{lightboxMedia.prompt}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {lightboxMedia.model_used} • {formatDistanceToNow(new Date(lightboxMedia.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(lightboxMedia)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(lightboxMedia)}
                      disabled={isDeleting === lightboxMedia.id}
                    >
                      {isDeleting === lightboxMedia.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Storage Indicator */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Storage Used</span>
          </div>
          <span className="font-medium">
            {formatBytes(storageUsed)} / {formatBytes(MAX_STORAGE_BYTES)}
          </span>
        </div>
        <Progress value={storagePercentage} className="h-2" />
        {storagePercentage > 80 && (
          <p className="text-xs text-amber-500">
            Running low on storage. Consider deleting unused media.
          </p>
        )}
      </div>

      {filteredHistory.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No generations yet</p>
          <p className="text-sm">Your AI creations will appear here</p>
        </div>
      ) : (
        <ScrollArea className="h-[350px]">
          <div className="grid grid-cols-2 gap-3 pr-4">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-lg border border-border/50 overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => item.status === "completed" && item.media_url && setLightboxMedia(item)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-muted">
                  {item.status === "completed" && item.media_url ? (
                    item.media_type === "image" ? (
                      <img src={item.media_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <video src={item.media_url} className="w-full h-full object-cover" />
                    )
                  ) : item.status === "processing" ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : item.status === "failed" ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {item.media_type === "image" ? (
                        <Image className="h-6 w-6 text-muted-foreground" />
                      ) : (
                        <Video className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                  )}
                  
                  {/* Type Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-black/60 text-white capitalize">
                      {item.media_type}
                    </span>
                  </div>

                  {/* Hover Overlay */}
                  {item.status === "completed" && item.media_url && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Click to preview</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="text-xs truncate">{item.prompt}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
