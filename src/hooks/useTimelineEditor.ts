import { useState, useCallback, useRef, useEffect } from "react";

export type TransitionType = "none" | "fade" | "dissolve" | "wipe-left" | "wipe-right" | "wipe-up" | "wipe-down";

export interface TimelineTransition {
  id: string;
  type: TransitionType;
  duration: number; // in seconds
  clipAId: string; // outgoing clip
  clipBId: string; // incoming clip
}

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
  // Fade settings (in seconds)
  fadeIn: number;
  fadeOut: number;
  // Thumbnail for display
  thumbnail?: string;
}

export interface TimelineTrack {
  id: string;
  type: "video" | "audio";
  name: string;
  muted: boolean;
  locked: boolean;
  volume: number; // 0-1
  solo: boolean; // When true, only this track is heard
}

export interface TimelineState {
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  transitions: TimelineTransition[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  zoom: number; // pixels per second
  masterVolume: number; // 0-1
  backgroundAudio: {
    url: string | null;
    name: string;
    volume: number;
    muted: boolean;
  };
}

interface HistoryState {
  clips: TimelineClip[];
  transitions: TimelineTransition[];
  backgroundAudio: TimelineState["backgroundAudio"];
}

const MAX_DURATION = 5 * 60; // 5 minutes in seconds
const DEFAULT_ZOOM = 50; // 50 pixels per second
const MAX_HISTORY_SIZE = 50;

const generateId = () => Math.random().toString(36).substring(2, 15);

export function useTimelineEditor() {
  const [state, setState] = useState<TimelineState>({
    tracks: [
      { id: "video-1", type: "video", name: "Video Track", muted: false, locked: false, volume: 1, solo: false },
      { id: "audio-1", type: "audio", name: "Audio Track", muted: false, locked: false, volume: 1, solo: false },
    ],
    clips: [],
    transitions: [],
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    zoom: DEFAULT_ZOOM,
    masterVolume: 1,
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
    transitions: [],
    backgroundAudio: { url: null, name: "", volume: 1, muted: false },
  }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoingRef = useRef(false);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Push state to history
  const pushHistory = useCallback((clips: TimelineClip[], transitions: TimelineTransition[], backgroundAudio: TimelineState["backgroundAudio"]) => {
    if (isUndoingRef.current) {
      isUndoingRef.current = false;
      return;
    }

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({
        clips: JSON.parse(JSON.stringify(clips)),
        transitions: JSON.parse(JSON.stringify(transitions)),
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
            volume: 1,
            solo: false,
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
          fadeIn: 0,
          fadeOut: 0,
          thumbnail,
        };

        const newClips = [...prev.clips, newClip];
        const newTracks = prev.tracks.some((t) => t.id === track!.id)
          ? prev.tracks
          : [...prev.tracks, track];

        pushHistory(newClips, prev.transitions, prev.backgroundAudio);

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

  // Batch add multiple clips at once to avoid state race conditions
  const addMultipleClips = useCallback(
    (clipsData: Array<{
      sourceUrl: string;
      type: "video" | "audio" | "image";
      name: string;
      sourceDuration: number;
      thumbnail?: string;
    }>) => {
      setState((prev) => {
        let newClips = [...prev.clips];
        let newTracks = [...prev.tracks];

        // Group clips by track type to calculate proper start times
        const videoClipsToAdd = clipsData.filter(c => c.type !== "audio");
        const audioClipsToAdd = clipsData.filter(c => c.type === "audio");

        // Process video/image clips
        if (videoClipsToAdd.length > 0) {
          let videoTrack = newTracks.find((t) => t.type === "video");
          if (!videoTrack) {
            videoTrack = {
              id: generateId(),
              type: "video",
              name: "Video Track",
              muted: false,
              locked: false,
              volume: 1,
              solo: false,
            };
            newTracks = [...newTracks, videoTrack];
          }

          // Find end of existing video clips
          let videoStartTime = newClips
            .filter((c) => c.trackId === videoTrack!.id)
            .reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);

          for (const clipData of videoClipsToAdd) {
            const clipDuration = clipData.type === "image" ? 5 : clipData.sourceDuration;
            if (videoStartTime + clipDuration > MAX_DURATION) {
              console.warn("Cannot add clip: would exceed 5 minute limit");
              continue;
            }

            const newClip: TimelineClip = {
              id: generateId(),
              type: clipData.type,
              name: clipData.name,
              sourceUrl: clipData.sourceUrl,
              startTime: videoStartTime,
              duration: Math.min(clipDuration, MAX_DURATION - videoStartTime),
              sourceDuration: clipData.type === "image" ? 5 : clipData.sourceDuration,
              trimStart: 0,
              trimEnd: clipData.type === "image" ? 5 : clipData.sourceDuration,
              trackId: videoTrack!.id,
              muted: false,
              volume: 1,
              fadeIn: 0,
              fadeOut: 0,
              thumbnail: clipData.thumbnail,
            };

            newClips.push(newClip);
            videoStartTime += newClip.duration;
          }
        }

        // Process audio clips
        if (audioClipsToAdd.length > 0) {
          let audioTrack = newTracks.find((t) => t.type === "audio");
          if (!audioTrack) {
            audioTrack = {
              id: generateId(),
              type: "audio",
              name: "Audio Track",
              muted: false,
              locked: false,
              volume: 1,
              solo: false,
            };
            newTracks = [...newTracks, audioTrack];
          }

          // Find end of existing audio clips
          let audioStartTime = newClips
            .filter((c) => c.trackId === audioTrack!.id)
            .reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);

          for (const clipData of audioClipsToAdd) {
            const clipDuration = clipData.sourceDuration;
            if (audioStartTime + clipDuration > MAX_DURATION) {
              console.warn("Cannot add clip: would exceed 5 minute limit");
              continue;
            }

            const newClip: TimelineClip = {
              id: generateId(),
              type: "audio",
              name: clipData.name,
              sourceUrl: clipData.sourceUrl,
              startTime: audioStartTime,
              duration: Math.min(clipDuration, MAX_DURATION - audioStartTime),
              sourceDuration: clipData.sourceDuration,
              trimStart: 0,
              trimEnd: clipData.sourceDuration,
              trackId: audioTrack!.id,
              muted: false,
              volume: 1,
              fadeIn: 0,
              fadeOut: 0,
              thumbnail: clipData.thumbnail,
            };

            newClips.push(newClip);
            audioStartTime += newClip.duration;
          }
        }

        pushHistory(newClips, prev.transitions, prev.backgroundAudio);

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
      pushHistory(updatedClips, prev.transitions, prev.backgroundAudio);
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
      // Also remove transitions involving this clip
      const newTransitions = prev.transitions.filter(
        (t) => t.clipAId !== clipId && t.clipBId !== clipId
      );
      pushHistory(newClips, newTransitions, prev.backgroundAudio);
      return {
        ...prev,
        clips: newClips,
        transitions: newTransitions,
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

      // Push history for move operations
      pushHistory(newClips, prev.transitions, prev.backgroundAudio);

      return {
        ...prev,
        clips: newClips,
        duration: calculateDuration(newClips),
      };
    });
  }, [calculateDuration, pushHistory]);

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

        // Push history for trim operations
        pushHistory(newClips, prev.transitions, prev.backgroundAudio);

        return {
          ...prev,
          clips: newClips,
          duration: calculateDuration(newClips),
        };
      });
    },
    [calculateDuration, pushHistory]
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

      // Push history BEFORE returning new state
      pushHistory(newClips, prev.transitions, prev.backgroundAudio);

      return {
        ...prev,
        clips: newClips,
        duration: calculateDuration(newClips),
      };
    });
  }, [calculateDuration, pushHistory]);

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

  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    setState((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) =>
        t.id === trackId ? { ...t, volume: Math.max(0, Math.min(1, volume)) } : t
      ),
    }));
  }, []);

  // Add new track
  const addTrack = useCallback((type: "video" | "audio") => {
    setState((prev) => {
      const existingOfType = prev.tracks.filter((t) => t.type === type);
      const trackNumber = existingOfType.length + 1;
      const newTrack: TimelineTrack = {
        id: generateId(),
        type,
        name: `${type === "video" ? "Video" : "Audio"} Track ${trackNumber}`,
        muted: false,
        locked: false,
        volume: 1,
        solo: false,
      };
      return {
        ...prev,
        tracks: [...prev.tracks, newTrack],
      };
    });
  }, []);

  // Remove track (only if empty)
  const removeTrack = useCallback((trackId: string) => {
    setState((prev) => {
      // Don't allow removing if there are clips on the track
      const hasClips = prev.clips.some((c) => c.trackId === trackId);
      if (hasClips) return prev;
      
      // Don't allow removing the last track of each type
      const track = prev.tracks.find((t) => t.id === trackId);
      if (!track) return prev;
      const tracksOfType = prev.tracks.filter((t) => t.type === track.type);
      if (tracksOfType.length <= 1) return prev;
      
      return {
        ...prev,
        tracks: prev.tracks.filter((t) => t.id !== trackId),
      };
    });
  }, []);

  // Master volume
  const setMasterVolume = useCallback((volume: number) => {
    setState((prev) => ({
      ...prev,
      masterVolume: Math.max(0, Math.min(1, volume)),
    }));
  }, []);

  // Toggle track solo
  const toggleTrackSolo = useCallback((trackId: string) => {
    setState((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) =>
        t.id === trackId ? { ...t, solo: !t.solo } : t
      ),
    }));
  }, []);

  // Reorder tracks by moving a track to a new index
  const reorderTrack = useCallback((trackId: string, newIndex: number) => {
    setState((prev) => {
      const trackIndex = prev.tracks.findIndex((t) => t.id === trackId);
      if (trackIndex === -1 || newIndex < 0 || newIndex >= prev.tracks.length) {
        return prev;
      }
      
      const newTracks = [...prev.tracks];
      const [movedTrack] = newTracks.splice(trackIndex, 1);
      newTracks.splice(newIndex, 0, movedTrack);
      
      return {
        ...prev,
        tracks: newTracks,
      };
    });
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
    pushHistory([], [], emptyBackgroundAudio);
    setState((prev) => ({
      ...prev,
      clips: [],
      transitions: [],
      currentTime: 0,
      duration: 0,
      backgroundAudio: emptyBackgroundAudio,
    }));
  }, [pause, pushHistory]);

  // Load timeline state from a saved project
  const loadTimelineState = useCallback((
    tracks: TimelineTrack[],
    clips: TimelineClip[],
    transitions: TimelineTransition[],
    masterVolume: number,
    backgroundAudio: TimelineState["backgroundAudio"]
  ) => {
    pause();
    setState((prev) => ({
      ...prev,
      tracks: tracks.length > 0 ? tracks : prev.tracks,
      clips,
      transitions,
      masterVolume,
      backgroundAudio,
      currentTime: 0,
      duration: calculateDuration(clips),
    }));
    // Reset history with the loaded state
    setHistory([{
      clips: JSON.parse(JSON.stringify(clips)),
      transitions: JSON.parse(JSON.stringify(transitions)),
      backgroundAudio: JSON.parse(JSON.stringify(backgroundAudio)),
    }]);
    setHistoryIndex(0);
  }, [pause, calculateDuration]);

  // Transition management
  const addTransition = useCallback((clipAId: string, clipBId: string, type: TransitionType = "fade", duration: number = 1) => {
    setState((prev) => {
      // Check if transition already exists
      const exists = prev.transitions.some(
        (t) => t.clipAId === clipAId && t.clipBId === clipBId
      );
      if (exists) return prev;

      const newTransition: TimelineTransition = {
        id: generateId(),
        type,
        duration,
        clipAId,
        clipBId,
      };
      const newTransitions = [...prev.transitions, newTransition];
      pushHistory(prev.clips, newTransitions, prev.backgroundAudio);
      return {
        ...prev,
        transitions: newTransitions,
      };
    });
  }, [pushHistory]);

  const updateTransition = useCallback((transitionId: string, updates: Partial<TimelineTransition>) => {
    setState((prev) => {
      const newTransitions = prev.transitions.map((t) =>
        t.id === transitionId ? { ...t, ...updates } : t
      );
      return {
        ...prev,
        transitions: newTransitions,
      };
    });
  }, []);

  const removeTransition = useCallback((transitionId: string) => {
    setState((prev) => {
      const newTransitions = prev.transitions.filter((t) => t.id !== transitionId);
      pushHistory(prev.clips, newTransitions, prev.backgroundAudio);
      return {
        ...prev,
        transitions: newTransitions,
      };
    });
  }, [pushHistory]);

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
      transitions: JSON.parse(JSON.stringify(prevState.transitions)),
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
      transitions: JSON.parse(JSON.stringify(nextState.transitions)),
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
    addMultipleClips,
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
    toggleTrackSolo,
    setTrackVolume,
    addTrack,
    removeTrack,
    reorderTrack,
    setMasterVolume,
    clearTimeline,
    loadTimelineState,
    getActiveClips,
    addTransition,
    updateTransition,
    removeTransition,
    undo,
    redo,
    canUndo,
    canRedo,
    MAX_DURATION,
  };
}
