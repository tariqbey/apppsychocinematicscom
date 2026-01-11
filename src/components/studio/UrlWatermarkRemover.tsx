import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Droplets, Coins, Link } from "lucide-react";
import { useWatermarkRemoval } from "@/hooks/useWatermarkRemoval";
import { useToast } from "@/hooks/use-toast";

interface UrlWatermarkRemoverProps {
  onComplete?: () => void;
}

export function UrlWatermarkRemover({ onComplete }: UrlWatermarkRemoverProps) {
  const { removeWatermark, isProcessing, getCost, canAfford } = useWatermarkRemoval();
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [started, setStarted] = useState(false);

  const isValidUrl = (urlString: string) => {
    try {
      const parsed = new URL(urlString);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleRemoveWatermark = async () => {
    if (!url.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a Sora video URL.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid video URL.",
        variant: "destructive",
      });
      return;
    }

    const result = await removeWatermark(url.trim());
    if (result.success) {
      setStarted(true);
      setUrl("");
      toast({
        title: "Watermark removal started",
        description: "Your video is being processed. Check the gallery for the result.",
      });
      onComplete?.();
    }
  };

  const cost = getCost();
  const affordable = canAfford();

  if (started) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Processing... Check gallery for result</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setStarted(false)}
          className="text-xs"
        >
          Process another URL
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <Input
          type="url"
          placeholder="Paste Sora video URL here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isProcessing && affordable && url.trim()) {
              handleRemoveWatermark();
            }
          }}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleRemoveWatermark}
          disabled={isProcessing || !affordable || !url.trim()}
          className="gap-2"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Droplets className="h-4 w-4" />
          )}
          Remove Watermark
        </Button>
        <Badge variant="outline" className="gap-1">
          <Coins className="h-3 w-3" />
          {cost}
        </Badge>
      </div>
    </div>
  );
}
