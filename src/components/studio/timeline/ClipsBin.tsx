import { useState, useMemo } from "react";
import { Film, Music, Image, Trash2, Play, X, ChevronDown, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { TimelineClip } from "@/hooks/useTimelineEditor";

interface ClipsBinProps {
  clips: TimelineClip[];
  selectedClipIds: string[];
  onSelectClip: (clipId: string, addToSelection?: boolean) => void;
  onRemoveClip: (clipId: string) => void;
  onSeekToClip: (startTime: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

type SortOption = "name" | "type" | "duration" | "position";

export function ClipsBin({
  clips,
  selectedClipIds,
  onSelectClip,
  onRemoveClip,
  onSeekToClip,
  isOpen,
  onToggle,
}: ClipsBinProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("position");

  // Get unique source clips (deduplicate by sourceUrl)
  const uniqueClips = useMemo(() => {
    const seen = new Map<string, TimelineClip>();
    clips.forEach(clip => {
      if (!seen.has(clip.sourceUrl)) {
        seen.set(clip.sourceUrl, clip);
      }
    });
    return Array.from(seen.values());
  }, [clips]);

  // Filter and sort clips
  const filteredClips = useMemo(() => {
    let result = [...clips];

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(clip =>
        clip.name.toLowerCase().includes(query) ||
        clip.type.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "type":
          return a.type.localeCompare(b.type);
        case "duration":
          return b.duration - a.duration;
        case "position":
        default:
          return a.startTime - b.startTime;
      }
    });

    return result;
  }, [clips, searchQuery, sortBy]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTypeIcon = (type: TimelineClip["type"]) => {
    switch (type) {
      case "video":
        return <Film className="h-3 w-3" />;
      case "audio":
        return <Music className="h-3 w-3" />;
      case "image":
        return <Image className="h-3 w-3" />;
    }
  };

  const getTypeColor = (type: TimelineClip["type"]) => {
    switch (type) {
      case "video":
        return "text-primary";
      case "audio":
        return "text-accent";
      case "image":
        return "text-secondary";
    }
  };

  if (clips.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-border bg-card/50 flex-shrink-0">
      {/* Header - Compact toggle bar */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="text-xs font-medium">Clips Bin</span>
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {clips.length}
          </span>
          {/* Type indicators */}
          <div className="flex items-center gap-1 ml-2">
            <span className="flex items-center gap-0.5 text-[10px] text-primary">
              <Film className="h-3 w-3" />
              {clips.filter(c => c.type === "video").length}
            </span>
            <span className="flex items-center gap-0.5 text-[10px] text-secondary">
              <Image className="h-3 w-3" />
              {clips.filter(c => c.type === "image").length}
            </span>
            <span className="flex items-center gap-0.5 text-[10px] text-accent">
              <Music className="h-3 w-3" />
              {clips.filter(c => c.type === "audio").length}
            </span>
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground">{uniqueClips.length} unique</span>
      </button>

      {/* Content - Limited max height */}
      {isOpen && (
        <div className="border-t border-border/50 max-h-32">
          {/* Controls */}
          <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/20">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search clips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-6 pl-7 text-xs"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-6 px-2 text-[10px] bg-background border border-input rounded-md"
            >
              <option value="position">By Position</option>
              <option value="name">By Name</option>
              <option value="type">By Type</option>
              <option value="duration">By Duration</option>
            </select>
          </div>

          {/* Clips List - Horizontal scroll */}
          <div className="overflow-x-auto overflow-y-hidden">
            <div className="flex gap-1.5 p-1.5 min-w-min">
              {filteredClips.map((clip) => (
                <div
                  key={clip.id}
                  className={cn(
                    "group relative rounded border bg-card hover:bg-muted/50 transition-colors cursor-pointer flex-shrink-0 w-24",
                    selectedClipIds.includes(clip.id)
                      ? "border-primary ring-1 ring-primary"
                      : "border-border/50"
                  )}
                  onClick={(e) => onSelectClip(clip.id, e.shiftKey || e.metaKey)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-muted/30 relative overflow-hidden rounded-t">
                    {clip.thumbnail ? (
                      <img
                        src={clip.thumbnail}
                        alt={clip.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {getTypeIcon(clip.type)}
                      </div>
                    )}
                    {/* Type badge */}
                    <div className={cn("absolute top-0.5 left-0.5 p-0.5 rounded bg-black/60", getTypeColor(clip.type))}>
                      {getTypeIcon(clip.type)}
                    </div>
                    {/* Duration badge */}
                    <div className="absolute bottom-0.5 right-0.5 px-1 py-0.5 text-[8px] font-mono bg-black/60 text-white rounded">
                      {formatDuration(clip.duration)}
                    </div>
                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 bg-black/50 hover:bg-black/70 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSeekToClip(clip.startTime);
                        }}
                        title="Go to clip"
                      >
                        <Play className="h-2.5 w-2.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 bg-black/50 hover:bg-destructive text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveClip(clip.id);
                        }}
                        title="Remove clip"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </div>
                  {/* Name */}
                  <div className="px-1 py-0.5">
                    <p className="text-[9px] truncate text-muted-foreground" title={clip.name}>
                      {clip.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredClips.length === 0 && searchQuery && (
              <div className="flex items-center justify-center py-2 text-[10px] text-muted-foreground">
                No clips match "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
