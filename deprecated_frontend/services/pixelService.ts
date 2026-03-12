
/**
 * Servicio para manejar Meta Pixel (Facebook Pixel) de forma dinámica y profesional.
 */

declare global {
    interface Window {
        fbq: any;
        _fbq: any;
    }
}

class PixelService {
    private pixelId: string | null = null;
    private isInitialized = false;

    /**
     * Inicializa el Pixel con el ID proporcionado. 
     * Inyecta el script base solo si es necesario.
     */
    init(id: string) {
        if (!id || id === this.pixelId) return;
        this.pixelId = id;

        // Script base de Meta Pixel
        if (!window.fbq) {
            (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
                if (f.fbq) return;
                n = f.fbq = function () {
                    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
                };
                if (!f._fbq) f._fbq = n;
                n.push = n;
                n.loaded = !0;
                n.version = '2.0';
                n.queue = [];
                t = b.createElement(e);
                t.async = !0;
                t.src = v;
                s = b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t, s);
            })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
        }

        window.fbq('init', id);
        this.isInitialized = true;
        console.log(`[Pixel] Inicializado con ID: ${id}`);

        // PageView automático al inicializar
        this.track('PageView');
    }

    /**
     * Rastrea un evento estándar o personalizado.
     */
    track(eventName: string, params?: Record<string, any>) {
        if (!this.isInitialized || !window.fbq) return;

        if (params) {
            window.fbq('track', eventName, params);
        } else {
            window.fbq('track', eventName);
        }
    }

    /**
     * Evento específico para ver una rifa
     */
    trackViewContent(raffle: any) {
        this.track('ViewContent', {
            content_name: raffle.title,
            content_ids: [raffle.id],
            content_type: 'product',
            value: raffle.ticketPrice,
            currency: 'MXN'
        });
    }

    /**
     * Evento al abrir el modal de compra
     */
    trackInitiateCheckout(raffle: any, ticketCount: number) {
        this.track('InitiateCheckout', {
            content_name: raffle.title,
            content_category: 'Rifas',
            num_items: ticketCount,
            value: raffle.ticketPrice * ticketCount,
            currency: 'MXN'
        });
    }

    /**
     * Evento al subir el comprobante (considerado "compra" según requerimiento del usuario)
     */
    trackPurchase(purchase: any) {
        this.track('Purchase', {
            content_name: purchase.raffleTitle || 'Rifa',
            content_ids: [purchase.raffleId],
            content_type: 'product',
            value: purchase.total,
            currency: 'MXN',
            num_items: purchase.tickets?.length || 0
        });
    }
}

export const pixelService = new PixelService();
