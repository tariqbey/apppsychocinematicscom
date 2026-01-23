import { useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { MindMoviePlayer } from "@/components/theater/MindMoviePlayer";
import { useToast } from "@/hooks/use-toast";

interface MoviePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movieUrl: string | null;
  movieTitle: string;
}

export function MoviePreviewModal({
  open,
  onOpenChange,
  movieUrl,
  movieTitle,
}: MoviePreviewModalProps) {
  const { toast } = useToast();

  // iOS detection for proxy routing
  const isIOS = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  }, []);

  // Route iOS storage URLs through the proxy for stable Range/206 responses
  const proxiedUrl = useMemo(() => {
    if (!movieUrl) return null;
    if (!isIOS) return movieUrl;
    if (movieUrl.includes("/functions/v1/video-proxy")) return movieUrl;
    if (!movieUrl.includes("/storage/v1/object/")) return movieUrl;

    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!baseUrl) return movieUrl;
    return `${baseUrl}/functions/v1/video-proxy?url=${encodeURIComponent(movieUrl)}`;
  }, [movieUrl, isIOS]);

  const handleError = (message: string) => {
    toast({
      title: "Playback Error",
      description: message,
      variant: "destructive",
    });
  };

  if (!proxiedUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-border">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-50 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Video container using new player */}
        <div className="relative aspect-video bg-black">
          <MindMoviePlayer
            key={proxiedUrl}
            src={proxiedUrl}
            disableSeeking={false}
            restartOnInterrupt={false}
            onError={handleError}
            className="w-full h-full"
          />
        </div>

        {/* Title */}
        <div className="p-4 bg-background border-t border-border">
          <h3 className="font-medium truncate">{movieTitle}</h3>
        </div>
      </DialogContent>
    </Dialog>
  );
}
