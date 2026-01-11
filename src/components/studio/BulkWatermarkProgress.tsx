import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle2, XCircle, Droplets, Clock } from "lucide-react";
import { useWatermarkRemoval } from "@/hooks/useWatermarkRemoval";

export interface BulkVideoItem {
  id: string;
  mediaUrl: string;
  prompt: string;
}

export type VideoStatus = "pending" | "processing" | "polling" | "completed" | "failed";

export interface VideoProgress {
  id: string;
  prompt: string;
  status: VideoStatus;
  predictionId?: string;
  error?: string;
}

interface BulkWatermarkProgressProps {
  videos: BulkVideoItem[];
  isProcessing: boolean;
  onComplete: () => void;
  onProgressUpdate: (progress: VideoProgress[]) => void;
}

export function BulkWatermarkProgress({
  videos,
  isProcessing,
  onComplete,
  onProgressUpdate,
}: BulkWatermarkProgressProps) {
  const [videoProgress, setVideoProgress] = useState<VideoProgress[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const { removeWatermark, checkStatus } = useWatermarkRemoval();

  // Initialize progress tracking when videos change
  useEffect(() => {
    if (videos.length > 0 && isProcessing && !isRunning) {
      const initialProgress: VideoProgress[] = videos.map((v) => ({
        id: v.id,
        prompt: v.prompt,
        status: "pending",
      }));
      setVideoProgress(initialProgress);
      setCurrentIndex(0);
      setIsRunning(true);
    }
  }, [videos, isProcessing, isRunning]);

  // Process videos sequentially
  useEffect(() => {
    if (!isRunning || currentIndex >= videos.length) {
      if (isRunning && currentIndex >= videos.length) {
        setIsRunning(false);
        onComplete();
      }
      return;
    }

    const processCurrentVideo = async () => {
      const video = videos[currentIndex];

      // Update status to processing
      setVideoProgress((prev) => {
        const updated = prev.map((p) =>
          p.id === video.id ? { ...p, status: "processing" as VideoStatus } : p
        );
        onProgressUpdate(updated);
        return updated;
      });

      // Call watermark removal
      const result = await removeWatermark(video.mediaUrl, video.id);

      if (result.success && result.predictionId) {
        // Update to polling status
        setVideoProgress((prev) => {
          const updated = prev.map((p) =>
            p.id === video.id
              ? { ...p, status: "polling" as VideoStatus, predictionId: result.predictionId }
              : p
          );
          onProgressUpdate(updated);
          return updated;
        });

        // Start polling for this video
        pollVideoStatus(video.id, result.predictionId);
      } else {
        // Mark as failed
        setVideoProgress((prev) => {
          const updated = prev.map((p) =>
            p.id === video.id
              ? { ...p, status: "failed" as VideoStatus, error: result.error || "Unknown error" }
              : p
          );
          onProgressUpdate(updated);
          return updated;
        });
      }

      // Move to next video
      setCurrentIndex((prev) => prev + 1);
    };

    processCurrentVideo();
  }, [isRunning, currentIndex, videos]);

  // Poll for video status
  const pollVideoStatus = async (videoId: string, predictionId: string) => {
    const maxAttempts = 120; // 10 minutes max
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setVideoProgress((prev) => {
          const updated = prev.map((p) =>
            p.id === videoId
              ? { ...p, status: "failed" as VideoStatus, error: "Timeout - check gallery later" }
              : p
          );
          onProgressUpdate(updated);
          return updated;
        });
        return;
      }

      const statusResult = await checkStatus(predictionId);

      if (statusResult.status === "succeeded" || statusResult.videoUrl) {
        setVideoProgress((prev) => {
          const updated = prev.map((p) =>
            p.id === videoId ? { ...p, status: "completed" as VideoStatus } : p
          );
          onProgressUpdate(updated);
          return updated;
        });
      } else if (statusResult.status === "failed" || statusResult.error) {
        setVideoProgress((prev) => {
          const updated = prev.map((p) =>
            p.id === videoId
              ? { ...p, status: "failed" as VideoStatus, error: statusResult.error }
              : p
          );
          onProgressUpdate(updated);
          return updated;
        });
      } else {
        // Still processing, poll again
        attempts++;
        setTimeout(poll, 5000); // Poll every 5 seconds
      }
    };

    poll();
  };

  const completedCount = videoProgress.filter((v) => v.status === "completed").length;
  const failedCount = videoProgress.filter((v) => v.status === "failed").length;
  const processingCount = videoProgress.filter(
    (v) => v.status === "processing" || v.status === "polling"
  ).length;
  const pendingCount = videoProgress.filter((v) => v.status === "pending").length;

  const overallProgress =
    videoProgress.length > 0
      ? ((completedCount + failedCount) / videoProgress.length) * 100
      : 0;

  if (videoProgress.length === 0) return null;

  const getStatusIcon = (status: VideoStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-gold" />;
      case "polling":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusLabel = (status: VideoStatus) => {
    switch (status) {
      case "pending":
        return "Waiting";
      case "processing":
        return "Sending";
      case "polling":
        return "Removing...";
      case "completed":
        return "Done";
      case "failed":
        return "Failed";
    }
  };

  return (
    <div className="mt-3 p-4 rounded-lg bg-background/80 border border-border/50 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-gold" />
          <span className="font-medium">Bulk Watermark Removal</span>
        </div>
        <div className="flex items-center gap-2">
          {processingCount > 0 && (
            <Badge variant="outline" className="gap-1 text-gold border-gold/50">
              <Loader2 className="h-3 w-3 animate-spin" />
              {processingCount} active
            </Badge>
          )}
          {completedCount > 0 && (
            <Badge className="bg-green-500/20 text-green-500 border-green-500/50">
              {completedCount} done
            </Badge>
          )}
          {failedCount > 0 && (
            <Badge variant="destructive">
              {failedCount} failed
            </Badge>
          )}
        </div>
      </div>

      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Overall Progress</span>
          <span>{Math.round(overallProgress)}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      {/* Individual Video Progress */}
      <ScrollArea className="h-[150px]">
        <div className="space-y-2 pr-4">
          {videoProgress.map((video, index) => (
            <div
              key={video.id}
              className={`p-3 rounded-lg border transition-colors ${
                video.status === "processing" || video.status === "polling"
                  ? "bg-gold/10 border-gold/30"
                  : video.status === "completed"
                  ? "bg-green-500/10 border-green-500/30"
                  : video.status === "failed"
                  ? "bg-destructive/10 border-destructive/30"
                  : "bg-muted/30 border-border/50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getStatusIcon(video.status)}
                  <span className="text-sm font-medium truncate">
                    Video {index + 1}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 ${
                    video.status === "completed"
                      ? "text-green-500 border-green-500/50"
                      : video.status === "failed"
                      ? "text-destructive border-destructive/50"
                      : video.status === "processing" || video.status === "polling"
                      ? "text-gold border-gold/50"
                      : ""
                  }`}
                >
                  {getStatusLabel(video.status)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {video.prompt}
              </p>
              {video.error && (
                <p className="text-xs text-destructive mt-1">{video.error}</p>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Summary when complete */}
      {pendingCount === 0 && processingCount === 0 && (
        <div className="pt-2 border-t border-border/50 text-center">
          <p className="text-sm text-muted-foreground">
            {completedCount > 0 && failedCount === 0
              ? "✨ All videos processed successfully!"
              : failedCount > 0 && completedCount > 0
              ? `Completed ${completedCount} of ${videoProgress.length} videos`
              : "Processing complete"}
          </p>
        </div>
      )}
    </div>
  );
}
