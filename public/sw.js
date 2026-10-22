// Al Furqan School: shows push notifications even when the app is closed.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let d = {};
  try {
    d = event.data ? event.data.json() : {};
  } catch (e) {
    d = {};
  }
  event.waitUntil(
    self.registration.showNotification(d.title || 'Al Furqan School Okara', {
      body: d.body || '',
      icon: 'school-launcher-icon.png',
      badge: 'school-launcher-icon.png',
      tag: d.tag || undefined,
      dir: d.dir || 'auto',
      lang: d.lang || undefined,
      data: d.data || {},
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      return self.clients.openWindow(self.registration.scope);
    })
  );
});
