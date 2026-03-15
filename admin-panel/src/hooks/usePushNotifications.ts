import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
    const [permission, setPermission] = useState<PermissionState>('default');
    const [loading, setLoading] = useState(false);
    const [subscribed, setSubscribed] = useState(false);

    const isSupported =
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window;

    useEffect(() => {
        if (!isSupported) {
            setPermission('unsupported');
            return;
        }
        setPermission(Notification.permission as PermissionState);

        // Verificar si ya hay suscripción activa
        navigator.serviceWorker.ready.then((reg) => {
            reg.pushManager.getSubscription().then((sub) => {
                setSubscribed(!!sub);
            });
        });
    }, [isSupported]);

    const subscribe = useCallback(async () => {
        if (!isSupported) return;
        setLoading(true);
        try {
            // Registrar service worker
            const reg = await navigator.serviceWorker.register('/admin/sw.js', { scope: '/admin/' });
            await navigator.serviceWorker.ready;

            // Obtener VAPID public key del backend
            const { data } = await api.get('/admin/push/vapid-key');
            const applicationServerKey = urlBase64ToUint8Array(data.publicKey);

            // Solicitar permiso y suscribir
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey,
            });

            // Enviar suscripción al backend
            const subJson = sub.toJSON();
            await api.post('/admin/push/subscribe', {
                endpoint: subJson.endpoint,
                keys: subJson.keys,
            });

            setPermission('granted');
            setSubscribed(true);
            console.log('✅ Suscripción push registrada');
        } catch (err: any) {
            console.error('Error al suscribirse a notificaciones:', err);
            if (err.name === 'NotAllowedError') setPermission('denied');
        } finally {
            setLoading(false);
        }
    }, [isSupported]);

    const unsubscribe = useCallback(async () => {
        if (!isSupported) return;
        setLoading(true);
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                await api.delete('/admin/push/subscribe', { data: { endpoint: sub.endpoint } });
                await sub.unsubscribe();
            }
            setSubscribed(false);
        } catch (err) {
            console.error('Error al cancelar suscripción:', err);
        } finally {
            setLoading(false);
        }
    }, [isSupported]);

    const sendTest = useCallback(async () => {
        await api.post('/admin/push/test');
    }, []);

    return { permission, subscribed, loading, subscribe, unsubscribe, sendTest, isSupported };
}
