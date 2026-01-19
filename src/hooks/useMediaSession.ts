import { useEffect, useCallback, useRef } from 'react';

interface MediaSessionOptions {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: string;
  isPlaying: boolean;
  duration?: number;
  currentTime?: number;
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

  // Set up action handlers
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const handlers: { [key: string]: () => void } = {};

    if (onPlay) {
      handlers['play'] = onPlay;
      try {
        navigator.mediaSession.setActionHandler('play', onPlay);
      } catch (e) {
        console.warn('Media Session play handler not supported');
      }
    }

    if (onPause) {
      handlers['pause'] = onPause;
      try {
        navigator.mediaSession.setActionHandler('pause', onPause);
      } catch (e) {
        console.warn('Media Session pause handler not supported');
      }
    }

    if (onNextTrack) {
      handlers['nexttrack'] = onNextTrack;
      try {
        navigator.mediaSession.setActionHandler('nexttrack', onNextTrack);
      } catch (e) {
        console.warn('Media Session nexttrack handler not supported');
      }
    }

    if (onPreviousTrack) {
      handlers['previoustrack'] = onPreviousTrack;
      try {
        navigator.mediaSession.setActionHandler('previoustrack', onPreviousTrack);
      } catch (e) {
        console.warn('Media Session previoustrack handler not supported');
      }
    }

    if (onSeekTo) {
      try {
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) {
            onSeekTo(details.seekTime);
          }
        });
      } catch (e) {
        console.warn('Media Session seekto handler not supported');
      }
    }

    // Cleanup handlers on unmount
    return () => {
      if (!('mediaSession' in navigator)) return;
      
      const actionTypes: MediaSessionAction[] = ['play', 'pause', 'nexttrack', 'previoustrack', 'seekto'];
      actionTypes.forEach(action => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch (e) {
          // Ignore cleanup errors
        }
      });
    };
  }, [onPlay, onPause, onNextTrack, onPreviousTrack, onSeekTo]);
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
  
  // iOS-specific: Create an AudioContext to maintain audio session
  let audioContext: AudioContext | null = null;
  let sourceNode: MediaElementAudioSourceNode | null = null;
  
  // Only create AudioContext on iOS after user interaction
  const initAudioContext = () => {
    if (!isIOS() || audioContext) return;
    
    try {
      // Create AudioContext - this helps iOS keep audio session alive
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Connect audio element to AudioContext
      sourceNode = audioContext.createMediaElementSource(audio);
      sourceNode.connect(audioContext.destination);
      
      // Resume AudioContext (required on iOS)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      console.log('[iOS Audio] AudioContext initialized for background playback');
    } catch (e) {
      console.warn('[iOS Audio] Could not create AudioContext:', e);
    }
  };
  
  // Initialize on first play (user gesture required on iOS)
  const handleFirstPlay = () => {
    initAudioContext();
    audio.removeEventListener('play', handleFirstPlay);
  };
  audio.addEventListener('play', handleFirstPlay);
  
  // Handle page visibility changes
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Page is hidden (screen off/locked)
      if (!audio.paused) {
        // iOS may pause audio when screen locks - try to keep it going
        if (isIOS() && audioContext && audioContext.state === 'suspended') {
          audioContext.resume().catch(() => {});
        }
        
        // Store that we were playing
        audio.dataset.wasPlaying = 'true';
        
        // iOS workaround: Set a tiny interval to keep JS alive
        // This helps prevent iOS from completely suspending the audio
        const keepAlive = setInterval(() => {
          if (audio.paused && audio.dataset.wasPlaying === 'true') {
            audio.play().catch(() => {});
          }
        }, 1000);
        
        audio.dataset.keepAliveInterval = String(keepAlive);
      }
    } else {
      // Page is visible again
      const intervalId = audio.dataset.keepAliveInterval;
      if (intervalId) {
        clearInterval(parseInt(intervalId));
        delete audio.dataset.keepAliveInterval;
      }
      
      // Resume AudioContext if suspended
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
      }
      
      // If we were playing before, make sure we're still playing
      if (audio.dataset.wasPlaying === 'true' && audio.paused) {
        audio.play().catch(() => {});
      }
      
      delete audio.dataset.wasPlaying;
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // iOS-specific: Handle audio interruptions (calls, Siri, etc.)
  const handlePause = () => {
    // If paused due to interruption, mark it
    if (document.hidden) {
      audio.dataset.interrupted = 'true';
    }
  };
  
  const handlePlay = () => {
    delete audio.dataset.interrupted;
    // Ensure AudioContext is running
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
  };
  
  audio.addEventListener('pause', handlePause);
  audio.addEventListener('play', handlePlay);
  
  // iOS-specific: Handle when audio ends unexpectedly
  const handleStalled = () => {
    console.log('[iOS Audio] Audio stalled, attempting recovery');
    if (!audio.paused && audio.dataset.wasPlaying === 'true') {
      setTimeout(() => {
        audio.play().catch(() => {});
      }, 100);
    }
  };
  
  audio.addEventListener('stalled', handleStalled);
  audio.addEventListener('waiting', handleStalled);

  // Cleanup
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    audio.removeEventListener('pause', handlePause);
    audio.removeEventListener('play', handlePlay);
    audio.removeEventListener('stalled', handleStalled);
    audio.removeEventListener('waiting', handleStalled);
    audio.removeEventListener('play', handleFirstPlay);
    
    const intervalId = audio.dataset.keepAliveInterval;
    if (intervalId) {
      clearInterval(parseInt(intervalId));
    }
    
    if (audioContext) {
      audioContext.close().catch(() => {});
    }
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
