import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Image, Video, Clock, AlertCircle, Loader2, Download, Trash2, HardDrive, X, ChevronLeft, ChevronRight, RefreshCw, Mic2, Droplets, Coins, CheckSquare } from "lucide-react";
import { useMediaGeneration, GeneratedMedia } from "@/hooks/useMediaGeneration";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { VoiceChanger } from "./VoiceChanger";
import { WatermarkRemover } from "./WatermarkRemover";
import { useWatermarkRemoval } from "@/hooks/useWatermarkRemoval";

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
  const [showVoiceChanger, setShowVoiceChanger] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const { fetchGenerationHistory } = useMediaGeneration();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { removeWatermark, getCost, canAfford } = useWatermarkRemoval();

  // Load history when user becomes available
  useEffect(() => {
    if (authLoading) return;
    if (user?.id) {
      loadHistory();
    } else {
      setIsLoading(false);
      setHistory([]);
    }
  }, [user?.id, authLoading]);

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
      
      const mediaTypeLabel = media.media_type === "image" ? "Image" : media.media_type === "video" ? "Video" : "Audio";
      toast({
        title: "Deleted",
        description: `${mediaTypeLabel} removed. Saved ~${formatBytes(removedSize)} of storage.`,
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

  // Get Sora 2 videos eligible for watermark removal
  const soraVideosEligible = useMemo(() => {
    return completedMedia.filter(item => 
      item.media_type === "video" &&
      item.model_used?.includes("sora") &&
      !item.model_used?.includes("watermark-remover") &&
      item.media_url
    );
  }, [completedMedia]);

  const selectedSoraVideos = useMemo(() => {
    return soraVideosEligible.filter(item => selectedIds.has(item.id));
  }, [soraVideosEligible, selectedIds]);

  const currentIndex = lightboxMedia ? completedMedia.findIndex(m => m.id === lightboxMedia.id) : -1;

  const navigateLightbox = (direction: "prev" | "next") => {
    if (currentIndex === -1) return;
    const newIndex = direction === "prev" 
      ? (currentIndex - 1 + completedMedia.length) % completedMedia.length
      : (currentIndex + 1) % completedMedia.length;
    setLightboxMedia(completedMedia[newIndex]);
  };

  const toggleSelection = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllSora = () => {
    setSelectedIds(new Set(soraVideosEligible.map(v => v.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const handleBulkWatermarkRemoval = async () => {
    if (selectedSoraVideos.length === 0) return;

    const totalCost = getCost() * selectedSoraVideos.length;
    
    setIsBulkProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const video of selectedSoraVideos) {
      if (video.media_url) {
        const result = await removeWatermark(video.media_url, video.id);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      }
    }

    setIsBulkProcessing(false);
    clearSelection();

    if (successCount > 0) {
      toast({
        title: `Bulk Watermark Removal Started`,
        description: `Processing ${successCount} video${successCount > 1 ? 's' : ''}. Check gallery for results.${failCount > 0 ? ` ${failCount} failed.` : ''}`,
      });
    } else if (failCount > 0) {
      toast({
        title: "Bulk Removal Failed",
        description: "Could not process videos. Check your credits.",
        variant: "destructive",
      });
    }
  };

  const storagePercentage = (storageUsed / MAX_STORAGE_BYTES) * 100;

  // Show loading while auth is resolving
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show sign-in message if not authenticated
  if (!user) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Please sign in to view your gallery</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lightbox Modal */}
      <Dialog open={!!lightboxMedia} onOpenChange={(open) => !open && setLightboxMedia(null)}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 bg-black/95 border-border/50 overflow-hidden flex flex-col">
          {lightboxMedia && (
            <div className="flex flex-col max-h-[90vh] overflow-hidden">
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
                    className="absolute left-2 top-1/3 z-10 text-white hover:bg-white/20"
                    onClick={() => navigateLightbox("prev")}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/3 z-10 text-white hover:bg-white/20"
                    onClick={() => navigateLightbox("next")}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}

              {/* Media Display - Fixed height */}
              <div className="flex items-center justify-center min-h-[200px] max-h-[40vh] flex-shrink-0">
                {lightboxMedia.media_type === "image" ? (
                  <img 
                    src={lightboxMedia.media_url!} 
                    alt="" 
                    className="max-w-full max-h-[40vh] object-contain"
                  />
                ) : (
                  <video 
                    src={lightboxMedia.media_url!} 
                    controls 
                    autoPlay
                    className="max-w-full max-h-[40vh]"
                  />
                )}
              </div>

              {/* Scrollable Info/Controls Section */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-4 bg-background/80 backdrop-blur-sm border-t border-border/50">
                  {/* Action Buttons Row */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {/* Voice Changer Toggle for Videos */}
                    {lightboxMedia.media_type === "video" && (
                      <Button
                        size="sm"
                        variant={showVoiceChanger ? "default" : "outline"}
                        onClick={() => setShowVoiceChanger(!showVoiceChanger)}
                      >
                        <Mic2 className="h-4 w-4 mr-2" />
                        Voice
                      </Button>
                    )}
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
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Media Info */}
                  <div className="mb-3">
                    <p className="text-sm font-medium">{lightboxMedia.prompt}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {lightboxMedia.model_used} • {formatDistanceToNow(new Date(lightboxMedia.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  
                  {/* Sora 2 Watermark Remover - Show for Sora 2 generated videos */}
                  {lightboxMedia.media_type === "video" && 
                   lightboxMedia.model_used?.includes("sora") && 
                   !lightboxMedia.model_used?.includes("watermark-remover") &&
                   lightboxMedia.media_url && (
                    <div className="pt-3 pb-3 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-2">Sora 2 Watermark Remover</p>
                      <WatermarkRemover 
                        videoUrl={lightboxMedia.media_url}
                        mediaId={lightboxMedia.id}
                        onComplete={(newUrl) => {
                          toast({
                            title: "Watermark Removed!",
                            description: "Your clean video is now in the gallery.",
                          });
                          loadHistory();
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Voice Changer Panel for Videos */}
                  {lightboxMedia.media_type === "video" && showVoiceChanger && lightboxMedia.media_url && (
                    <div className="pt-3 border-t border-border/50">
                      <VoiceChanger 
                        videoUrl={lightboxMedia.media_url}
                        onVideoMerged={(mergedUrl) => {
                          toast({
                            title: "Voice Changed!",
                            description: "Your video has been updated with the new voice.",
                          });
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Storage Indicator & Bulk Actions */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Storage Used</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {formatBytes(storageUsed)} / {formatBytes(MAX_STORAGE_BYTES)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={loadHistory}
              title="Refresh gallery"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <Progress value={storagePercentage} className="h-2" />
        {storagePercentage > 80 && (
          <p className="text-xs text-amber-500">
            Running low on storage. Consider deleting unused media.
          </p>
        )}

        {/* Bulk Watermark Removal Section */}
        {soraVideosEligible.length > 0 && (
          <div className="pt-3 border-t border-border/50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-gold" />
                <span className="text-sm font-medium">Sora 2 Watermark Removal</span>
                <Badge variant="outline" className="text-xs">
                  {soraVideosEligible.length} eligible
                </Badge>
              </div>
              
              {!selectionMode ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectionMode(true)}
                  className="gap-2"
                >
                  <CheckSquare className="h-4 w-4" />
                  Select Videos
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={selectAllSora}
                    disabled={selectedIds.size === soraVideosEligible.length}
                  >
                    Select All ({soraVideosEligible.length})
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearSelection}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {selectionMode && selectedSoraVideos.length > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-gold/10 border border-gold/30 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{selectedSoraVideos.length} selected</span>
                  <Badge variant="outline" className="gap-1">
                    <Coins className="h-3 w-3" />
                    {getCost() * selectedSoraVideos.length} credits
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="cinematic"
                  onClick={handleBulkWatermarkRemoval}
                  disabled={isBulkProcessing || !canAfford()}
                  className="gap-2"
                >
                  {isBulkProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Droplets className="h-4 w-4" />
                      Remove All Watermarks
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
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
            {filteredHistory.map((item) => {
              const isSoraEligible = item.media_type === "video" && 
                item.model_used?.includes("sora") && 
                !item.model_used?.includes("watermark-remover") &&
                item.status === "completed" &&
                item.media_url;
              const isSelected = selectedIds.has(item.id);
              
              return (
                <div
                  key={item.id}
                  className={`group relative rounded-lg border overflow-hidden transition-colors cursor-pointer ${
                    isSelected ? "border-gold ring-2 ring-gold/50" : "border-border/50 hover:border-primary/50"
                  }`}
                  onClick={() => {
                    if (selectionMode && isSoraEligible) {
                      toggleSelection(item.id);
                    } else if (item.status === "completed" && item.media_url) {
                      setLightboxMedia(item);
                    }
                  }}
                >
                  {/* Selection Checkbox for Sora videos */}
                  {selectionMode && isSoraEligible && (
                    <div 
                      className="absolute top-2 right-2 z-10"
                      onClick={(e) => toggleSelection(item.id, e)}
                    >
                      <Checkbox 
                        checked={isSelected}
                        className="h-5 w-5 bg-black/60 border-white data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                      />
                    </div>
                  )}
                  
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-muted">
                    {item.status === "completed" && item.media_url ? (
                      item.media_type === "image" ? (
                        <img src={item.media_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <video src={item.media_url} className="w-full h-full object-cover" />
                      )
                    ) : item.status === "processing" ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 group">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Processing...</span>
                      {/* Delete button for processing items */}
                      <Button
                        size="sm"
                        variant="destructive"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item, e);
                        }}
                        disabled={isDeleting === item.id}
                      >
                        {isDeleting === item.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </>
                        )}
                      </Button>
                    </div>
                  ) : item.status === "failed" ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 group">
                      <AlertCircle className="h-6 w-6 text-destructive" />
                      <span className="text-xs text-destructive">Failed</span>
                      {/* Delete button for failed items */}
                      <Button
                        size="sm"
                        variant="destructive"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item, e);
                        }}
                        disabled={isDeleting === item.id}
                      >
                        {isDeleting === item.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 group">
                      {item.media_type === "image" ? (
                        <Image className="h-6 w-6 text-muted-foreground" />
                      ) : (
                        <Video className="h-6 w-6 text-muted-foreground" />
                      )}
                      {/* Delete button for pending items */}
                      <Button
                        size="sm"
                        variant="destructive"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item, e);
                        }}
                        disabled={isDeleting === item.id}
                      >
                        {isDeleting === item.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  
                  {/* Type Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-black/60 text-white capitalize">
                      {item.media_type}
                    </span>
                  </div>

                {/* Hover Overlay with Actions */}
                  {item.status === "completed" && item.media_url && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <span className="text-white text-sm font-medium">Click to preview</span>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 px-2"
                          onClick={(e) => handleDownload(item, e)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 px-2"
                          onClick={(e) => handleDelete(item, e)}
                          disabled={isDeleting === item.id}
                        >
                          {isDeleting === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
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
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
