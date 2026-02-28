// Service Worker — Rifas NAO Admin Push Notifications
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data = {};
    try { data = event.data.json(); } catch { data = { title: 'Rifas NAO', body: event.data.text() }; }

    const options = {
        body: data.body || '',
        icon: data.icon || '/admin/icon-192.png',
        badge: data.badge || '/admin/icon-72.png',
        tag: data.tag || 'rifas-nao',
        renotify: true,
        requireInteraction: data.tag === 'alerta', // notificaciones de alerta persisten
        data: { url: data.url || '/admin' },
        actions: [
            { action: 'open', title: 'Abrir panel' },
            { action: 'dismiss', title: 'Descartar' },
        ],
    };

    event.waitUntil(self.registration.showNotification(data.title || 'Rifas NAO', options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'dismiss') return;

    const url = event.notification.data?.url || '/admin';
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            const existing = clients.find((c) => c.url.includes('/admin'));
            if (existing) return existing.focus();
            return self.clients.openWindow(url);
        })
    );
});
