import { useState, useCallback, useRef } from "react";
import { TimelineClip } from "./useTimelineEditor";

interface HistoryState {
  clips: TimelineClip[];
  backgroundAudio: {
    url: string | null;
    name: string;
    volume: number;
    muted: boolean;
  };
}

const MAX_HISTORY_SIZE = 50;

export function useTimelineHistory(initialState: HistoryState) {
  const [history, setHistory] = useState<HistoryState[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isUndoingRef = useRef(false);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const pushState = useCallback((newState: HistoryState) => {
    if (isUndoingRef.current) {
      isUndoingRef.current = false;
      return;
    }

    setHistory((prev) => {
      // Remove any redo states
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Add new state
      newHistory.push(JSON.parse(JSON.stringify(newState)));
      
      // Limit history size
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });
    
    setCurrentIndex((prev) => Math.min(prev + 1, MAX_HISTORY_SIZE - 1));
  }, [currentIndex]);

  const undo = useCallback((): HistoryState | null => {
    if (!canUndo) return null;
    
    isUndoingRef.current = true;
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    
    return JSON.parse(JSON.stringify(history[newIndex]));
  }, [canUndo, currentIndex, history]);

  const redo = useCallback((): HistoryState | null => {
    if (!canRedo) return null;
    
    isUndoingRef.current = true;
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    
    return JSON.parse(JSON.stringify(history[newIndex]));
  }, [canRedo, currentIndex, history]);

  const clearHistory = useCallback(() => {
    setHistory([initialState]);
    setCurrentIndex(0);
  }, [initialState]);

  return {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  };
}
