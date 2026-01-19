import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface OfflineTrack {
  trackId: string;
  url: string;
  title: string;
  artist?: string;
  cachedAt: number;
  size?: number;
}

interface CacheStats {
  totalSize: number;
  trackCount: number;
}

const OFFLINE_TRACKS_KEY = 'offline-tracks-metadata';

/**
 * Hook for managing offline audio track caching via Service Worker
 */
export function useOfflineTracks() {
  const [offlineTracks, setOfflineTracks] = useState<OfflineTrack[]>([]);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const [cacheStats, setCacheStats] = useState<CacheStats>({ totalSize: 0, trackCount: 0 });
  const [downloadingTracks, setDownloadingTracks] = useState<Set<string>>(new Set());

  // Load offline tracks metadata from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(OFFLINE_TRACKS_KEY);
      if (stored) {
        setOfflineTracks(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load offline tracks metadata:', error);
    }
  }, []);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope);
          setIsServiceWorkerReady(true);
          
          // Update cache stats on registration
          updateCacheStats();
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Check if already active
      if (navigator.serviceWorker.controller) {
        setIsServiceWorkerReady(true);
      }
    }
  }, []);

  // Save metadata to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(OFFLINE_TRACKS_KEY, JSON.stringify(offlineTracks));
    } catch (error) {
      console.error('Failed to save offline tracks metadata:', error);
    }
  }, [offlineTracks]);

  // Send message to service worker and wait for response
  const sendMessage = useCallback((message: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!navigator.serviceWorker.controller) {
        reject(new Error('Service Worker not ready'));
        return;
      }

      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);

      // Timeout after 60 seconds (for large files)
      setTimeout(() => reject(new Error('Timeout')), 60000);
    });
  }, []);

  // Update cache statistics
  const updateCacheStats = useCallback(async () => {
    if (!isServiceWorkerReady) return;

    try {
      const result = await sendMessage({ type: 'GET_CACHE_SIZE' });
      if (result.success) {
        setCacheStats({
          totalSize: result.size,
          trackCount: result.count,
        });
      }
    } catch (error) {
      console.error('Failed to get cache stats:', error);
    }
  }, [isServiceWorkerReady, sendMessage]);

  // Download a track for offline use
  const downloadTrack = useCallback(async (
    trackId: string,
    url: string,
    title: string,
    artist?: string
  ): Promise<boolean> => {
    if (!isServiceWorkerReady) {
      toast.error('Offline mode not available');
      return false;
    }

    // Check if already downloaded
    if (offlineTracks.some(t => t.trackId === trackId)) {
      toast.info('Track already downloaded');
      return true;
    }

    // Mark as downloading
    setDownloadingTracks(prev => new Set(prev).add(trackId));

    try {
      const result = await sendMessage({
        type: 'CACHE_TRACK',
        payload: { trackId, url }
      });

      if (result.success) {
        const newTrack: OfflineTrack = {
          trackId,
          url,
          title,
          artist,
          cachedAt: Date.now(),
          size: parseInt(result.size) || 0,
        };

        setOfflineTracks(prev => [...prev, newTrack]);
        await updateCacheStats();
        toast.success(`"${title}" saved for offline`);
        return true;
      } else {
        toast.error('Failed to download track');
        return false;
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed');
      return false;
    } finally {
      setDownloadingTracks(prev => {
        const next = new Set(prev);
        next.delete(trackId);
        return next;
      });
    }
  }, [isServiceWorkerReady, offlineTracks, sendMessage, updateCacheStats]);

  // Remove a track from offline cache
  const removeOfflineTrack = useCallback(async (trackId: string): Promise<boolean> => {
    const track = offlineTracks.find(t => t.trackId === trackId);
    if (!track) return false;

    try {
      const result = await sendMessage({
        type: 'REMOVE_TRACK',
        payload: { url: track.url }
      });

      if (result.success) {
        setOfflineTracks(prev => prev.filter(t => t.trackId !== trackId));
        await updateCacheStats();
        toast.success('Track removed from offline');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Remove failed:', error);
      return false;
    }
  }, [offlineTracks, sendMessage, updateCacheStats]);

  // Check if a track is cached
  const isTrackCached = useCallback((trackId: string): boolean => {
    return offlineTracks.some(t => t.trackId === trackId);
  }, [offlineTracks]);

  // Check if a track is currently downloading
  const isTrackDownloading = useCallback((trackId: string): boolean => {
    return downloadingTracks.has(trackId);
  }, [downloadingTracks]);

  // Clear all offline tracks
  const clearAllOfflineTracks = useCallback(async (): Promise<boolean> => {
    try {
      const result = await sendMessage({ type: 'CLEAR_CACHE' });
      
      if (result.success) {
        setOfflineTracks([]);
        setCacheStats({ totalSize: 0, trackCount: 0 });
        toast.success('All offline tracks cleared');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Clear cache failed:', error);
      return false;
    }
  }, [sendMessage]);

  // Format bytes to human readable
  const formatSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  return {
    offlineTracks,
    cacheStats,
    isServiceWorkerReady,
    downloadingTracks: Array.from(downloadingTracks),
    downloadTrack,
    removeOfflineTrack,
    isTrackCached,
    isTrackDownloading,
    clearAllOfflineTracks,
    formatSize,
    updateCacheStats,
  };
}
