import { useEffect, useCallback } from 'react';

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
 * Request audio focus for background playback.
 * This helps prevent the audio from being interrupted by other apps.
 */
export function configureAudioForBackground(audio: HTMLAudioElement) {
  // These attributes help with background playback on mobile
  audio.setAttribute('playsinline', 'true');
  audio.setAttribute('webkit-playsinline', 'true');
  
  // Preload metadata for faster playback
  audio.preload = 'auto';
  
  // Handle visibility change to ensure audio continues
  const handleVisibilityChange = () => {
    if (document.hidden && !audio.paused) {
      // Audio is playing and page is hidden - ensure it continues
      // Some browsers pause audio when tab is hidden, this helps prevent that
      const currentTime = audio.currentTime;
      const wasPlaying = !audio.paused;
      
      // Re-assert playback if needed
      if (wasPlaying) {
        audio.play().catch(() => {
          // Playback was likely interrupted by the system
          console.log('Background playback may have been interrupted');
        });
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
