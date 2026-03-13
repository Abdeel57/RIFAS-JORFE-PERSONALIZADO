import { Router, Request, Response } from 'express';
import { authenticateAdmin, isAdmin } from '../middleware/auth.middleware';

const router = Router();

// ─── OG Preview Proxy ─────────────────────────────────────────────────────────
// GET /api/settings/og-preview?url=<encoded_facebook_url>
// Public endpoint — proxies the request server-side to avoid CORS, then extracts
// Open Graph meta tags (<og:title>, <og:description>, <og:image>) from the HTML.
router.get('/og-preview', async (req: Request, res: Response) => {
    const rawUrl = req.query.url as string | undefined;

    if (!rawUrl) {
        return res.status(400).json({ success: false, error: 'Parámetro "url" requerido' });
    }

    // Validate that it is a parseable URL
    let targetUrl: URL;
    try {
        targetUrl = new URL(rawUrl);
    } catch {
        return res.status(400).json({ success: false, error: 'URL inválida' });
    }

    // Only http/https allowed
    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
        return res.status(400).json({ success: false, error: 'Solo se permiten URLs http/https' });
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(targetUrl.toString(), {
            signal: controller.signal,
            headers: {
                // Impersonate a generic browser to get proper OG tags from Facebook
                'User-Agent':
                    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                Accept: 'text/html,application/xhtml+xml',
                'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
            },
            redirect: 'follow',
        });

        clearTimeout(timeout);

        if (!response.ok) {
            return res.status(502).json({
                success: false,
                error: `La URL respondió con estado ${response.status}`,
            });
        }

        const html = await response.text();

        // ── Extract OG / fallback meta tags with a lightweight regex parser ──
        const getMeta = (property: string): string => {
            // og:xxx  —  property="og:xxx"  or  name="og:xxx"
            const match =
                html.match(
                    new RegExp(
                        `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
                        'i',
                    ),
                ) ||
                html.match(
                    new RegExp(
                        `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
                        'i',
                    ),
                );
            return match ? match[1].trim() : '';
        };

        const title =
            getMeta('og:title') ||
            getMeta('twitter:title') ||
            (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? '').trim();

        const description =
            getMeta('og:description') ||
            getMeta('description') ||
            getMeta('twitter:description');

        const image =
            getMeta('og:image') ||
            getMeta('twitter:image') ||
            getMeta('twitter:image:src');

        const siteName = getMeta('og:site_name');

        return res.json({
            success: true,
            data: {
                title: title.slice(0, 120),
                description: description.slice(0, 200),
                image,
                siteName,
                url: targetUrl.toString(),
            },
        });
    } catch (err: any) {
        if (err.name === 'AbortError') {
            return res.status(504).json({ success: false, error: 'La URL tardó demasiado en responder' });
        }
        console.error('[og-preview] Error:', err.message);
        return res.status(502).json({ success: false, error: 'No se pudo obtener el preview' });
    }
});

// ─── Settings CRUD ────────────────────────────────────────────────────────────
import {
    getSettings,
    updateSettings,
    getPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod
} from '../controllers/settings.controller';

// Public route for frontend to fetch settings (bank details, etc)
router.get('/', getSettings);

// Admin only route to update settings
router.put('/', authenticateAdmin, isAdmin, updateSettings);

// Payment Methods
router.get('/payment-methods', authenticateAdmin, isAdmin, getPaymentMethods);
router.post('/payment-methods', authenticateAdmin, isAdmin, createPaymentMethod);
router.put('/payment-methods/:id', authenticateAdmin, isAdmin, updatePaymentMethod);
router.delete('/payment-methods/:id', authenticateAdmin, isAdmin, deletePaymentMethod);

export default router;

