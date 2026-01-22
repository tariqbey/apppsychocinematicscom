// Unified Service Worker v4.0 - Handles BOTH offline audio AND push notifications
const CACHE_NAME = 'offline-tracks-v4';
const AUDIO_CACHE_NAME = 'audio-files-v4';

// ============== PUSH NOTIFICATION HANDLING ==============
self.addEventListener('push', function(event) {
  console.log('[SW v4] Push event received');
  
  if (!event.data) {
    console.log('[SW v4] Push event has no data');
    return;
  }

  let data;
  try {
    data = event.data.json();
    console.log('[SW v4] Push data:', data);
  } catch (e) {
    console.error('[SW v4] Failed to parse push data:', e);
    data = {
      title: 'Psycho-Cinematics',
      body: event.data.text(),
      icon: '/icon-192.png'
    };
  }

  const options = {
    body: data.body || 'New notification',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now()
    },
    actions: data.actions || [],
    requireInteraction: false,
    tag: data.tag || 'psycho-cinematics-notification'
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Psycho-Cinematics', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[SW v4] Notification click received');
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// ============== OFFLINE AUDIO CACHING ==============
self.addEventListener('install', (event) => {
  console.log('[SW v4] Installing unified service worker...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW v4] Activating unified service worker...');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== AUDIO_CACHE_NAME && 
                (cacheName.startsWith('offline-tracks') || cacheName.startsWith('score-audio'))) {
              console.log('[SW v4] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only handle audio file requests for caching
  if (event.request.url.includes('/storage/') && 
      (event.request.url.includes('.mp3') || 
       event.request.url.includes('.wav') || 
       event.request.url.includes('.m4a') ||
       event.request.url.includes('.ogg') ||
       event.request.url.includes('audio'))) {
    
    event.respondWith(
      // NETWORK-FIRST: Try network, fall back to cache
      fetch(event.request)
        .then((networkResponse) => {
          // Cache successful responses
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(AUDIO_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          console.log('[SW v4] Network failed, trying cache:', url.pathname);
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            console.log('[SW v4] Serving from cache:', url.pathname);
            return cachedResponse;
          }
          throw new Error('No cache available');
        })
    );
  }
});

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  const { type, payload } = event.data || {};
  console.log('[SW v4] Message received:', type);
  
  switch (type) {
    case 'CACHE_TRACK':
      try {
        const cache = await caches.open(AUDIO_CACHE_NAME);
        const response = await fetch(payload.url);
        
        if (response.ok) {
          await cache.put(payload.url, response.clone());
          event.ports[0]?.postMessage({ 
            success: true, 
            trackId: payload.trackId,
            size: response.headers.get('content-length') || 0
          });
        } else {
          event.ports[0]?.postMessage({ 
            success: false, 
            error: 'Failed to fetch track' 
          });
        }
      } catch (error) {
        event.ports[0]?.postMessage({ 
          success: false, 
          error: error.message 
        });
      }
      break;
      
    case 'REMOVE_TRACK':
      try {
        const cache = await caches.open(AUDIO_CACHE_NAME);
        const deleted = await cache.delete(payload.url);
        event.ports[0]?.postMessage({ success: deleted });
      } catch (error) {
        event.ports[0]?.postMessage({ 
          success: false, 
          error: error.message 
        });
      }
      break;
      
    case 'CHECK_CACHED':
      try {
        const cache = await caches.open(AUDIO_CACHE_NAME);
        const response = await cache.match(payload.url);
        event.ports[0]?.postMessage({ 
          cached: !!response,
          trackId: payload.trackId
        });
      } catch (error) {
        event.ports[0]?.postMessage({ 
          cached: false, 
          error: error.message 
        });
      }
      break;
      
    case 'GET_CACHE_SIZE':
      try {
        const cache = await caches.open(AUDIO_CACHE_NAME);
        const keys = await cache.keys();
        let totalSize = 0;
        
        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.clone().blob();
            totalSize += blob.size;
          }
        }
        
        event.ports[0]?.postMessage({ 
          success: true, 
          size: totalSize,
          count: keys.length
        });
      } catch (error) {
        event.ports[0]?.postMessage({ 
          success: false, 
          error: error.message 
        });
      }
      break;
      
    case 'CLEAR_CACHE':
      try {
        await caches.delete(AUDIO_CACHE_NAME);
        event.ports[0]?.postMessage({ success: true });
      } catch (error) {
        event.ports[0]?.postMessage({ 
          success: false, 
          error: error.message 
        });
      }
      break;

    case 'CACHE_AUDIO':
      // Legacy support for audio caching
      try {
        const cache = await caches.open(AUDIO_CACHE_NAME);
        const response = await fetch(payload?.url || event.data?.url);
        if (response.ok) {
          await cache.put(payload?.url || event.data?.url, response.clone());
          console.log('[SW v4] Pre-cached audio');
        }
      } catch (error) {
        console.error('[SW v4] Cache audio error:', error);
      }
      break;

    case 'CLEAR_AUDIO_CACHE':
      try {
        await caches.delete(AUDIO_CACHE_NAME);
        console.log('[SW v4] Audio cache cleared');
      } catch (error) {
        console.error('[SW v4] Clear cache error:', error);
      }
      break;
  }
});

console.log('[SW v4] Unified service worker loaded - Push + Offline Audio');
