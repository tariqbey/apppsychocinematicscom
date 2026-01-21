import { useEffect, useCallback, useRef } from 'react';

interface MediaSessionOptions {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: string;
  isPlaying: boolean;
  duration?: number;
  currentTime?: number;
  audioElement?: HTMLAudioElement | null;
  onPlay?: () => void;
  onPause?: () => void;
  onNextTrack?: () => void;
  onPreviousTrack?: () => void;
  onSeekTo?: (time: number) => void;
}

/**
 * Hook to integrate with the Media Session API for background audio playback on mobile.
 * This allows music to continue playing when the screen is off or the app is in the background.
 */
export function useMediaSession({
  title,
  artist,
  album = 'The Score',
  artwork,
  isPlaying,
  duration,
  currentTime,
  audioElement,
  onPlay,
  onPause,
  onNextTrack,
  onPreviousTrack,
  onSeekTo,
}: MediaSessionOptions) {
  
  // Update media session metadata when track changes
  useEffect(() => {
    if (!('mediaSession' in navigator) || !title) return;

    try {
      // Default artwork if none provided
      const artworkList = artwork 
        ? [{ src: artwork, sizes: '512x512', type: 'image/png' }]
        : [{ 
            src: '/favicon.png', 
            sizes: '192x192', 
            type: 'image/png' 
          }];

      navigator.mediaSession.metadata = new MediaMetadata({
        title: title,
        artist: artist || 'Unknown Artist',
        album: album,
        artwork: artworkList,
      });
    } catch (error) {
      console.warn('Failed to set media session metadata:', error);
    }
  }, [title, artist, album, artwork]);

  // Update playback state
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch (error) {
      console.warn('Failed to set playback state:', error);
    }
  }, [isPlaying]);

  // Update position state for seek bar in lock screen controls
  useEffect(() => {
    if (!('mediaSession' in navigator) || !duration) return;

    try {
      if ('setPositionState' in navigator.mediaSession) {
        navigator.mediaSession.setPositionState({
          duration: duration || 0,
          playbackRate: 1,
          position: currentTime || 0,
        });
      }
    } catch (error) {
      // Ignore position state errors - not all browsers support this
    }
  }, [duration, currentTime]);

  // Set up action handlers - these MUST control the audio element directly
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    // Play handler - actually plays the audio
    if (onPlay) {
      try {
        navigator.mediaSession.setActionHandler('play', () => {
          console.log('[MediaSession] Play action triggered');
          if (audioElement) {
            audioElement.play().catch(console.error);
          }
          onPlay();
        });
      } catch (e) {
        console.warn('Media Session play handler not supported');
      }
    }

    // Pause handler - actually pauses the audio
    if (onPause) {
      try {
        navigator.mediaSession.setActionHandler('pause', () => {
          console.log('[MediaSession] Pause action triggered');
          if (audioElement) {
            audioElement.pause();
          }
          onPause();
        });
      } catch (e) {
        console.warn('Media Session pause handler not supported');
      }
    }

    if (onNextTrack) {
      try {
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          console.log('[MediaSession] Next track action triggered');
          onNextTrack();
        });
      } catch (e) {
        console.warn('Media Session nexttrack handler not supported');
      }
    }

    if (onPreviousTrack) {
      try {
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          console.log('[MediaSession] Previous track action triggered');
          onPreviousTrack();
        });
      } catch (e) {
        console.warn('Media Session previoustrack handler not supported');
      }
    }

    if (onSeekTo) {
      try {
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          console.log('[MediaSession] Seek action triggered:', details.seekTime);
          if (details.seekTime !== undefined) {
            if (audioElement) {
              audioElement.currentTime = details.seekTime;
            }
            onSeekTo(details.seekTime);
          }
        });
      } catch (e) {
        console.warn('Media Session seekto handler not supported');
      }
    }

    // Stop handler for lock screen stop button
    try {
      navigator.mediaSession.setActionHandler('stop', () => {
        console.log('[MediaSession] Stop action triggered');
        if (audioElement) {
          audioElement.pause();
          audioElement.currentTime = 0;
        }
        onPause?.();
      });
    } catch (e) {
      // Stop not supported on all platforms
    }

    // Cleanup handlers on unmount
    return () => {
      if (!('mediaSession' in navigator)) return;
      
      const actionTypes: MediaSessionAction[] = ['play', 'pause', 'nexttrack', 'previoustrack', 'seekto', 'stop'];
      actionTypes.forEach(action => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch (e) {
          // Ignore cleanup errors
        }
      });
    };
  }, [audioElement, onPlay, onPause, onNextTrack, onPreviousTrack, onSeekTo]);
}

/**
 * Detect if running on iOS
 */
function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Configure audio for iOS background playback.
 * iOS Safari requires special handling to keep audio playing when screen locks.
 */
export function configureAudioForBackground(audio: HTMLAudioElement) {
  // These attributes help with background playback on mobile
  audio.setAttribute('playsinline', 'true');
  audio.setAttribute('webkit-playsinline', 'true');

  // Preload metadata for faster playback
  audio.preload = 'auto';

  // IMPORTANT:
  // Do NOT attach this HTMLAudioElement to the Web Audio API here.
  // The waveform visualizer already uses `createMediaElementSource(audio)`.
  // Connecting the same element twice breaks playback in Safari/iOS.

  const handleVisibilityChange = () => {
    // When returning to foreground, some browsers may suspend the audio pipeline.
    // If the user expects playback to continue, they can press play again.
    // (We intentionally avoid calling `audio.play()` here to prevent iOS gesture errors.)
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

/**
 * Hook to keep iOS audio session alive during background playback.
 * Call this with your audio element reference to enable background playback on iOS.
 */
export function useIOSBackgroundAudio(audioRef: React.RefObject<HTMLAudioElement>, isPlaying: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  
  useEffect(() => {
    // Request wake lock when playing (prevents screen dimming on supported devices)
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isPlaying) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          console.log('[WakeLock] Screen wake lock acquired');
        } catch (e) {
          // Wake lock not available or denied
        }
      }
    };
    
    const releaseWakeLock = () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('[WakeLock] Screen wake lock released');
      }
    };
    
    if (isPlaying) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    
    // Re-acquire wake lock when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && isPlaying) {
        requestWakeLock();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      releaseWakeLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying]);
}
