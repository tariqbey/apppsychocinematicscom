import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Droplets, Coins } from "lucide-react";
import { useWatermarkRemoval } from "@/hooks/useWatermarkRemoval";

interface WatermarkRemoverProps {
  videoUrl: string;
  mediaId?: string;
  onComplete?: (newVideoUrl: string) => void;
}

export function WatermarkRemover({ videoUrl, mediaId, onComplete }: WatermarkRemoverProps) {
  const { removeWatermark, isProcessing, getCost, canAfford } = useWatermarkRemoval();
  const [started, setStarted] = useState(false);

  const handleRemoveWatermark = async () => {
    const result = await removeWatermark(videoUrl, mediaId);
    if (result.success) {
      setStarted(true);
    }
  };

  const cost = getCost();
  const affordable = canAfford();

  if (started) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Processing... Check gallery for result</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleRemoveWatermark}
        disabled={isProcessing || !affordable}
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
  );
}
