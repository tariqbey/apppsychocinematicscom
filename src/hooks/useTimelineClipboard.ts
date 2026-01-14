import { useState, useCallback } from "react";
import { TimelineClip } from "./useTimelineEditor";

export function useTimelineClipboard() {
  const [clipboard, setClipboard] = useState<TimelineClip[]>([]);

  const copy = useCallback((clips: TimelineClip[]) => {
    // Deep clone the clips for clipboard
    const clonedClips = JSON.parse(JSON.stringify(clips));
    setClipboard(clonedClips);
  }, []);

  const paste = useCallback((atTime: number): TimelineClip[] => {
    if (clipboard.length === 0) return [];

    // Find the earliest start time in clipboard
    const earliestStart = Math.min(...clipboard.map(c => c.startTime));
    
    // Generate new IDs and adjust start times
    return clipboard.map(clip => ({
      ...clip,
      id: Math.random().toString(36).substring(2, 15),
      startTime: atTime + (clip.startTime - earliestStart),
    }));
  }, [clipboard]);

  const duplicate = useCallback((clips: TimelineClip[]): TimelineClip[] => {
    // Find the latest end time
    const latestEnd = Math.max(...clips.map(c => c.startTime + c.duration));
    
    // Generate new IDs and place after existing clips
    return clips.map(clip => ({
      ...clip,
      id: Math.random().toString(36).substring(2, 15),
      startTime: latestEnd + (clip.startTime - Math.min(...clips.map(c => c.startTime))),
    }));
  }, []);

  const hasClipboard = clipboard.length > 0;

  const clearClipboard = useCallback(() => {
    setClipboard([]);
  }, []);

  return {
    copy,
    paste,
    duplicate,
    hasClipboard,
    clearClipboard,
  };
}
