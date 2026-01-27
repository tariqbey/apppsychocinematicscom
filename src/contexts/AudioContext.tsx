import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';

export interface AudioTrackMetadata {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: string;
  owner?: string; // Component that started playback
}

interface AudioContextValue {
  // State
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  currentTrack: AudioTrackMetadata | null;
  currentSrc: string | null;
  audioOwner: string | null;
  
  // Actions
  playAudio: (src: string, metadata?: AudioTrackMetadata) => Promise<void>;
  pauseAudio: () => void;
  stopAudio: () => void;
  togglePlay: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  
  // For components that need direct access (e.g., visualizers)
  audioElement: HTMLAudioElement | null;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

// Optional hook that doesn't throw if context is missing (for gradual migration)
export const useAudioOptional = () => {
  return useContext(AudioContext);
};

interface AudioProviderProps {
  children: React.ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<AudioTrackMetadata | null>(null);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [audioOwner, setAudioOwner] = useState<string | null>(null);

  // Initialize audio element once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';
      audioRef.current.volume = volume;
    }

    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      console.error('[AudioContext] Playback error:', e);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Sync volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const playAudio = useCallback(async (src: string, metadata?: AudioTrackMetadata) => {
    const audio = audioRef.current;
    if (!audio) return;

    // If same source, just resume
    if (audio.src === src && audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
        return;
      } catch (err) {
        console.error('[AudioContext] Resume error:', err);
      }
    }

    // New source - stop current and play new
    audio.pause();
    audio.currentTime = 0;
    audio.src = src;
    audio.volume = isMuted ? 0 : volume;
    audio.muted = isMuted;

    setCurrentSrc(src);
    setCurrentTrack(metadata || null);
    setAudioOwner(metadata?.owner || null);
    setCurrentTime(0);

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('[AudioContext] Play error:', err);
      setIsPlaying(false);
    }
  }, [volume, isMuted]);

  const pauseAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setCurrentSrc(null);
      setCurrentTrack(null);
      setAudioOwner(null);
    }
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else if (audio.src) {
      audio.play().catch(console.error);
    }
  }, [isPlaying]);

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio && isFinite(time)) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
    if (clampedVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted);
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
  }, []);

  const value: AudioContextValue = {
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    currentTrack,
    currentSrc,
    audioOwner,
    playAudio,
    pauseAudio,
    stopAudio,
    togglePlay,
    seekTo,
    setVolume,
    setMuted,
    audioElement: audioRef.current,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};
