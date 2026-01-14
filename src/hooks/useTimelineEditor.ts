import { useState, useCallback, useRef, useEffect } from "react";

export interface TimelineClip {
  id: string;
  type: "video" | "audio" | "image";
  name: string;
  sourceUrl: string;
  // Timeline position (in seconds)
  startTime: number;
  // Duration on timeline (in seconds)
  duration: number;
  // Source media properties
  sourceDuration: number;
  // Trim points (in seconds from source start)
  trimStart: number;
  trimEnd: number;
  // Track assignment
  trackId: string;
  // Audio settings
  muted: boolean;
  volume: number;
  // Thumbnail for display
  thumbnail?: string;
}

export interface TimelineTrack {
  id: string;
  type: "video" | "audio";
  name: string;
  muted: boolean;
  locked: boolean;
}

export interface TimelineState {
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  zoom: number; // pixels per second
  backgroundAudio: {
    url: string | null;
    name: string;
    volume: number;
    muted: boolean;
  };
}

interface HistoryState {
  clips: TimelineClip[];
  backgroundAudio: TimelineState["backgroundAudio"];
}

const MAX_DURATION = 5 * 60; // 5 minutes in seconds
const DEFAULT_ZOOM = 50; // 50 pixels per second
const MAX_HISTORY_SIZE = 50;

const generateId = () => Math.random().toString(36).substring(2, 15);

