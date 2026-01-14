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
  FileDown,
  GripHorizontal,
  Scissors,
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
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useTimelineEditor, TimelineClip } from "@/hooks/useTimelineEditor";
import { useTimelineExport } from "@/hooks/useTimelineExport";
import { useMediaGeneration, GeneratedMedia } from "@/hooks/useMediaGeneration";
import { useTimelineClipboard } from "@/hooks/useTimelineClipboard";
import { useTimelineKeyboard } from "@/hooks/useTimelineKeyboard";
import { useTimelineSnapping } from "@/hooks/useTimelineSnapping";
import { useTimelineProjects } from "@/hooks/useTimelineProjects";
import { useToast } from "@/hooks/use-toast";
import { TimelineTrackComponent } from "./TimelineTrackComponent";
import { TimelineRuler } from "./TimelineRuler";
import { TimelinePreview } from "./TimelinePreview";
import { AudioWaveform } from "./AudioWaveform";
import { MediaLibrary } from "@/components/studio/MediaLibrary";
import { TimelineToolbar, EditingTool } from "./TimelineToolbar";
import { SaveToVaultDialog } from "./SaveToVaultDialog";
import { SaveProjectDialog } from "./SaveProjectDialog";
import { LoadProjectDialog } from "./LoadProjectDialog";
import { TimelineMinimap } from "./TimelineMinimap";
import { FilmstripScrubber } from "./FilmstripScrubber";
import { ClipsBin } from "./ClipsBin";
import { cn } from "@/lib/utils";

interface SnapInfo {
  time: number;
  type: "clip-start" | "clip-end" | "playhead" | "grid";
}

interface TimelineImportData {
  scenes: Array<{
    order: number;
    title: string;
    narrative: string;
    prompt: string;
    duration: number;
    emotionalTone: string;
    generatedImageUrl?: string | null;
    generatedVideoUrl?: string | null;
  }>;
  soundtrackUrl?: string | null;
  title?: string;
}

interface TimelineEditorProps {
  onExport?: (url: string) => void;
  importData?: TimelineImportData;
  onImportComplete?: () => void;
  onClose?: () => void;
  pendingMedia?: GeneratedMedia | null;
  pendingMediaItems?: GeneratedMedia[] | null;
  onPendingMediaAdded?: () => void;
  onPendingMediaItemsAdded?: () => void;
}

