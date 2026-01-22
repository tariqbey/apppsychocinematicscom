// Push notification service worker for Psycho-Cinematics™
// Version: 3.0 - iOS Safari support + multi-device reliability

const SW_VERSION = '3.0';

self.addEventListener('install', (event) => {
  console.log(`[SW-Push v${SW_VERSION}] Installing...`);
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log(`[SW-Push v${SW_VERSION}] Activating...`);
  event.waitUntil(
    Promise.all([
      clients.claim(),
      // Clean up old caches
      caches.keys().then(names => 
        Promise.all(names.map(name => {
          console.log(`[SW-Push] Clearing cache: ${name}`);
          return caches.delete(name);
        }))
      )
    ]).then(() => {
      console.log(`[SW-Push v${SW_VERSION}] Activated and claimed clients`);
    })
  );
});

self.addEventListener('push', (event) => {
  console.log(`[SW-Push v${SW_VERSION}] Push event received`);
  
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
      console.log(`[SW-Push v${SW_VERSION}] Parsed payload:`, JSON.stringify(payload));
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        url: payload.url || notificationData.url,
        tag: payload.tag || notificationData.tag,
      };
    } catch (e) {
      console.log(`[SW-Push v${SW_VERSION}] Error parsing JSON, trying text:`, e.message);
      try {
        const text = event.data.text();
        if (text) {
          notificationData.body = text;
        }
      } catch (_) {
        console.log(`[SW-Push v${SW_VERSION}] Could not extract push data`);
      }
    }
  } else {
    console.log(`[SW-Push v${SW_VERSION}] No data in push event`);
  }

  // iOS Safari doesn't support actions, so check for support
  const supportsActions = 'actions' in Notification.prototype;
  
  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    renotify: true,
    requireInteraction: false, // iOS doesn't support this well
    data: { 
      url: notificationData.url,
      timestamp: Date.now()
    },
  };

  // Only add vibrate and actions if supported (not on iOS Safari)
  if ('vibrate' in navigator) {
    options.vibrate = [200, 100, 200];
  }
  
  if (supportsActions) {
    options.actions = [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ];
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
      .then(() => {
        console.log(`[SW-Push v${SW_VERSION}] Notification displayed successfully`);
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
        console.error(`[SW-Push v${SW_VERSION}] Failed to show notification:`, err.message);
      })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log(`[SW-Push v${SW_VERSION}] Notification clicked, action:`, event.action);
  
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
  console.log(`[SW-Push v${SW_VERSION}] Notification closed`);
});

// Handle push subscription change (token refresh)
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log(`[SW-Push v${SW_VERSION}] Subscription changed, notifying app...`);
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SUBSCRIPTION_EXPIRED' });
        });
      })
  );
});

// Log any errors
self.addEventListener('error', (event) => {
  console.error(`[SW-Push v${SW_VERSION}] Error:`, event.message);
});

console.log(`[SW-Push v${SW_VERSION}] Service worker loaded`);
