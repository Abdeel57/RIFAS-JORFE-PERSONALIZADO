// Service Worker — Bismark Admin
const CACHE = 'bismark-admin-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Cache de recursos estáticos (permite uso offline básico)
self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;
    // No cachear API ni rutas push
    if (url.pathname.startsWith('/api/') || url.pathname.includes('/push')) return;

    event.respondWith(
        caches.open(CACHE).then(async (cache) => {
            const cached = await cache.match(request);
            const fetchPromise = fetch(request)
                .then((res) => {
                    if (res.ok) cache.put(request, res.clone());
                    return res;
                })
                .catch(() => cached);
            return cached || fetchPromise;
        })
    );
});

// ── Push Notifications ──────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data = {};
    try { data = event.data.json(); } catch { data = { title: 'Bismark', body: event.data.text() }; }

    const options = {
        body: data.body || '',
        icon: data.icon || '/admin/icon-192.png',
        badge: data.badge || '/admin/icon-72.png',
        tag: data.tag || 'bismark-admin',
        vibrate: [500, 110, 500, 110, 450, 110, 200, 110, 170, 40, 450, 110, 200, 110, 170, 40, 500], // Patrón de vibración más intenso
        sound: '/admin/notification.mp3',
        renotify: true,
        silent: false, // Forzar a que no sea silenciosa
        requireInteraction: true, // Mantener visible hasta que el usuario actúe
        data: { url: data.url || '/admin' },
        actions: [
            { action: 'open', title: 'Ver Pedido' },
            { action: 'dismiss', title: 'Ignorar' },
        ],
    };

    event.waitUntil(
        Promise.all([
            self.registration.showNotification(data.title || 'Bismark', options),
            self.clients.matchAll({ type: 'window' }).then(clients => {
                clients.forEach(client => client.postMessage({
                    type: 'PUSH_RECEIVED',
                    title: data.title,
                    body: data.body
                }));
            })
        ])
    );

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
