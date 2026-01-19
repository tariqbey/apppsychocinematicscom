// Service Worker for offline audio caching
const CACHE_NAME = 'score-audio-cache-v1';
const OFFLINE_TRACKS_STORE = 'offline-tracks';

// Install event - set up cache
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('score-audio-cache-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache if available
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only intercept audio file requests
  if (event.request.url.includes('/storage/') && 
      (event.request.url.includes('.mp3') || 
       event.request.url.includes('.wav') || 
       event.request.url.includes('.ogg') ||
       event.request.url.includes('.m4a') ||
       event.request.url.includes('audio'))) {
    
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', event.request.url);
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(event.request).then((networkResponse) => {
          return networkResponse;
        }).catch((error) => {
          console.error('[SW] Fetch failed:', error);
          throw error;
        });
      })
    );
  }
});

// Message handler for cache operations
self.addEventListener('message', async (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'CACHE_TRACK':
      try {
        const cache = await caches.open(CACHE_NAME);
        const response = await fetch(payload.url);
        
        if (response.ok) {
          await cache.put(payload.url, response.clone());
          event.ports[0].postMessage({ 
            success: true, 
            trackId: payload.trackId,
            size: response.headers.get('content-length') || 0
          });
        } else {
          event.ports[0].postMessage({ 
            success: false, 
            error: 'Failed to fetch track' 
          });
        }
      } catch (error) {
        event.ports[0].postMessage({ 
          success: false, 
          error: error.message 
        });
      }
      break;
      
    case 'REMOVE_TRACK':
      try {
        const cache = await caches.open(CACHE_NAME);
        const deleted = await cache.delete(payload.url);
        event.ports[0].postMessage({ success: deleted });
      } catch (error) {
        event.ports[0].postMessage({ 
          success: false, 
          error: error.message 
        });
      }
      break;
      
    case 'CHECK_CACHED':
      try {
        const cache = await caches.open(CACHE_NAME);
        const response = await cache.match(payload.url);
        event.ports[0].postMessage({ 
          cached: !!response,
          trackId: payload.trackId
        });
      } catch (error) {
        event.ports[0].postMessage({ 
          cached: false, 
          error: error.message 
        });
      }
      break;
      
    case 'GET_CACHE_SIZE':
      try {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        let totalSize = 0;
        
        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.clone().blob();
            totalSize += blob.size;
          }
        }
        
        event.ports[0].postMessage({ 
          success: true, 
          size: totalSize,
          count: keys.length
        });
      } catch (error) {
        event.ports[0].postMessage({ 
          success: false, 
          error: error.message 
        });
      }
      break;
      
    case 'CLEAR_CACHE':
      try {
        await caches.delete(CACHE_NAME);
        event.ports[0].postMessage({ success: true });
      } catch (error) {
        event.ports[0].postMessage({ 
          success: false, 
          error: error.message 
        });
      }
      break;
  }
});
