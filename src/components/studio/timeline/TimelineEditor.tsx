import { useState, useRef, useCallback, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
  Upload,
  Music,
  Trash2,
  Download,
  Loader2,
  FolderOpen,
  Plus,
  X,
  Volume2,
  VolumeX,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTimelineEditor, TimelineClip } from "@/hooks/useTimelineEditor";
import { useTimelineExport } from "@/hooks/useTimelineExport";
import { useMediaGeneration, GeneratedMedia } from "@/hooks/useMediaGeneration";
import { useTimelineClipboard } from "@/hooks/useTimelineClipboard";
import { useTimelineKeyboard } from "@/hooks/useTimelineKeyboard";
import { useTimelineSnapping } from "@/hooks/useTimelineSnapping";
import { useToast } from "@/hooks/use-toast";
import { TimelineTrackComponent } from "./TimelineTrackComponent";
import { TimelineRuler } from "./TimelineRuler";
import { TimelinePreview } from "./TimelinePreview";
import { AudioWaveform } from "./AudioWaveform";
import { TimelineToolbar, EditingTool } from "./TimelineToolbar";
import { SaveToVaultDialog } from "./SaveToVaultDialog";
import { cn } from "@/lib/utils";

interface SnapInfo {
  time: number;
  type: "clip-start" | "clip-end" | "playhead" | "grid";
}

interface TimelineEditorProps {
  onExport?: (url: string) => void;
}

