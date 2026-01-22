// Push notification service worker for Psycho-Cinematics™
// Version: 2.0 - Enhanced push handling

self.addEventListener('install', (event) => {
  console.log('[SW-Push] Installing service worker v2...');
  // Force immediate activation
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW-Push] Activating service worker v2...');
  event.waitUntil(
    Promise.all([
      clients.claim(),
      // Clear any old caches if needed
      caches.keys().then(names => 
        Promise.all(names.map(name => caches.delete(name)))
      )
    ])
  );
});

self.addEventListener('push', (event) => {
  console.log('[SW-Push] Push event received');
  
  // Default notification data
  let notificationData = {
    title: 'Psycho-Cinematics™',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url: '/',
    tag: 'psycho-cinematics-' + Date.now(),
  };

  // Parse push data
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[SW-Push] Parsed payload:', payload);
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        url: payload.url || notificationData.url,
        tag: payload.tag || notificationData.tag,
      };
    } catch (e) {
      console.log('[SW-Push] Error parsing JSON, trying text:', e);
      try {
        notificationData.body = event.data.text() || notificationData.body;
      } catch (_) {
        console.log('[SW-Push] Could not extract push data');
      }
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: { 
      url: notificationData.url,
      timestamp: Date.now()
    },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
      .then(() => {
        console.log('[SW-Push] Notification displayed successfully');
        // Broadcast to open windows
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      })
      .then(windowClients => {
        windowClients.forEach(client => {
          client.postMessage({ 
            type: 'PUSH_RECEIVED', 
            payload: notificationData 
          });
        });
      })
      .catch(err => {
        console.error('[SW-Push] Failed to show notification:', err);
      })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW-Push] Notification clicked, action:', event.action);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Try to focus an existing window
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.navigate(urlToOpen).then(() => client.focus());
          }
        }
        // Open a new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW-Push] Notification closed');
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW-Push] Subscription changed, re-subscribing...');
  // This would require re-subscribing - notify the main app
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SUBSCRIPTION_EXPIRED' });
        });
      })
  );
});
