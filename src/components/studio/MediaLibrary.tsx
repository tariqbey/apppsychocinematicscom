import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Image, Video, Clock, AlertCircle, Loader2, Download, Trash2, HardDrive } from "lucide-react";
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

  const handleDownload = async (media: GeneratedMedia, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleDelete = async (media: GeneratedMedia, e: React.MouseEvent) => {
    e.stopPropagation();
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
                onClick={() => item.status === "completed" && onSelect?.(item)}
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

                  {/* Action Buttons - Show on Hover */}
                  {item.status === "completed" && item.media_url && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0"
                        onClick={(e) => handleDownload(item, e)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0"
                        onClick={(e) => handleDelete(item, e)}
                        disabled={isDeleting === item.id}
                      >
                        {isDeleting === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
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