export function TimelineEditor({ onExport }: TimelineEditorProps) {
  const {
    state,
    addClip,
    removeClip,
    updateClip,
    moveClip,
    trimClip,
    splitClip,
    addClips,
    play,
    pause,
    togglePlayback,
    seek,
    setZoom,
    setBackgroundAudio,
    setBackgroundAudioVolume,
    toggleBackgroundAudioMute,
    toggleTrackMute,
    toggleTrackLock,
    clearTimeline,
    addTransition,
    updateTransition,
    removeTransition,
    undo,
    redo,
    canUndo,
    canRedo,
    MAX_DURATION,
  } = useTimelineEditor();

  const { exportTimeline, isExporting, progress: exportProgress, cancelExport } = useTimelineExport();
  const { fetchGenerationHistory } = useMediaGeneration();
  const { copy, paste, duplicate, hasClipboard } = useTimelineClipboard();
  const { toast } = useToast();

  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState<EditingTool>("select");
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [mediaLibrary, setMediaLibrary] = useState<GeneratedMedia[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [rangeSelection, setRangeSelection] = useState<{ start: number; end: number } | null>(null);
  const [snapPreviewLines, setSnapPreviewLines] = useState<SnapInfo[]>([]);
  const [showSaveToVault, setShowSaveToVault] = useState(false);
  const [lastExportedUrl, setLastExportedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Snapping hook
  const { snapTime } = useTimelineSnapping({
    clips: state.clips,
    currentTime: state.currentTime,
    gridInterval: 1,
    snapThreshold: 10,
    zoom: state.zoom,
    enabled: snapEnabled,
  });

  // Handle snap preview lines
  const handleSnapPreview = useCallback((lines: SnapInfo[]) => {
    setSnapPreviewLines(lines);
  }, []);

  // Get selected clips
  const selectedClips = state.clips.filter(c => selectedClipIds.includes(c.id));
  const hasSelection = selectedClipIds.length > 0;

  // Handle clip selection (supports multi-select with shift/cmd)
  const handleClipSelect = useCallback((clipId: string, addToSelection: boolean = false) => {
    if (activeTool === "razor") {
      // In razor mode, split the clip at the current time
      const clip = state.clips.find(c => c.id === clipId);
      if (clip && state.currentTime > clip.startTime && state.currentTime < clip.startTime + clip.duration) {
        splitClip(clipId, state.currentTime);
        toast({ title: "Clip split", description: "Clip was cut at playhead" });
      }
      return;
    }

    if (addToSelection) {
      setSelectedClipIds(prev => 
        prev.includes(clipId) 
          ? prev.filter(id => id !== clipId)
          : [...prev, clipId]
      );
    } else {
      setSelectedClipIds([clipId]);
    }
  }, [activeTool, state.clips, state.currentTime, splitClip, toast]);

  // Clear selection when clicking empty area
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedClipIds([]);
      setRangeSelection(null);
    }
  }, []);

  // Copy selected clips
  const handleCopy = useCallback(() => {
    if (selectedClips.length > 0) {
      copy(selectedClips);
      toast({ title: "Copied", description: `${selectedClips.length} clip(s) copied` });
    }
  }, [selectedClips, copy, toast]);

  // Paste clips
  const handlePaste = useCallback(() => {
    const newClips = paste(state.currentTime);
    if (newClips.length > 0) {
      addClips(newClips);
      setSelectedClipIds(newClips.map(c => c.id));
      toast({ title: "Pasted", description: `${newClips.length} clip(s) pasted` });
    }
  }, [paste, state.currentTime, addClips, toast]);

  // Delete selected clips
  const handleDelete = useCallback(() => {
    if (selectedClipIds.length > 0) {
      selectedClipIds.forEach(id => removeClip(id));
      setSelectedClipIds([]);
      toast({ title: "Deleted", description: `${selectedClipIds.length} clip(s) deleted` });
    }
  }, [selectedClipIds, removeClip, toast]);

  // Duplicate selected clips
  const handleDuplicate = useCallback(() => {
    if (selectedClips.length > 0) {
      const newClips = duplicate(selectedClips);
      addClips(newClips);
      setSelectedClipIds(newClips.map(c => c.id));
      toast({ title: "Duplicated", description: `${selectedClips.length} clip(s) duplicated` });
    }
  }, [selectedClips, duplicate, addClips, toast]);

  // Split at playhead
  const handleSplitAtPlayhead = useCallback(() => {
    // Find clips that span the current time
    const clipsAtPlayhead = state.clips.filter(
      c => state.currentTime > c.startTime && state.currentTime < c.startTime + c.duration
    );
    
    if (clipsAtPlayhead.length > 0) {
      clipsAtPlayhead.forEach(c => splitClip(c.id, state.currentTime));
      toast({ title: "Split", description: `${clipsAtPlayhead.length} clip(s) split at playhead` });
    }
  }, [state.clips, state.currentTime, splitClip, toast]);

  // Keyboard shortcuts
  useTimelineKeyboard({
    onToolChange: setActiveTool,
    onSnapToggle: () => setSnapEnabled(prev => !prev),
    onPlayPause: togglePlayback,
    onUndo: undo,
    onRedo: redo,
    onCopy: handleCopy,
    onPaste: handlePaste,
    onDelete: handleDelete,
    onDuplicate: handleDuplicate,
    onSplit: handleSplitAtPlayhead,
    onSeekStart: () => seek(0),
    onSeekEnd: () => seek(state.duration),
    onNudgeLeft: () => seek(Math.max(0, state.currentTime - (snapEnabled ? 1 : 0.1))),
    onNudgeRight: () => seek(Math.min(state.duration, state.currentTime + (snapEnabled ? 1 : 0.1))),
    enabled: true,
  });

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if we're leaving the container entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    // Process dropped files
    for (const file of Array.from(files)) {
      const isAudio = file.type.startsWith("audio/");
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");

      if (!isAudio && !isVideo && !isImage) {
        toast({
          title: "Unsupported file type",
          description: `${file.name} is not a supported media file`,
          variant: "destructive",
        });
        continue;
      }

      const url = URL.createObjectURL(file);

      if (isAudio) {
        // Set as background audio
        setBackgroundAudio(url, file.name);
        toast({
          title: "Background audio added",
          description: file.name,
        });
      } else {
        // Determine type and duration
        const type = isVideo ? "video" : "image";
        let duration = 5; // Default for images

        if (isVideo) {
          const mediaEl = document.createElement("video");
          mediaEl.src = url;
          await new Promise<void>((resolve) => {
            mediaEl.onloadedmetadata = () => {
              duration = mediaEl.duration;
              resolve();
            };
            mediaEl.onerror = () => resolve();
          });
        }

        // Generate thumbnail for video
        let thumbnail: string | undefined;
        if (type === "video") {
          thumbnail = await generateVideoThumbnail(url);
        }

        addClip(url, type, file.name, duration, thumbnail);
        toast({
          title: "Clip added",
          description: `${file.name} added to timeline`,
        });
      }
    }
  }, [addClip, setBackgroundAudio, toast]);

  // Load media library
  const loadMediaLibrary = useCallback(async () => {
    setIsLoadingLibrary(true);
    const history = await fetchGenerationHistory();
    setMediaLibrary(
      history.filter((m) => m.status === "completed" && m.media_url)
    );
    setIsLoadingLibrary(false);
  }, [fetchGenerationHistory]);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (files: FileList | null, isAudio: boolean = false) => {
      if (!files || files.length === 0) return;

      for (const file of Array.from(files)) {
        const url = URL.createObjectURL(file);

        if (isAudio) {
          // Set as background audio
          setBackgroundAudio(url, file.name);
          toast({
            title: "Background audio added",
            description: file.name,
          });
        } else {
          // Determine type and duration
          const type = file.type.startsWith("video/")
            ? "video"
            : file.type.startsWith("audio/")
            ? "audio"
            : "image";

          let duration = 5; // Default for images

          if (type === "video" || type === "audio") {
            const mediaEl = document.createElement(type);
            mediaEl.src = url;
            await new Promise<void>((resolve) => {
              mediaEl.onloadedmetadata = () => {
                duration = mediaEl.duration;
                resolve();
              };
              mediaEl.onerror = () => resolve();
            });
          }

          // Generate thumbnail for video
          let thumbnail: string | undefined;
          if (type === "video") {
            thumbnail = await generateVideoThumbnail(url);
          }

          addClip(url, type, file.name, duration, thumbnail);
        }
      }
    },
    [addClip, setBackgroundAudio, toast]
  );

  // Add clip from media library
  const handleAddFromLibrary = useCallback(
    async (media: GeneratedMedia) => {
      if (!media.media_url) return;

      const type = media.media_type === "image" ? "image" : "video";
      let duration = 5;

      if (type === "video") {
        const video = document.createElement("video");
        video.src = media.media_url;
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => {
            duration = video.duration;
            resolve();
          };
          video.onerror = () => resolve();
        });
      }

      // Generate thumbnail
      let thumbnail: string | undefined;
      if (type === "video") {
        thumbnail = await generateVideoThumbnail(media.media_url);
      } else {
        thumbnail = media.media_url;
      }

      addClip(media.media_url, type, media.prompt.substring(0, 30) + "...", duration, thumbnail);
      setShowMediaBrowser(false);

      toast({
        title: "Clip added",
        description: "Added to timeline",
      });
    },
    [addClip, toast]
  );

  // Handle export (download)
  const handleExport = useCallback(async () => {
    const url = await exportTimeline(
      state.clips,
      state.duration,
      state.backgroundAudio,
      { resolution: "1080p", fps: 30 }
    );

    if (url) {
      setLastExportedUrl(url);
      toast({
        title: "Export complete!",
        description: "Your video is ready to download.",
      });
      onExport?.(url);

      // Trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = `timeline-export-${Date.now()}.webm`;
      a.click();
    }
  }, [state.clips, state.duration, state.backgroundAudio, exportTimeline, onExport, toast]);

  // Handle export and save to vault
  const handleExportAndSave = useCallback(async () => {
    const url = await exportTimeline(
      state.clips,
      state.duration,
      state.backgroundAudio,
      { resolution: "1080p", fps: 30 }
    );

    if (url) {
      setLastExportedUrl(url);
      setShowSaveToVault(true);
    }
  }, [state.clips, state.duration, state.backgroundAudio, exportTimeline]);

  // Handle save to vault complete
  const handleSaveToVaultComplete = useCallback((movieId: string, savedUrl: string) => {
    toast({
      title: "Saved to Vault!",
      description: "Your Mind Movie has been saved successfully.",
    });
    // Cleanup the blob URL
    if (lastExportedUrl) {
      URL.revokeObjectURL(lastExportedUrl);
      setLastExportedUrl(null);
    }
  }, [lastExportedUrl, toast]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-display tracking-wide">Timeline Editor</h3>
          <p className="text-xs text-muted-foreground">
            Create videos up to 5 minutes • {formatTime(state.duration)} / {formatTime(MAX_DURATION)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearTimeline}
            disabled={state.clips.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={state.clips.length === 0 || isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download
              </>
            )}
          </Button>
          <Button
            onClick={handleExportAndSave}
            disabled={state.clips.length === 0 || isExporting}
            className="bg-primary text-primary-foreground"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save to Vault
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Export Progress */}
      {isExporting && exportProgress && (
        <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{exportProgress.message}</span>
            <Button variant="ghost" size="sm" onClick={cancelExport}>
              Cancel
            </Button>
          </div>
          <Progress value={exportProgress.progress} className="h-2" />
        </div>
      )}

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Preview Panel */}
        <div className="w-80 flex-shrink-0 space-y-3">
          <TimelinePreview
            clips={state.clips}
            currentTime={state.currentTime}
            isPlaying={state.isPlaying}
            backgroundAudio={state.backgroundAudio}
          />

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => seek(0)}
              title="Go to start"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={state.isPlaying ? pause : play}
              className="h-10 w-10"
            >
              {state.isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => seek(state.duration)}
              title="Go to end"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Time Display */}
          <div className="text-center text-sm font-mono text-muted-foreground">
            {formatTime(state.currentTime)} / {formatTime(state.duration)}
          </div>

          {/* Background Audio */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium flex items-center gap-2">
                <Music className="h-3 w-3" />
                Background Audio
              </span>
              {state.backgroundAudio.url && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => setBackgroundAudio(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            {state.backgroundAudio.url ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground truncate">
                  {state.backgroundAudio.name}
                </p>
                {/* Audio Waveform Visualization */}
                <div className="rounded bg-muted/50 overflow-hidden">
                  <AudioWaveform
                    src={state.backgroundAudio.url}
                    duration={state.duration || 60}
                    width={240}
                    height={32}
                    color={state.backgroundAudio.muted ? "hsl(var(--muted-foreground))" : "hsl(var(--primary))"}
                    backgroundColor="transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={toggleBackgroundAudioMute}
                  >
                    {state.backgroundAudio.muted ? (
                      <VolumeX className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <Volume2 className="h-3 w-3 text-primary" />
                    )}
                  </Button>
                  <Slider
                    value={[state.backgroundAudio.volume * 100]}
                    onValueChange={([v]) => setBackgroundAudioVolume(v / 100)}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => audioInputRef.current?.click()}
              >
                <Upload className="h-3 w-3 mr-2" />
                Add Audio Track
              </Button>
            )}
          </div>
        </div>

        {/* Timeline Panel */}
        <div 
          className={cn(
            "flex-1 flex flex-col min-w-0 border rounded-lg overflow-hidden transition-all",
            isDragOver 
              ? "border-primary border-2 bg-primary/5" 
              : "border-border/50"
          )}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Editing Tools Toolbar */}
          <div className="flex items-center gap-2 p-2 border-b border-border/50 bg-card/50">
            <TimelineToolbar
              activeTool={activeTool}
              onToolChange={setActiveTool}
              snapEnabled={snapEnabled}
              onSnapToggle={() => setSnapEnabled(prev => !prev)}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={undo}
              onRedo={redo}
              hasSelection={hasSelection}
              hasClipboard={hasClipboard}
              onCopy={handleCopy}
              onPaste={handlePaste}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />

            <div className="flex-1" />

            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
            <Dialog open={showMediaBrowser} onOpenChange={setShowMediaBrowser}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    loadMediaLibrary();
                    setShowMediaBrowser(true);
                  }}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Gallery
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[70vh]">
                <DialogHeader>
                  <DialogTitle>Add from Gallery</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[50vh]">
                  {isLoadingLibrary ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : mediaLibrary.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No media in gallery</p>
                      <p className="text-sm">Generate some images or videos first</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 p-1">
                      {mediaLibrary.map((media) => (
                        <button
                          key={media.id}
                          className="group relative aspect-video rounded-lg overflow-hidden border border-border/50 hover:border-primary transition-colors"
                          onClick={() => handleAddFromLibrary(media)}
                        >
                          {media.media_type === "image" ? (
                            <img
                              src={media.media_url!}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={media.media_url!}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Plus className="h-6 w-6 text-white" />
                          </div>
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[10px] bg-black/70 rounded text-white capitalize">
                            {media.media_type}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>

            <div className="flex-1" />

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoom(state.zoom - 10)}
                disabled={state.zoom <= 10}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground w-12 text-center">
                {Math.round(state.zoom)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoom(state.zoom + 10)}
                disabled={state.zoom >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Timeline Content */}
          <ScrollArea className="flex-1" ref={timelineRef}>
            <div style={{ width: `${Math.max(state.duration, 60) * state.zoom + 200}px` }}>
              {/* Ruler */}
              <div className="ml-32">
                <TimelineRuler
                  duration={state.duration}
                  zoom={state.zoom}
                  currentTime={state.currentTime}
                  onSeek={seek}
                />
              </div>

              {/* Tracks */}
              {state.tracks.map((track) => (
                <TimelineTrackComponent
                  key={track.id}
                  track={track}
                  clips={state.clips.filter((c) => c.trackId === track.id)}
                  transitions={state.transitions}
                  zoom={state.zoom}
                  currentTime={state.currentTime}
                  selectedClipIds={selectedClipIds}
                  onSelectClip={handleClipSelect}
                  onClearSelection={() => setSelectedClipIds([])}
                  onRemoveClip={removeClip}
                  onMoveClip={moveClip}
                  onTrimClip={trimClip}
                  onSplitClip={(clipId) => splitClip(clipId, state.currentTime)}
                  onToggleClipMute={(clipId) =>
                    updateClip(clipId, {
                      muted: !state.clips.find((c) => c.id === clipId)?.muted,
                    })
                  }
                  onToggleTrackMute={() => toggleTrackMute(track.id)}
                  onToggleTrackLock={() => toggleTrackLock(track.id)}
                  onAddTransition={addTransition}
                  onUpdateTransition={updateTransition}
                  onRemoveTransition={removeTransition}
                  snapEnabled={snapEnabled}
                  onSnapPreview={handleSnapPreview}
                  snapTime={snapTime}
                />
              ))}

              {/* Snap indicator lines */}
              {snapPreviewLines.map((line, index) => (
                <div
                  key={`snap-${index}-${line.time}`}
                  className={cn(
                    "absolute top-6 bottom-0 w-0.5 pointer-events-none z-20 transition-opacity",
                    line.type === "playhead" && "bg-primary",
                    line.type === "clip-start" && "bg-amber-400",
                    line.type === "clip-end" && "bg-amber-400",
                    line.type === "grid" && "bg-muted-foreground/50"
                  )}
                  style={{ left: `${line.time * state.zoom + 128}px` }}
                >
                  {/* Snap indicator dot at top */}
                  <div
                    className={cn(
                      "absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full",
                      line.type === "playhead" && "bg-primary",
                      line.type === "clip-start" && "bg-amber-400",
                      line.type === "clip-end" && "bg-amber-400",
                      line.type === "grid" && "bg-muted-foreground/50"
                    )}
                  />
                </div>
              ))}

              {/* Playhead */}
              <div
                className="absolute top-6 bottom-0 w-0.5 bg-primary z-10 pointer-events-none"
                style={{ left: `${state.currentTime * state.zoom + 128}px` }}
              />

              {/* Empty state / Drop zone indicator */}
              {state.clips.length === 0 && !isDragOver && (
                <div className="absolute inset-0 flex items-center justify-center ml-32 mt-6">
                  <div className="text-center text-muted-foreground p-8">
                    <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium">Drop clips here to start</p>
                    <p className="text-sm">Or use the Upload/Gallery buttons above</p>
                  </div>
                </div>
              )}

              {/* Active drag overlay */}
              {isDragOver && (
                <div className="absolute inset-0 flex items-center justify-center ml-32 mt-6 bg-primary/10 border-2 border-dashed border-primary rounded-lg z-20">
                  <div className="text-center p-8">
                    <Upload className="h-12 w-12 mx-auto mb-3 text-primary animate-bounce" />
                    <p className="font-medium text-primary text-lg">Drop files here</p>
                    <p className="text-sm text-muted-foreground">Video, image, or audio files</p>
                  </div>
                </div>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files, true)}
      />

      {/* Save to Vault Dialog */}
      <SaveToVaultDialog
        open={showSaveToVault}
        onOpenChange={setShowSaveToVault}
        exportedBlobUrl={lastExportedUrl}
        onSaveComplete={handleSaveToVaultComplete}
      />
    </div>
  );
}

// Helper to generate video thumbnail
async function generateVideoThumbnail(videoUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.src = videoUrl;
    video.crossOrigin = "anonymous";
    video.currentTime = 0.5;

    video.onloadeddata = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 90;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      } else {
        resolve("");
      }
    };

    video.onerror = () => resolve("");
  });
}
