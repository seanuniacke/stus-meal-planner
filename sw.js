/* MealFlow Service Worker v2
   - No HTML/app caching: GitHub Pages always serves the current app.
   - Clears caches left by older Home Assistant/offline builds.
   - Keeps the service worker available for Web Push notifications.
*/
const SW_VERSION = 'mealflow-sw-v2';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = { body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'MealFlow';
  const options = {
    body: data.body || 'You have a MealFlow update.',
    icon: data.icon || './manifest-icon-192.png',
    badge: data.badge || './manifest-icon-192.png',
    tag: data.tag || 'mealflow-notification',
    data: { url: data.url || './' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification.data?.url || './';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
