import { useEffect, useCallback } from "react";
import { EditingTool } from "@/components/studio/timeline/TimelineToolbar";

interface UseTimelineKeyboardProps {
  onToolChange: (tool: EditingTool) => void;
  onSnapToggle: () => void;
  onPlayPause: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onSplit: () => void;
  onSeekStart: () => void;
  onSeekEnd: () => void;
  onNudgeLeft: () => void;
  onNudgeRight: () => void;
  onAddAudio?: () => void;
  enabled?: boolean;
}

export function useTimelineKeyboard({
  onToolChange,
  onSnapToggle,
  onPlayPause,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onDelete,
  onDuplicate,
  onSplit,
  onSeekStart,
  onSeekEnd,
  onNudgeLeft,
  onNudgeRight,
  onAddAudio,
  enabled = true,
}: UseTimelineKeyboardProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    // Don't trigger shortcuts when typing in inputs
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      (e.target as HTMLElement).isContentEditable
    ) {
      return;
    }

    const isMeta = e.metaKey || e.ctrlKey;

    // Tool shortcuts
    if (!isMeta && !e.shiftKey) {
      switch (e.key.toLowerCase()) {
        case "v":
          e.preventDefault();
          onToolChange("select");
          return;
        case "c":
          e.preventDefault();
          onToolChange("razor");
          return;
        case "h":
          e.preventDefault();
          onToolChange("hand");
          return;
        case "r":
          e.preventDefault();
          onToolChange("range");
          return;
        case "s":
          e.preventDefault();
          onSnapToggle();
          return;
        case "a":
          e.preventDefault();
          onAddAudio?.();
          return;
      }
    }

    // Playback
    if (e.key === " ") {
      e.preventDefault();
      onPlayPause();
      return;
    }

    // Navigation
    if (e.key === "Home") {
      e.preventDefault();
      onSeekStart();
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      onSeekEnd();
      return;
    }
    if (e.key === "ArrowLeft" && !isMeta) {
      e.preventDefault();
      onNudgeLeft();
      return;
    }
    if (e.key === "ArrowRight" && !isMeta) {
      e.preventDefault();
      onNudgeRight();
      return;
    }

    // Edit shortcuts (with modifier)
    if (isMeta) {
      switch (e.key.toLowerCase()) {
        case "z":
          e.preventDefault();
          if (e.shiftKey) {
            onRedo();
          } else {
            onUndo();
          }
          return;
        case "y":
          e.preventDefault();
          onRedo();
          return;
        case "c":
          e.preventDefault();
          onCopy();
          return;
        case "v":
          e.preventDefault();
          onPaste();
          return;
        case "d":
          e.preventDefault();
          onDuplicate();
          return;
      }
    }

    // Delete
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      onDelete();
      return;
    }

    // Split at playhead
    if (e.key.toLowerCase() === "k" || (e.shiftKey && e.key.toLowerCase() === "s")) {
      e.preventDefault();
      onSplit();
      return;
    }
  }, [
    enabled,
    onToolChange,
    onSnapToggle,
    onPlayPause,
    onUndo,
    onRedo,
    onCopy,
    onPaste,
    onDelete,
    onDuplicate,
    onSplit,
    onSeekStart,
    onSeekEnd,
    onNudgeLeft,
    onNudgeRight,
    onAddAudio,
  ]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
