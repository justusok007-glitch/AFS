// Al Furqan School: shows push notifications even when the app is closed.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// which screen a notification opens
const TAB_FOR_KIND = { diary: 'diary', voucher: 'fees', result: 'results', absent: 'attendance', late: 'attendance', leave: 'attendance' };
function tabFor(d) {
  if (d.data && d.data.tab) return d.data.tab;
  return TAB_FOR_KIND[String(d.tag || '').split('-')[0]] || '';
}

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
      data: { tab: tabFor(d) },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const tab = (event.notification.data && event.notification.data.tab) || '';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) {
          return c.focus().then(() => {
            if (tab) c.postMessage({ type: 'afs-open-tab', tab });
          });
        }
      }
      return self.clients.openWindow(self.registration.scope + (tab ? '?tab=' + tab : ''));
    })
  );
});