export function useTimelineEditor() {
  const [state, setState] = useState<TimelineState>({
    tracks: [
      { id: "video-1", type: "video", name: "Video Track", muted: false, locked: false },
      { id: "audio-1", type: "audio", name: "Audio Track", muted: false, locked: false },
    ],
    clips: [],
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    zoom: DEFAULT_ZOOM,
    backgroundAudio: {
      url: null,
      name: "",
      volume: 1,
      muted: false,
    },
  });

  const playbackRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  
  // History for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([{
    clips: [],
    backgroundAudio: { url: null, name: "", volume: 1, muted: false },
  }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoingRef = useRef(false);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Push state to history
  const pushHistory = useCallback((clips: TimelineClip[], backgroundAudio: TimelineState["backgroundAudio"]) => {
    if (isUndoingRef.current) {
      isUndoingRef.current = false;
      return;
    }

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({
        clips: JSON.parse(JSON.stringify(clips)),
        backgroundAudio: JSON.parse(JSON.stringify(backgroundAudio)),
      });
      
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
      }
      
      return newHistory;
    });
    
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY_SIZE - 1));
  }, [historyIndex]);

  // Calculate total timeline duration based on clips
  const calculateDuration = useCallback((clips: TimelineClip[]): number => {
    if (clips.length === 0) return 0;
    return Math.min(
      Math.max(...clips.map((c) => c.startTime + c.duration)),
      MAX_DURATION
    );
  }, []);

  // Add a clip to the timeline
  const addClip = useCallback(
    async (
      sourceUrl: string,
      type: "video" | "audio" | "image",
      name: string,
      sourceDuration: number,
      thumbnail?: string
    ) => {
      setState((prev) => {
        // Find appropriate track
        const trackType = type === "audio" ? "audio" : "video";
        let track = prev.tracks.find((t) => t.type === trackType);

        if (!track) {
          // Create track if needed
          track = {
            id: generateId(),
            type: trackType,
            name: trackType === "video" ? "Video Track" : "Audio Track",
            muted: false,
            locked: false,
          };
        }

        // Find end of existing clips on this track
        const trackClips = prev.clips.filter((c) => c.trackId === track!.id);
        const startTime = trackClips.length > 0
          ? Math.max(...trackClips.map((c) => c.startTime + c.duration))
          : 0;

        // Check if adding would exceed max duration
        const clipDuration = type === "image" ? 5 : sourceDuration; // Images default to 5 seconds
        if (startTime + clipDuration > MAX_DURATION) {
          console.warn("Cannot add clip: would exceed 5 minute limit");
          return prev;
        }

        const newClip: TimelineClip = {
          id: generateId(),
          type,
          name,
          sourceUrl,
          startTime,
          duration: Math.min(clipDuration, MAX_DURATION - startTime),
          sourceDuration: type === "image" ? 5 : sourceDuration,
          trimStart: 0,
          trimEnd: type === "image" ? 5 : sourceDuration,
          trackId: track.id,
          muted: false,
          volume: 1,
          thumbnail,
        };

        const newClips = [...prev.clips, newClip];
        const newTracks = prev.tracks.some((t) => t.id === track!.id)
          ? prev.tracks
          : [...prev.tracks, track];

      pushHistory(newClips, prev.backgroundAudio);

        return {
          ...prev,
          clips: newClips,
          tracks: newTracks,
          duration: calculateDuration(newClips),
        };
      });
    },
    [calculateDuration, pushHistory]
  );

  // Add multiple clips at once (for paste/duplicate)
  const addClips = useCallback((newClips: TimelineClip[]) => {
    setState(prev => {
      const updatedClips = [...prev.clips, ...newClips];
      pushHistory(updatedClips, prev.backgroundAudio);
      return {
        ...prev,
        clips: updatedClips,
        duration: calculateDuration(updatedClips),
      };
    });
  }, [calculateDuration, pushHistory]);

  // Remove a clip
  const removeClip = useCallback((clipId: string) => {
    setState((prev) => {
      const newClips = prev.clips.filter((c) => c.id !== clipId);
      pushHistory(newClips, prev.backgroundAudio);
      return {
        ...prev,
        clips: newClips,
        duration: calculateDuration(newClips),
      };
    });
  }, [calculateDuration, pushHistory]);

  // Update clip properties
  const updateClip = useCallback((clipId: string, updates: Partial<TimelineClip>) => {
    setState((prev) => {
      const newClips = prev.clips.map((c) =>
        c.id === clipId ? { ...c, ...updates } : c
      );
      return {
        ...prev,
        clips: newClips,
        duration: calculateDuration(newClips),
      };
    });
  }, [calculateDuration]);

  // Move clip to new position
  const moveClip = useCallback((clipId: string, newStartTime: number, newTrackId?: string) => {
    setState((prev) => {
      const clip = prev.clips.find((c) => c.id === clipId);
      if (!clip) return prev;

      const clampedStart = Math.max(0, Math.min(newStartTime, MAX_DURATION - clip.duration));

      const newClips = prev.clips.map((c) =>
        c.id === clipId
          ? {
              ...c,
              startTime: clampedStart,
              trackId: newTrackId || c.trackId,
            }
          : c
      );

      return {
        ...prev,
        clips: newClips,
        duration: calculateDuration(newClips),
      };
    });
  }, [calculateDuration]);

  // Trim clip
  const trimClip = useCallback(
    (clipId: string, trimStart: number, trimEnd: number) => {
      setState((prev) => {
        const clip = prev.clips.find((c) => c.id === clipId);
        if (!clip) return prev;

        const newDuration = trimEnd - trimStart;
        if (newDuration <= 0) return prev;

        const newClips = prev.clips.map((c) =>
          c.id === clipId
            ? {
                ...c,
                trimStart,
                trimEnd,
                duration: newDuration,
              }
            : c
        );

        return {
          ...prev,
          clips: newClips,
          duration: calculateDuration(newClips),
        };
      });
    },
    [calculateDuration]
  );

  // Split clip at current time
  const splitClip = useCallback((clipId: string, splitTime: number) => {
    setState((prev) => {
      const clip = prev.clips.find((c) => c.id === clipId);
      if (!clip) return prev;

      // Check if split time is within clip
      const relativeTime = splitTime - clip.startTime;
      if (relativeTime <= 0 || relativeTime >= clip.duration) return prev;

      const firstHalf: TimelineClip = {
        ...clip,
        id: generateId(),
        duration: relativeTime,
        trimEnd: clip.trimStart + relativeTime,
      };

      const secondHalf: TimelineClip = {
        ...clip,
        id: generateId(),
        startTime: splitTime,
        duration: clip.duration - relativeTime,
        trimStart: clip.trimStart + relativeTime,
      };

      const newClips = prev.clips
        .filter((c) => c.id !== clipId)
        .concat([firstHalf, secondHalf]);

      return {
        ...prev,
        clips: newClips,
        duration: calculateDuration(newClips),
      };
    });
  }, [calculateDuration]);

  // Playback controls
  const play = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: true }));
    lastTimeRef.current = performance.now();

    const animate = () => {
      const now = performance.now();
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setState((prev) => {
        const newTime = prev.currentTime + delta;
        if (newTime >= prev.duration) {
          return { ...prev, currentTime: 0, isPlaying: false };
        }
        return { ...prev, currentTime: newTime };
      });

      playbackRef.current = requestAnimationFrame(animate);
    };

    playbackRef.current = requestAnimationFrame(animate);
  }, []);

  const pause = useCallback(() => {
    if (playbackRef.current) {
      cancelAnimationFrame(playbackRef.current);
      playbackRef.current = null;
    }
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  const togglePlayback = useCallback(() => {
    setState((prev) => {
      if (prev.isPlaying) {
        pause();
        return prev;
      } else {
        play();
        return prev;
      }
    });
  }, [play, pause]);

  const seek = useCallback((time: number) => {
    setState((prev) => ({
      ...prev,
      currentTime: Math.max(0, Math.min(time, prev.duration)),
    }));
  }, []);

  // Zoom controls
  const setZoom = useCallback((zoom: number) => {
    setState((prev) => ({
      ...prev,
      zoom: Math.max(10, Math.min(200, zoom)),
    }));
  }, []);

  // Background audio
  const setBackgroundAudio = useCallback((url: string | null, name: string = "") => {
    setState((prev) => ({
      ...prev,
      backgroundAudio: {
        ...prev.backgroundAudio,
        url,
        name,
      },
    }));
  }, []);

  const setBackgroundAudioVolume = useCallback((volume: number) => {
    setState((prev) => ({
      ...prev,
      backgroundAudio: {
        ...prev.backgroundAudio,
        volume: Math.max(0, Math.min(1, volume)),
      },
    }));
  }, []);

  const toggleBackgroundAudioMute = useCallback(() => {
    setState((prev) => ({
      ...prev,
      backgroundAudio: {
        ...prev.backgroundAudio,
        muted: !prev.backgroundAudio.muted,
      },
    }));
  }, []);

  // Track controls
  const toggleTrackMute = useCallback((trackId: string) => {
    setState((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) =>
        t.id === trackId ? { ...t, muted: !t.muted } : t
      ),
    }));
  }, []);

  const toggleTrackLock = useCallback((trackId: string) => {
    setState((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) =>
        t.id === trackId ? { ...t, locked: !t.locked } : t
      ),
    }));
  }, []);

  // Clear timeline
  const clearTimeline = useCallback(() => {
    pause();
    const emptyBackgroundAudio = {
      url: null,
      name: "",
      volume: 1,
      muted: false,
    };
    pushHistory([], emptyBackgroundAudio);
    setState((prev) => ({
      ...prev,
      clips: [],
      currentTime: 0,
      duration: 0,
      backgroundAudio: emptyBackgroundAudio,
    }));
  }, [pause, pushHistory]);

  // Undo
  const undo = useCallback(() => {
    if (!canUndo) return;
    
    isUndoingRef.current = true;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    
    const prevState = history[newIndex];
    setState(state => ({
      ...state,
      clips: JSON.parse(JSON.stringify(prevState.clips)),
      backgroundAudio: JSON.parse(JSON.stringify(prevState.backgroundAudio)),
      duration: calculateDuration(prevState.clips),
    }));
  }, [canUndo, historyIndex, history, calculateDuration]);

  // Redo
  const redo = useCallback(() => {
    if (!canRedo) return;
    
    isUndoingRef.current = true;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    
    const nextState = history[newIndex];
    setState(state => ({
      ...state,
      clips: JSON.parse(JSON.stringify(nextState.clips)),
      backgroundAudio: JSON.parse(JSON.stringify(nextState.backgroundAudio)),
      duration: calculateDuration(nextState.clips),
    }));
  }, [canRedo, historyIndex, history, calculateDuration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playbackRef.current) {
        cancelAnimationFrame(playbackRef.current);
      }
    };
  }, []);

  // Get clips at current time
  const getActiveClips = useCallback(() => {
    return state.clips.filter(
      (clip) =>
        state.currentTime >= clip.startTime &&
        state.currentTime < clip.startTime + clip.duration
    );
  }, [state.clips, state.currentTime]);

  return {
    state,
    addClip,
    addClips,
    removeClip,
    updateClip,
    moveClip,
    trimClip,
    splitClip,
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
    getActiveClips,
    undo,
    redo,
    canUndo,
    canRedo,
    MAX_DURATION,
  };
}
