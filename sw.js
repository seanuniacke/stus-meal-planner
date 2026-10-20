// MealFlow Service Worker v0.9.9
// Provides the PWA app shell plus Web Push notification handling.

const CACHE_NAME = 'stus-meal-planner-v0.9.9';

const ASSETS_TO_CACHE = [
  './',
  './index.html'
];

// --------------------------------------------------
// INSTALL
// --------------------------------------------------
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .catch(error => {
        console.warn('MealFlow cache install warning:', error);
      })
  );

  self.skipWaiting();
});

// --------------------------------------------------
// ACTIVATE
// --------------------------------------------------
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );

  self.clients.claim();
});

// --------------------------------------------------
// FETCH / OFFLINE SUPPORT
// --------------------------------------------------
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseClone = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });

        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;

          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }

          return Response.error();
        });
      })
  );
});

// --------------------------------------------------
// WEB PUSH NOTIFICATIONS
// --------------------------------------------------
self.addEventListener('push', event => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = {
      title: 'MealFlow',
      body: event.data ? event.data.text() : 'You have a new MealFlow reminder.'
    };
  }

  const title = payload.title || 'MealFlow';

  const options = {
    body: payload.body || 'You have a new MealFlow reminder.',
    icon: payload.icon || './icons/icon-192.png',
    badge: payload.badge || './icons/icon-192.png',
    tag: payload.tag || 'mealflow-notification',
    renotify: true,
    data: {
      url: payload.url || './',
      ...(payload.data || {})
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// --------------------------------------------------
// NOTIFICATION CLICK
// --------------------------------------------------
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl =
    event.notification.data?.url ||
    './';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {

      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});