export function TimelineEditor({
  onExport,
  importData,
  onImportComplete,
  onClose,
  pendingMedia,
  pendingMediaItems,
  onPendingMediaAdded,
  onPendingMediaItemsAdded,
}: TimelineEditorProps) {
  const {
    state,
    addClip,
    removeClip,
    updateClip,
    moveClip,
    trimClip,
    splitClip,
    addClips,
    addMultipleClips,
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
    toggleTrackSolo,
    setTrackVolume,
    addTrack,
    removeTrack,
    reorderTrack,
    setMasterVolume,
    clearTimeline,
    loadTimelineState,
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
  const { 
    projects, 
    isLoading: isLoadingProjects, 
    isSaving, 
    fetchProjects, 
    saveProject, 
    updateProject, 
    deleteProject, 
    loadProject 
  } = useTimelineProjects();
  const { toast } = useToast();

  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState<EditingTool>("select");
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [rangeSelection, setRangeSelection] = useState<{ start: number; end: number } | null>(null);
  const [snapPreviewLines, setSnapPreviewLines] = useState<SnapInfo[]>([]);
  const [showSaveToVault, setShowSaveToVault] = useState(false);
  const [razorPreviewX, setRazorPreviewX] = useState<number | null>(null);
  const [lastExportedUrl, setLastExportedUrl] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 60 });
  const [draggingTrackId, setDraggingTrackId] = useState<string | null>(null);
  const [dragOverTrackIndex, setDragOverTrackIndex] = useState<number | null>(null);
  const [showSaveProjectDialog, setShowSaveProjectDialog] = useState(false);
  const [showLoadProjectDialog, setShowLoadProjectDialog] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectTitle, setCurrentProjectTitle] = useState<string>("");
  const [showClipsBin, setShowClipsBin] = useState(false);
  const hasImportedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Update visible range when scrolling
  const updateVisibleRange = useCallback(() => {
    const scrollEl = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollEl && state.duration > 0) {
      const scrollLeft = scrollEl.scrollLeft;
      const containerWidth = scrollEl.clientWidth;
      const pixelsPerSecond = state.zoom * 10;
      const start = scrollLeft / pixelsPerSecond;
      const end = start + containerWidth / pixelsPerSecond;
      setVisibleRange({ start, end: Math.min(end, state.duration) });
    }
  }, [state.zoom, state.duration]);

  // Scroll to a specific time in the timeline
  const scrollToTime = useCallback((time: number) => {
    const scrollEl = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollEl) {
      const pixelsPerSecond = state.zoom * 10;
      const scrollLeft = time * pixelsPerSecond - scrollEl.clientWidth / 2;
      scrollEl.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
  }, [state.zoom]);

  // Auto-import Mind Movie scenes when importData is provided
  useEffect(() => {
    if (!importData || hasImportedRef.current || isImporting) return;
    
    const importMindMovieScenes = async () => {
      hasImportedRef.current = true;
      setIsImporting(true);
      setImportProgress(0);
      
      // Clear existing timeline first
      clearTimeline();
      
      const { scenes, soundtrackUrl, title } = importData;
      const validScenes = scenes.filter(scene => 
        scene.generatedVideoUrl || scene.generatedImageUrl
      );
      
      if (validScenes.length === 0) {
        toast({
          title: "No media to import",
          description: "Generate images or videos for your scenes first",
          variant: "destructive",
        });
        setIsImporting(false);
        onImportComplete?.();
        return;
      }

      toast({
        title: "Importing Mind Movie",
        description: `Adding ${validScenes.length} scene(s) to timeline...`,
      });

      // Sort scenes by order
      const sortedScenes = [...validScenes].sort((a, b) => a.order - b.order);
      
      for (let i = 0; i < sortedScenes.length; i++) {
        const scene = sortedScenes[i];
        const mediaUrl = scene.generatedVideoUrl || scene.generatedImageUrl;
        const isVideo = !!scene.generatedVideoUrl;
        
        if (!mediaUrl) continue;

        try {
          // Determine duration
          let duration = scene.duration || 5;
          let thumbnail: string | undefined;

          if (isVideo) {
            // Load video to get actual duration and thumbnail
            const video = document.createElement("video");
            video.crossOrigin = "anonymous";
            video.src = mediaUrl;
            
            await new Promise<void>((resolve) => {
              video.onloadedmetadata = () => {
                duration = video.duration || scene.duration || 5;
                resolve();
              };
              video.onerror = () => resolve();
              setTimeout(resolve, 3000); // Timeout after 3s
            });

            // Generate thumbnail
            thumbnail = await generateVideoThumbnail(mediaUrl);
          } else {
            // For images, use the image itself as thumbnail
            thumbnail = mediaUrl;
            duration = scene.duration || 5;
          }

          // Add clip to timeline
          await addClip(
            mediaUrl,
            isVideo ? "video" : "image",
            scene.title || `Scene ${scene.order}`,
            duration,
            thumbnail
          );

          setImportProgress(((i + 1) / sortedScenes.length) * 100);
        } catch (error) {
          console.error(`Error importing scene ${scene.order}:`, error);
        }
      }

      // Add soundtrack as background audio if available
      if (soundtrackUrl) {
        setBackgroundAudio(soundtrackUrl, title ? `${title} Soundtrack` : "Mind Movie Soundtrack");
        toast({
          title: "Soundtrack added",
          description: "Background audio has been added to the timeline",
        });
      }

      setIsImporting(false);
      setImportProgress(100);
      
      toast({
        title: "Import complete!",
        description: `${sortedScenes.length} scene(s) added to timeline${soundtrackUrl ? " with soundtrack" : ""}`,
      });
      
      onImportComplete?.();
    };

    importMindMovieScenes();
  }, [importData, addClip, clearTimeline, setBackgroundAudio, toast, onImportComplete, isImporting]);

  // Handle pending media batch from the Edit Bay gallery
  useEffect(() => {
    if (!pendingMediaItems || pendingMediaItems.length === 0) return;

    let cancelled = false;

    const addPendingMediaItems = async () => {
      try {
        const clipsData: Array<{
          sourceUrl: string;
          type: "video" | "audio" | "image";
          name: string;
          sourceDuration: number;
          thumbnail?: string;
        }> = [];

        for (const media of pendingMediaItems) {
          if (!media?.media_url) continue;

          const type: "video" | "audio" | "image" =
            media.media_type === "audio"
              ? "audio"
              : media.media_type === "image"
                ? "image"
                : "video";

          // Default duration so we still add clips even if metadata fails.
          let duration = type === "image" ? 5 : 5;

          if (type === "video") {
            const video = document.createElement("video");
            video.preload = "metadata";
            video.crossOrigin = "anonymous";
            video.src = media.media_url;
            await new Promise<void>((resolve) => {
              video.onloadedmetadata = () => {
                duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : duration;
                resolve();
              };
              video.onerror = () => resolve();
              setTimeout(resolve, 2500);
            });
          } else if (type === "audio") {
            const audio = document.createElement("audio");
            audio.preload = "metadata";
            audio.crossOrigin = "anonymous";
            audio.src = media.media_url;
            await new Promise<void>((resolve) => {
              audio.onloadedmetadata = () => {
                duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : duration;
                resolve();
              };
              audio.onerror = () => resolve();
              setTimeout(resolve, 2500);
            });
          }

          let thumbnail: string | undefined;
          if (type === "video") {
            try {
              thumbnail = await generateVideoThumbnail(media.media_url);
            } catch {
              thumbnail = undefined;
            }
          } else if (type === "image") {
            thumbnail = media.media_url;
          }

          clipsData.push({
            sourceUrl: media.media_url,
            type,
            name: media.prompt?.substring(0, 30) + "..." || "Clip",
            sourceDuration: duration,
            thumbnail,
          });
        }

        if (cancelled) return;

        if (clipsData.length > 0) {
          addMultipleClips(clipsData);
          toast({
            title: "Clips added",
            description: `${clipsData.length} item(s) added to timeline`,
          });
        }
      } finally {
        if (!cancelled) onPendingMediaItemsAdded?.();
      }
    };

    addPendingMediaItems();

    return () => {
      cancelled = true;
    };
  }, [pendingMediaItems, addMultipleClips, toast, onPendingMediaItemsAdded]);

  // Handle pending single media from the Edit Bay gallery / lightbox
  useEffect(() => {
    if (!pendingMedia || !pendingMedia.media_url) return;

    let cancelled = false;

    const addPendingMedia = async () => {
      const type: "video" | "audio" | "image" =
        pendingMedia.media_type === "audio"
          ? "audio"
          : pendingMedia.media_type === "image"
            ? "image"
            : "video";

      let duration = type === "image" ? 5 : 5;
      let thumbnail: string | undefined;

      if (type === "video") {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.crossOrigin = "anonymous";
        video.src = pendingMedia.media_url!;

        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => {
            duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : duration;
            resolve();
          };
          video.onerror = () => resolve();
          setTimeout(resolve, 2500);
        });

        try {
          thumbnail = await generateVideoThumbnail(pendingMedia.media_url!);
        } catch {
          thumbnail = undefined;
        }
      } else if (type === "image") {
        thumbnail = pendingMedia.media_url!;
      } else {
        // audio: no thumbnail
        thumbnail = undefined;

        const audio = document.createElement("audio");
        audio.preload = "metadata";
        audio.crossOrigin = "anonymous";
        audio.src = pendingMedia.media_url!;

        await new Promise<void>((resolve) => {
          audio.onloadedmetadata = () => {
            duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : duration;
            resolve();
          };
          audio.onerror = () => resolve();
          setTimeout(resolve, 2500);
        });
      }

      if (cancelled) return;

      await addClip(
        pendingMedia.media_url!,
        type,
        pendingMedia.prompt?.slice(0, 30) || `${pendingMedia.media_type} clip`,
        duration,
        thumbnail
      );

      toast({
        title: "Added to Timeline",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} has been added to your timeline.`,
      });

      onPendingMediaAdded?.();
    };

    addPendingMedia();

    return () => {
      cancelled = true;
    };
  }, [pendingMedia, addClip, toast, onPendingMediaAdded]);

  // Snapping hook
  const { snapTime } = useTimelineSnapping({
    clips: state.clips,
    currentTime: state.currentTime,
    gridInterval: 1,
    snapThreshold: 10,
    zoom: state.zoom,
    enabled: snapEnabled,
  });

  // Update visible range on scroll and zoom
  useEffect(() => {
    const scrollEl = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollEl) {
      const handleScroll = () => updateVisibleRange();
      scrollEl.addEventListener('scroll', handleScroll);
      updateVisibleRange(); // Initial update
      return () => scrollEl.removeEventListener('scroll', handleScroll);
    }
  }, [updateVisibleRange]);

  // Update visible range when zoom changes
  useEffect(() => {
    updateVisibleRange();
  }, [state.zoom, updateVisibleRange]);

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

  // Add audio via keyboard shortcut
  const handleAddAudioShortcut = useCallback(() => {
    audioInputRef.current?.click();
  }, []);

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
    onAddAudio: handleAddAudioShortcut,
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

      // Determine type and duration
      const type = isAudio ? "audio" : isVideo ? "video" : "image";
      let duration = 5; // Default for images

      if (isVideo || isAudio) {
        const mediaEl = document.createElement(isVideo ? "video" : "audio");
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
  }, [addClip, setBackgroundAudio, toast]);
  // Handle file upload
  const handleFileUpload = useCallback(
    async (files: FileList | null, isAudio: boolean = false) => {
      if (!files || files.length === 0) return;

      for (const file of Array.from(files)) {
        const url = URL.createObjectURL(file);

        // Determine type and duration - always add as timeline clip
        const type = file.type.startsWith("video/")
          ? "video"
          : file.type.startsWith("audio/")
          ? "audio"
          : "image";

        let duration = 5; // Default for images

        if (type === "video" || type === "audio") {
          const mediaEl = document.createElement(type === "video" ? "video" : "audio");
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
    },
    [addClip, setBackgroundAudio, toast]
  );

  // Add clip from media library
  const handleAddFromLibrary = useCallback(
    async (media: GeneratedMedia) => {
      if (!media.media_url) return;

      // Handle audio, video, and image types
      // Note: media_type from GeneratedMedia is typically "image" | "video", 
      // but we cast to allow audio in case it's added later
      const mediaType = media.media_type as "video" | "audio" | "image";
      const type: "video" | "audio" | "image" = 
        mediaType === "audio" ? "audio" : 
        mediaType === "image" ? "image" : "video";
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
          setTimeout(resolve, 2000);
        });
      } else if (type === "audio") {
        const audio = document.createElement("audio");
        audio.src = media.media_url;
        await new Promise<void>((resolve) => {
          audio.onloadedmetadata = () => {
            duration = audio.duration;
            resolve();
          };
          audio.onerror = () => resolve();
          setTimeout(resolve, 2000);
        });
      }

      // Generate thumbnail (only for video)
      let thumbnail: string | undefined;
      if (type === "video") {
        thumbnail = await generateVideoThumbnail(media.media_url);
      } else if (type === "image") {
        thumbnail = media.media_url;
      }

      addClip(media.media_url, type, media.prompt?.substring(0, 30) + "..." || "Clip", duration, thumbnail);
      setShowMediaBrowser(false);

      toast({
        title: "Clip added",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} added to timeline`,
      });
    },
    [addClip, toast]
  );
  // Add multiple clips from media library
  const handleAddMultipleFromLibrary = useCallback(
    async (mediaItems: GeneratedMedia[]) => {
      setShowMediaBrowser(false);
      
      // Process all media items and collect clip data
      const clipsData: Array<{
        sourceUrl: string;
        type: "video" | "audio" | "image";
        name: string;
        sourceDuration: number;
        thumbnail?: string;
      }> = [];

      for (const media of mediaItems) {
        if (!media.media_url) continue;

        // Handle audio, video, and image types
        const mediaType = media.media_type as "video" | "audio" | "image";
        const type: "video" | "audio" | "image" = 
          mediaType === "audio" ? "audio" : 
          mediaType === "image" ? "image" : "video";
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
            setTimeout(resolve, 2000);
          });
        } else if (type === "audio") {
          const audio = document.createElement("audio");
          audio.src = media.media_url;
          await new Promise<void>((resolve) => {
            audio.onloadedmetadata = () => {
              duration = audio.duration;
              resolve();
            };
            audio.onerror = () => resolve();
            setTimeout(resolve, 2000);
          });
        }

        let thumbnail: string | undefined;
        if (type === "video") {
          thumbnail = await generateVideoThumbnail(media.media_url);
        } else if (type === "image") {
          thumbnail = media.media_url;
        }

        clipsData.push({
          sourceUrl: media.media_url,
          type,
          name: media.prompt?.substring(0, 30) + "..." || "Clip",
          sourceDuration: duration,
          thumbnail,
        });
      }

      // Add all clips at once to avoid race conditions
      if (clipsData.length > 0) {
        addMultipleClips(clipsData);
      }

      toast({
        title: "Clips added",
        description: `${mediaItems.length} item(s) added to timeline`,
      });
    },
    [addMultipleClips, toast]
  );

  // Handle export (download)
  const handleExport = useCallback(async () => {
    const url = await exportTimeline(
      state.clips,
      state.duration,
      state.backgroundAudio,
      { resolution: "1080p", fps: 30, tracks: state.tracks, masterVolume: state.masterVolume }
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
  }, [state.clips, state.duration, state.backgroundAudio, state.tracks, state.masterVolume, exportTimeline, onExport, toast]);

  // Handle export and save to vault
  const handleExportAndSave = useCallback(async () => {
    const url = await exportTimeline(
      state.clips,
      state.duration,
      state.backgroundAudio,
      { resolution: "1080p", fps: 30, tracks: state.tracks, masterVolume: state.masterVolume }
    );

    if (url) {
      setLastExportedUrl(url);
      setShowSaveToVault(true);
    }
  }, [state.clips, state.duration, state.backgroundAudio, state.tracks, state.masterVolume, exportTimeline]);

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

  // Handle saving project
  const handleSaveProject = useCallback(async (title: string) => {
    if (currentProjectId) {
      await updateProject(currentProjectId, title, state);
      setCurrentProjectTitle(title);
    } else {
      const newId = await saveProject(title, state);
      if (newId) {
        setCurrentProjectId(newId);
        setCurrentProjectTitle(title);
      }
    }
  }, [currentProjectId, state, saveProject, updateProject]);

  // Handle loading project
  const handleLoadProject = useCallback(async (projectId: string) => {
    const projectData = await loadProject(projectId);
    if (projectData) {
      loadTimelineState(
        projectData.tracks,
        projectData.clips,
        projectData.transitions,
        projectData.masterVolume,
        projectData.backgroundAudio
      );
      // Find the project to get its title
      const project = projects.find(p => p.id === projectId);
      setCurrentProjectId(projectId);
      setCurrentProjectTitle(project?.title || "");
      toast({
        title: "Project loaded",
        description: `"${project?.title}" has been loaded`,
      });
    }
  }, [loadProject, loadTimelineState, projects, toast]);

  // Handle delete project
  const handleDeleteProject = useCallback(async (projectId: string) => {
    await deleteProject(projectId);
    if (currentProjectId === projectId) {
      setCurrentProjectId(null);
      setCurrentProjectTitle("");
    }
  }, [deleteProject, currentProjectId]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top Bar - Header */}
      <div className="h-12 border-b border-border bg-card/80 backdrop-blur flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" title="Exit Timeline Editor">
              <X className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-display tracking-wide text-primary">Timeline Editor</h3>
            {currentProjectTitle && (
              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                {currentProjectTitle}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {formatTime(state.currentTime)} / {formatTime(state.duration)} • Max {formatTime(MAX_DURATION)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Project Management */}
          <Button variant="ghost" size="sm" onClick={() => setShowLoadProjectDialog(true)}>
            <FolderOpen className="h-4 w-4 mr-1" />
            Open
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowSaveProjectDialog(true)} 
            disabled={state.clips.length === 0 || isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileDown className="h-4 w-4 mr-1" />}
            {currentProjectId ? "Save" : "Save As"}
          </Button>

          <div className="h-5 w-px bg-border mx-1" />

          <Button variant="ghost" size="sm" onClick={clearTimeline} disabled={state.clips.length === 0}>
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={state.clips.length === 0 || isExporting}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button size="sm" onClick={handleExportAndSave} disabled={state.clips.length === 0 || isExporting} className="bg-primary text-primary-foreground">
            {isExporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save to Vault
          </Button>
        </div>
      </div>

      {/* Progress Bars */}
      {(isExporting || isImporting) && (
        <div className="px-4 py-2 bg-muted/30 border-b border-border flex-shrink-0">
          {isExporting && exportProgress && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{exportProgress.message}</span>
              <Progress value={exportProgress.progress} className="flex-1 h-2" />
              <Button variant="ghost" size="sm" onClick={cancelExport}>Cancel</Button>
            </div>
          )}
          {isImporting && (
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Importing scenes...</span>
              <Progress value={importProgress} className="flex-1 h-2" />
            </div>
          )}
        </div>
      )}

      {/* Main Content Area - Resizable */}
      <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
        {/* Preview Panel */}
        <ResizablePanel defaultSize={30} minSize={15} maxSize={50}>
          <div className="h-full border-b border-border bg-black/50 flex items-center justify-center p-2">
            <div className="h-full aspect-video max-w-full relative bg-black rounded-lg overflow-hidden shadow-xl ring-1 ring-white/10">
              <TimelinePreview
                clips={state.clips}
                tracks={state.tracks}
                currentTime={state.currentTime}
                isPlaying={state.isPlaying}
                masterVolume={state.masterVolume}
                backgroundAudio={state.backgroundAudio}
              />
              
              {/* Playback Controls Overlay */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2">
                <div className="flex items-center justify-center gap-3">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={() => seek(0)}>
                    <SkipBack className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" onClick={state.isPlaying ? pause : play} className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90">
                    {state.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={() => seek(state.duration)}>
                    <SkipForward className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>

        {/* Resize Handle */}
        <ResizableHandle className="bg-border hover:bg-primary/50 transition-colors data-[panel-group-direction=vertical]:h-1.5">
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
            <GripHorizontal className="h-3 w-3 text-muted-foreground" />
          </div>
        </ResizableHandle>

        {/* Timeline Panel */}
        <ResizablePanel defaultSize={70} minSize={40}>
          <div className="h-full flex flex-col min-h-0">
            {/* Tools Bar - Compact */}
            <div className="h-9 border-b border-border bg-card/50 flex items-center gap-1.5 px-2 flex-shrink-0 overflow-x-auto">
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

              <div className="h-5 w-px bg-border mx-1" />

              <Button variant="ghost" size="sm" className="h-8" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-3.5 w-3.5 mr-1" />
                Import
              </Button>
              
              <Button variant="ghost" size="sm" className="h-8" onClick={() => audioInputRef.current?.click()}>
                <Music className="h-3.5 w-3.5 mr-1" />
                Audio
              </Button>

              <Dialog open={showMediaBrowser} onOpenChange={setShowMediaBrowser}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8" onClick={() => setShowMediaBrowser(true)}>
                    <FolderOpen className="h-3.5 w-3.5 mr-1" />
                    Gallery
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Add from Gallery</DialogTitle>
                  </DialogHeader>
                  <MediaLibrary
                    filter="all"
                    onAddToTimeline={handleAddFromLibrary}
                    onAddMultipleToTimeline={handleAddMultipleFromLibrary}
                  />
                </DialogContent>
              </Dialog>

              <div className="flex-1" />

              {/* Background Audio */}
              {state.backgroundAudio.url && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded text-xs">
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={toggleBackgroundAudioMute}>
                    {state.backgroundAudio.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3 text-primary" />}
                  </Button>
                  <span className="truncate max-w-20 text-muted-foreground">{state.backgroundAudio.name}</span>
                  <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => setBackgroundAudio(null)}>
                    <X className="h-2.5 w-2.5" />
                  </Button>
                </div>
              )}

              <div className="h-5 w-px bg-border mx-1" />

              {/* Master Volume */}
              <div className="flex items-center gap-1.5 px-2">
                <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Master</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={state.masterVolume * 100}
                  onChange={(e) => setMasterVolume(Number(e.target.value) / 100)}
                  className="w-16 h-1.5 accent-primary cursor-pointer"
                />
                <span className="text-[10px] text-muted-foreground w-6 tabular-nums">{Math.round(state.masterVolume * 100)}</span>
              </div>

              <div className="h-5 w-px bg-border mx-1" />

              {/* Zoom */}
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(state.zoom - 10)} disabled={state.zoom <= 10}>
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <span className="text-[10px] text-muted-foreground w-8 text-center font-mono">{Math.round(state.zoom)}%</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(state.zoom + 10)} disabled={state.zoom >= 200}>
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="h-5 w-px bg-border mx-1" />

              <div className="text-[9px] text-muted-foreground flex gap-2 whitespace-nowrap">
                <span>V Select</span>
                <span>C Cut</span>
                <span>Space Play</span>
              </div>
            </div>

            {/* Timeline Section - fills remaining space */}
            <div 
              className={cn("flex-1 flex flex-col min-h-0", isDragOver && "bg-primary/5")}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
          {/* Minimap - Compact */}
          {state.clips.length > 0 && (
            <div className="h-5 border-b border-border/50 bg-card/30 px-2 flex-shrink-0">
              <TimelineMinimap
                clips={state.clips}
                duration={state.duration}
                currentTime={state.currentTime}
                visibleRange={visibleRange}
                onSeek={seek}
                onScrollTo={scrollToTime}
              />
            </div>
          )}

          {/* Clips Bin */}
          <ClipsBin
            clips={state.clips}
            selectedClipIds={selectedClipIds}
            onSelectClip={handleClipSelect}
            onRemoveClip={removeClip}
            onSeekToClip={(time) => {
              seek(time);
              scrollToTime(time);
            }}
            isOpen={showClipsBin}
            onToggle={() => setShowClipsBin(prev => !prev)}
          />

          {/* Timeline Tracks */}
          <ScrollArea className="flex-1" ref={scrollAreaRef}>
            <div 
              ref={timelineRef}
              className={cn(
                "relative min-h-full",
                activeTool === "razor" && "cursor-scissors",
                activeTool === "hand" && "cursor-grab-timeline",
                activeTool === "range" && "cursor-range"
              )}
              style={{ width: `${Math.max(state.duration, 60) * state.zoom + 150}px` }}
              onClick={handleTimelineClick}
              onMouseMove={(e) => {
                if (activeTool === "razor" && timelineRef.current) {
                  const rect = timelineRef.current.getBoundingClientRect();
                  setRazorPreviewX(e.clientX - rect.left);
                }
              }}
              onMouseLeave={() => setRazorPreviewX(null)}
            >
              {/* Razor cut preview line */}
              {activeTool === "razor" && razorPreviewX !== null && (
                <div 
                  className="razor-cut-line"
                  style={{ left: `${razorPreviewX}px` }}
                >
                  <Scissors className="absolute -top-1 -left-2.5 h-5 w-5 text-destructive drop-shadow-lg" />
                </div>
              )}
              {/* Ruler */}
              <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border/50">
                <div className="ml-20">
                  <TimelineRuler
                    duration={state.duration}
                    zoom={state.zoom}
                    currentTime={state.currentTime}
                    onSeek={seek}
                  />
                </div>
              </div>

              {/* Tracks */}
              <div className="relative">
                {state.tracks.map((track, index) => (
                  <TimelineTrackComponent
                    key={track.id}
                    track={track}
                    trackIndex={index}
                    clips={state.clips.filter((c) => c.trackId === track.id)}
                    transitions={state.transitions}
                    zoom={state.zoom}
                    currentTime={state.currentTime}
                    selectedClipIds={selectedClipIds}
                    activeTool={activeTool}
                    onSelectClip={handleClipSelect}
                    onClearSelection={() => setSelectedClipIds([])}
                    onRemoveClip={removeClip}
                    onMoveClip={moveClip}
                    onTrimClip={trimClip}
                    onSplitClip={(clipId) => splitClip(clipId, state.currentTime)}
                    onSplitClipAtTime={(clipId, time) => {
                      splitClip(clipId, time);
                      toast({ title: "Clip cut", description: "Clip was split at click position" });
                    }}
                    onToggleClipMute={(clipId) => updateClip(clipId, { muted: !state.clips.find((c) => c.id === clipId)?.muted })}
                    onUpdateClipVolume={(clipId, volume) => updateClip(clipId, { volume })}
                    onUpdateClipFade={(clipId, fadeIn, fadeOut) => updateClip(clipId, { fadeIn, fadeOut })}
                    onToggleTrackMute={() => toggleTrackMute(track.id)}
                    onToggleTrackLock={() => toggleTrackLock(track.id)}
                    onToggleTrackSolo={() => toggleTrackSolo(track.id)}
                    onSetTrackVolume={(volume) => setTrackVolume(track.id, volume)}
                    onRemoveTrack={() => removeTrack(track.id)}
                    canRemoveTrack={state.tracks.filter((t) => t.type === track.type).length > 1 && !state.clips.some((c) => c.trackId === track.id)}
                    onAddTransition={addTransition}
                    onUpdateTransition={updateTransition}
                    onRemoveTransition={removeTransition}
                    snapEnabled={snapEnabled}
                    onSnapPreview={handleSnapPreview}
                    snapTime={snapTime}
                    hasSoloedTrack={state.tracks.some((t) => t.solo)}
                    isDragging={draggingTrackId === track.id}
                    isDragOver={dragOverTrackIndex === index}
                    onDragStart={() => setDraggingTrackId(track.id)}
                    onDragEnd={() => {
                      setDraggingTrackId(null);
                      setDragOverTrackIndex(null);
                    }}
                    onDragOver={() => setDragOverTrackIndex(index)}
                    onDrop={() => {
                      if (draggingTrackId && draggingTrackId !== track.id) {
                        reorderTrack(draggingTrackId, index);
                      }
                      setDraggingTrackId(null);
                      setDragOverTrackIndex(null);
                    }}
                  />
                ))}

                {/* Add Track Buttons */}
                <div className="flex border-b border-border/50">
                  <div className="w-28 flex-shrink-0 border-r border-border/50 bg-card/30 flex items-center justify-center gap-2 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
                      onClick={() => addTrack("video")}
                    >
                      <Plus className="h-3 w-3" />
                      Video
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 text-muted-foreground hover:text-accent"
                      onClick={() => addTrack("audio")}
                    >
                      <Plus className="h-3 w-3" />
                      Audio
                    </Button>
                  </div>
                  <div className="flex-1 bg-muted/10" />
                </div>

                {/* Snap lines */}
                {snapPreviewLines.map((line, index) => (
                  <div
                    key={`snap-${index}-${line.time}`}
                    className={cn(
                      "absolute top-0 bottom-0 w-0.5 pointer-events-none z-20",
                      line.type === "playhead" && "bg-primary",
                      (line.type === "clip-start" || line.type === "clip-end") && "bg-amber-400",
                      line.type === "grid" && "bg-muted-foreground/50"
                    )}
                    style={{ left: `${line.time * state.zoom + 80}px` }}
                  />
                ))}

                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 pointer-events-none"
                  style={{ left: `${state.currentTime * state.zoom + 80}px` }}
                >
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-primary rotate-45" />
                </div>
              </div>

              {/* Empty state */}
              {state.clips.length === 0 && !isDragOver && (
                <div className="absolute inset-0 flex items-center justify-center mt-8">
                  <div className="text-center text-muted-foreground p-8">
                    <Upload className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Drop media here to start editing</p>
                    <p className="text-sm">Import video, images, or audio</p>
                  </div>
                </div>
              )}

              {/* Drop overlay */}
              {isDragOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary z-30 mt-8">
                  <div className="text-center p-8">
                    <Upload className="h-12 w-12 mx-auto mb-3 text-primary animate-bounce" />
                    <p className="font-medium text-primary text-lg">Drop files here</p>
                  </div>
                </div>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Hidden inputs */}
      <input ref={fileInputRef} type="file" accept="video/*,image/*" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
      <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e.target.files, true)} />

      {/* Save to Vault Dialog */}
      <SaveToVaultDialog
        open={showSaveToVault}
        onOpenChange={setShowSaveToVault}
        exportedBlobUrl={lastExportedUrl}
        onSaveComplete={handleSaveToVaultComplete}
      />

      {/* Save Project Dialog */}
      <SaveProjectDialog
        open={showSaveProjectDialog}
        onOpenChange={setShowSaveProjectDialog}
        onSave={handleSaveProject}
        isSaving={isSaving}
        defaultTitle={currentProjectTitle}
        isUpdate={!!currentProjectId}
      />

      {/* Load Project Dialog */}
      <LoadProjectDialog
        open={showLoadProjectDialog}
        onOpenChange={setShowLoadProjectDialog}
        projects={projects}
        isLoading={isLoadingProjects}
        onLoad={handleLoadProject}
        onDelete={handleDeleteProject}
        onRefresh={fetchProjects}
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
