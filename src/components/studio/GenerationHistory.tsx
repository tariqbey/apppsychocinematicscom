import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image, Video, Clock, AlertCircle, Loader2 } from "lucide-react";
import { useMediaGeneration, GeneratedMedia } from "@/hooks/useMediaGeneration";
import { formatDistanceToNow } from "date-fns";

interface GenerationHistoryProps {
  filter?: "image" | "video" | "all";
  onSelect?: (media: GeneratedMedia) => void;
}

export function GenerationHistory({ filter = "all", onSelect }: GenerationHistoryProps) {
  const [history, setHistory] = useState<GeneratedMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchGenerationHistory } = useMediaGeneration();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    const data = await fetchGenerationHistory();
    setHistory(data);
    setIsLoading(false);
  };

  const filteredHistory = filter === "all" 
    ? history 
    : history.filter(item => item.media_type === filter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (filteredHistory.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No generations yet</p>
        <p className="text-sm">Your AI creations will appear here</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3 pr-4">
        {filteredHistory.map((item) => (
          <div
            key={item.id}
            className="flex gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
            onClick={() => item.status === "completed" && onSelect?.(item)}
          >
            <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
              {item.status === "completed" && item.media_url ? (
                item.media_type === "image" ? (
                  <img src={item.media_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <video src={item.media_url} className="w-full h-full object-cover" />
                )
              ) : item.status === "processing" ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : item.status === "failed" ? (
                <div className="w-full h-full flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {item.media_type === "image" ? (
                    <Image className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Video className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.prompt}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground capitalize">
                  {item.media_type}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </span>
              </div>
              {item.status === "failed" && item.error_message && (
                <p className="text-xs text-destructive mt-1 truncate">{item.error_message}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
