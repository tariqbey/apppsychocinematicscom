import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Droplets, Coins, Link, CheckCircle, XCircle } from "lucide-react";
import { useWatermarkRemoval } from "@/hooks/useWatermarkRemoval";
import { useToast } from "@/hooks/use-toast";

interface UrlWatermarkRemoverProps {
  onComplete?: () => void;
}

type ProcessingStatus = "idle" | "processing" | "polling" | "completed" | "failed";

export function UrlWatermarkRemover({ onComplete }: UrlWatermarkRemoverProps) {
  const { removeWatermark, checkStatus, isProcessing, getCost, canAfford } = useWatermarkRemoval();
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isValidUrl = (urlString: string) => {
    try {
      const parsed = new URL(urlString);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Poll for status when we have a predictionId
  useEffect(() => {
    if (!predictionId || status !== "polling") return;

    let pollCount = 0;
    const maxPolls = 60; // 5 minutes max (5s intervals)

    const poll = async () => {
      pollCount++;
      setProgress(Math.min(95, (pollCount / maxPolls) * 100));

      try {
        const result = await checkStatus(predictionId);
        
        if (result.status === "completed" && result.videoUrl) {
          setStatus("completed");
          setProgress(100);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
          toast({
            title: "Watermark Removed!",
            description: "Your clean video is now in the gallery.",
          });
          onComplete?.();
        } else if (result.status === "failed" || result.error) {
          setStatus("failed");
          setErrorMessage(result.error || "Processing failed");
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
        }
        // If still processing, continue polling
      } catch (err) {
        console.error("Poll error:", err);
      }

      if (pollCount >= maxPolls) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        setStatus("completed");
        toast({
          title: "Processing continues",
          description: "Check the gallery in a few minutes for your result.",
        });
        onComplete?.();
      }
    };

    // Start polling every 5 seconds
    pollIntervalRef.current = setInterval(poll, 5000);
    // Run first poll immediately
    poll();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [predictionId, status, checkStatus, onComplete, toast]);

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

    setStatus("processing");
    setProgress(0);
    setErrorMessage(null);

    const result = await removeWatermark(url.trim());
    if (result.success && result.predictionId) {
      setPredictionId(result.predictionId);
      setStatus("polling");
      setUrl("");
    } else {
      setStatus("failed");
      setErrorMessage(result.error || "Failed to start processing");
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setPredictionId(null);
    setProgress(0);
    setErrorMessage(null);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
  };

  const cost = getCost();
  const affordable = canAfford();

  // Show progress/status while processing
  if (status === "processing" || status === "polling") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-gold" />
          <span className="text-muted-foreground">
            {status === "processing" ? "Starting..." : "Removing watermark..."}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground">
          This typically takes 1-2 minutes. Please wait...
        </p>
      </div>
    );
  }

  // Show completion state
  if (status === "completed") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-green-500">
          <CheckCircle className="h-4 w-4" />
          <span>Watermark removed! Check your gallery.</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleReset}
          className="text-xs"
        >
          Process another URL
        </Button>
      </div>
    );
  }

  // Show error state
  if (status === "failed") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-destructive">
          <XCircle className="h-4 w-4" />
          <span>{errorMessage || "Processing failed"}</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleReset}
          className="text-xs"
        >
          Try again
        </Button>
      </div>
    );
  }

  // Default idle state - show input form
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
