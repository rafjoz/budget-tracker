const CACHE_NAME = 'spendie-v3.1';
const ASSETS = ['./', './index.html', './manifest.json', './Icon.png', './Logo.png'];

// ── INSTALL ──────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

// ── ACTIVATE ─────────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH ────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});

// ── MESSAGES (skip waiting + schedule notifications) ─────────
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();

  if (e.data?.type === 'SCHEDULE_NOTIFICATIONS') {
    const { recurringTime, clockinTime, hasRecurring, clockinEnabled } = e.data;
    // Store settings so we can reference them in notificationclick
    self.notifSettings = { recurringTime, clockinTime, hasRecurring, clockinEnabled };
  }
});

// ── NOTIFICATION CLICK ────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length > 0) {
        const client = list[0];
        client.focus();
        client.postMessage({ type: 'NOTIF_CLICK', tag: e.notification.tag });
      } else {
        clients.openWindow('./');
      }
    })
  );
});