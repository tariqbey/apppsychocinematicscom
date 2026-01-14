import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image, Video, Clock, AlertCircle, Loader2, Download, Trash2, HardDrive, X, ChevronLeft, ChevronRight, RefreshCw, Mic2, Clapperboard, Music, Plus, ArrowUpDown } from "lucide-react";
import { useMediaGeneration, GeneratedMedia } from "@/hooks/useMediaGeneration";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { VoiceChanger } from "./VoiceChanger";

interface MediaLibraryProps {
  filter?: "image" | "video" | "all";
  onSelect?: (media: GeneratedMedia) => void;
  onAddToTimeline?: (media: GeneratedMedia) => void;
  onAddMultipleToTimeline?: (media: GeneratedMedia[]) => void;
}

const MAX_STORAGE_BYTES = 5 * 1024 * 1024 * 1024; // 5GB

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function MediaLibrary({ filter = "all", onSelect, onAddToTimeline, onAddMultipleToTimeline }: MediaLibraryProps) {
  const [history, setHistory] = useState<GeneratedMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageUsed, setStorageUsed] = useState(0);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [lightboxMedia, setLightboxMedia] = useState<GeneratedMedia | null>(null);
  const [showVoiceChanger, setShowVoiceChanger] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"date" | "type">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState<"all" | "video" | "image" | "audio">("all");
  const { fetchGenerationHistory } = useMediaGeneration();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

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

  // Apply both prop filter and local filterType
  const baseFiltered = filter === "all" 
    ? history 
    : history.filter(item => item.media_type === filter);
  
  const filteredHistory = filterType === "all" 
    ? baseFiltered 
    : baseFiltered.filter(item => item.media_type === filterType);

  // Sort the filtered history
  const sortedHistory = useMemo(() => {
    const sorted = [...filteredHistory].sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      } else {
        // Sort by type: video > image > audio
        const typeOrder = { video: 0, image: 1, audio: 2 };
        const typeA = typeOrder[a.media_type as keyof typeof typeOrder] ?? 3;
        const typeB = typeOrder[b.media_type as keyof typeof typeOrder] ?? 3;
        if (typeA !== typeB) {
          return sortOrder === "desc" ? typeA - typeB : typeB - typeA;
        }
        // Secondary sort by date
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      }
    });
    return sorted;
  }, [filteredHistory, sortBy, sortOrder]);

  const completedMedia = sortedHistory.filter(item => item.status === "completed" && item.media_url);

  // Toggle selection
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

  // Clear selection
  const clearSelection = () => setSelectedIds(new Set());

  // Get selected media items
  const selectedMedia = completedMedia.filter(m => selectedIds.has(m.id));

  // Handle adding all selected to timeline
  const handleAddSelectedToTimeline = () => {
    if (selectedMedia.length === 0) return;
    
    if (onAddMultipleToTimeline) {
      onAddMultipleToTimeline(selectedMedia);
      clearSelection();
      toast({
        title: "Added to Timeline",
        description: `${selectedMedia.length} item(s) added to timeline`,
      });
    } else if (onAddToTimeline) {
      // Fallback: add one by one
      selectedMedia.forEach(m => onAddToTimeline(m));
      clearSelection();
      toast({
        title: "Added to Timeline",
        description: `${selectedMedia.length} item(s) added to timeline`,
      });
    }
  };

  const currentIndex = lightboxMedia ? completedMedia.findIndex(m => m.id === lightboxMedia.id) : -1;

  const navigateLightbox = (direction: "prev" | "next") => {
    if (currentIndex === -1) return;
    const newIndex = direction === "prev" 
      ? (currentIndex - 1 + completedMedia.length) % completedMedia.length
      : (currentIndex + 1) % completedMedia.length;
    setLightboxMedia(completedMedia[newIndex]);
  };

  const storagePercentage = (storageUsed / MAX_STORAGE_BYTES) * 100;

  // Select all/none
  const toggleSelectAll = () => {
    if (selectedIds.size === completedMedia.length) {
      clearSelection();
    } else {
      setSelectedIds(new Set(completedMedia.map(m => m.id)));
    }
  };

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
                    {/* Add to Timeline Button */}
                    {onAddToTimeline && (
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-primary text-primary-foreground"
                        onClick={() => {
                          onAddToTimeline(lightboxMedia);
                          setLightboxMedia(null);
                        }}
                      >
                        <Clapperboard className="h-4 w-4 mr-2" />
                        Add to Timeline
                      </Button>
                    )}
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

      {/* Storage Indicator */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-2">
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
      </div>

      {/* Selection & Sort Controls */}
      {completedMedia.length > 0 && (
        <div className="flex items-center justify-between gap-2 py-2">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedIds.size === completedMedia.length && completedMedia.length > 0}
              onCheckedChange={toggleSelectAll}
              aria-label="Select all"
            />
            <span className="text-xs text-muted-foreground">
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
            </span>
            {selectedIds.size > 0 && (onAddToTimeline || onAddMultipleToTimeline) && (
              <Button
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleAddSelectedToTimeline}
              >
                <Plus className="h-3 w-3" />
                Add {selectedIds.size} to Timeline
              </Button>
            )}
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={clearSelection}
              >
                Clear
              </Button>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Filter by type */}
            <Select value={filterType} onValueChange={(v) => setFilterType(v as "all" | "video" | "image" | "audio")}>
              <SelectTrigger className="h-7 w-20 text-xs">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
              </SelectContent>
            </Select>
            {/* Sort by */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as "date" | "type")}>
              <SelectTrigger className="h-7 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
              title={sortOrder === "desc" ? "Newest first" : "Oldest first"}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {sortedHistory.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No generations yet</p>
          <p className="text-sm">Your AI creations will appear here</p>
        </div>
      ) : (
        <ScrollArea className="h-[350px]">
          <div className="grid grid-cols-2 gap-3 pr-4">
            {sortedHistory.map((item) => (
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
                  
                  {/* Selection Checkbox & Type Badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    {item.status === "completed" && item.media_url && (
                      <div 
                        className="bg-black/60 rounded p-0.5"
                        onClick={(e) => toggleSelection(item.id, e)}
                      >
                        <Checkbox
                          checked={selectedIds.has(item.id)}
                          className="h-4 w-4 border-white/70 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </div>
                    )}
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
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
