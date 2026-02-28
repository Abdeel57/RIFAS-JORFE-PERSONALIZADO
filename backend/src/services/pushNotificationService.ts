import webpush from 'web-push';
import prisma from '../config/database';

let initialized = false;

function init() {
    if (initialized) return;
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) {
        console.warn('⚠️  VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY no configuradas — notificaciones push desactivadas');
        return;
    }
    webpush.setVapidDetails('mailto:admin@rifasnao.com', publicKey, privateKey);
    initialized = true;
}

export interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    url?: string;  // URL a abrir al hacer click
    tag?: string;  // agrupa notificaciones del mismo tipo
}

/**
 * Envía una notificación push a todas las suscripciones registradas del admin.
 * Si una suscripción expiró o es inválida se elimina automáticamente.
 */
export async function sendPushToAdmins(payload: PushPayload): Promise<void> {
    init();
    if (!initialized) return;

    const subscriptions = await prisma.pushSubscription.findMany();
    if (subscriptions.length === 0) return;

    const message = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/admin/icon-192.png',
        badge: payload.badge || '/admin/icon-72.png',
        url: payload.url || '/admin',
        tag: payload.tag || 'rifas-nao',
    });

    const results = await Promise.allSettled(
        subscriptions.map(sub =>
            webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                message
            )
        )
    );

    // Eliminar suscripciones expiradas/inválidas (410 Gone, 404 Not Found)
    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'rejected') {
            const status = (result.reason as any)?.statusCode;
            if (status === 404 || status === 410) {
                await prisma.pushSubscription.delete({ where: { id: subscriptions[i].id } }).catch(() => {});
                console.log('🗑  Suscripción push expirada eliminada');
            } else {
                console.warn('⚠️  Error enviando push:', result.reason?.message || result.reason);
            }
        }
    }

    const sent = results.filter(r => r.status === 'fulfilled').length;
    if (sent > 0) console.log(`📲 Push enviado a ${sent} dispositivo(s)`);
}

/** Devuelve la VAPID public key para que el frontend pueda suscribirse */
export function getVapidPublicKey(): string | null {
    return process.env.VAPID_PUBLIC_KEY || null;
}
