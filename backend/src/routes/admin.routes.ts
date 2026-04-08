import { Router } from 'express';
import { authenticateAdmin, isAdmin, isSuperAdmin, AuthRequest } from '../middleware/auth.middleware';
import { login } from '../controllers/admin/auth.controller';
import { getDashboardStats } from '../controllers/admin/dashboard.controller';
import {
    getAllRaffles,
    createRaffle,
    updateRaffle,
    deleteRaffle,
    importTickets,
} from '../controllers/admin/raffle.controller';
import {
    getTickets,
    updateTicket,
} from '../controllers/admin/ticket.controller';
import {
    getPurchases,
    getPurchaseById,
    updatePurchaseStatus,
} from '../controllers/admin/purchase.controller';
import {
    getUsers,
    getUserById,
    updateUser as updateUserController,
} from '../controllers/admin/user.controller';
import {
    getAdmins,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    setAdminPlan,
} from '../controllers/admin/admin.controller';
import {
    listPromoCodes,
    createPromoCode,
    deletePromoCode,
} from '../controllers/admin/promoCode.controller';
import { uploadImage } from '../controllers/image.controller';
import { uploadImageMiddleware } from '../middleware/upload.middleware';
import { getVapidPublicKey, sendPushToAdmins } from '../services/pushNotificationService';
import prisma from '../config/database';

const router = Router();

// Auth (público)
router.post('/auth/login', login);

// Diagnóstico de login (público, para depuración)
router.get('/auth/check', async (_req, res) => {
    try {
        const jwtOk = !!(process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32);
        const adminCount = await prisma.admin.count();
        const bismarkExists = await prisma.admin.findUnique({ where: { email: 'Bismark' } }).then(Boolean);
        res.json({
            jwtConfigured: jwtOk,
            adminCount,
            bismarkExists,
            hint: !jwtOk ? 'Configura JWT_SECRET (mín. 32 caracteres) en Railway' : !bismarkExists ? 'Ejecuta el seed: railway run npx tsx src/scripts/seed.ts' : 'Todo OK',
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message, hint: 'Revisa DATABASE_URL' });
    }
});

// Promo Codes — accesibles sin JWT (protegidos por CORS + secret header)
const PROMO_SECRET = process.env.PROMO_ADMIN_SECRET || 'pollos-admin-2024';
const checkPromoSecret = (req: any, res: any, next: any) => {
    if (req.headers['x-admin-key'] !== PROMO_SECRET) {
        return res.status(401).json({ success: false, error: 'No autorizado' });
    }
    next();
};
router.get('/promo-codes', checkPromoSecret, listPromoCodes);
router.post('/promo-codes', checkPromoSecret, createPromoCode);
router.delete('/promo-codes/:id', checkPromoSecret, deletePromoCode);

// Todas las rutas siguientes requieren autenticación
router.use(authenticateAdmin);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Upload de imagen (desde dispositivo → BD, alta calidad)
router.post('/upload-image', uploadImageMiddleware, uploadImage);

// Raffles
router.get('/raffles', getAllRaffles);
router.post('/raffles', createRaffle);
router.put('/raffles/:id', updateRaffle);
router.delete('/raffles/:id', isAdmin, deleteRaffle);
router.post('/raffles/:id/import-tickets', importTickets);

// Tickets
router.get('/tickets', getTickets);
router.put('/tickets/:id', updateTicket);

// Purchases
router.get('/purchases', getPurchases);
router.get('/purchases/:id', getPurchaseById);
router.put('/purchases/:id/status', updatePurchaseStatus);

// Users (Raffle Participants)
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUserController);

// Admin Users (Management) - SOLO SUPER ADMIN
router.get('/admin-users', isSuperAdmin, getAdmins);
router.post('/admin-users', isSuperAdmin, createAdmin);
router.put('/admin-users/:id', isSuperAdmin, updateAdmin);
router.delete('/admin-users/:id', isSuperAdmin, deleteAdmin);
router.put('/admin-users/:id/plan', isSuperAdmin, setAdminPlan);

// Push Notifications — solo admins y super_admins (no vendedores)
router.get('/push/vapid-key', isAdmin, (_req, res) => {
    const key = getVapidPublicKey();
    if (!key) return res.status(503).json({ error: 'Push notifications no configuradas (falta VAPID_PUBLIC_KEY)' });
    res.json({ publicKey: key });
});

router.post('/push/subscribe', isAdmin, async (req: AuthRequest, res) => {
    try {
        const { endpoint, keys } = req.body;
        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return res.status(400).json({ error: 'Datos de suscripción inválidos' });
        }
        await prisma.pushSubscription.upsert({
            where: { endpoint },
            create: {
                endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth,
                adminId: req.admin!.id,
                adminRole: req.admin!.role,
            },
            update: {
                p256dh: keys.p256dh,
                auth: keys.auth,
                adminId: req.admin!.id,
                adminRole: req.admin!.role,
            },
        });
        console.log(`📲 Suscripción push registrada — ${req.admin!.email} (${req.admin!.role})`);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/push/subscribe', isAdmin, async (req, res) => {
    try {
        const { endpoint } = req.body;
        if (!endpoint) return res.status(400).json({ error: 'endpoint requerido' });
        await prisma.pushSubscription.deleteMany({ where: { endpoint } });
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Test de notificación (solo admins)
router.post('/push/test', isAdmin, async (_req, res) => {
    await sendPushToAdmins({
        title: '🔔 Prueba de notificación',
        body: 'Las notificaciones push funcionan correctamente.',
        tag: 'test',
    });
    res.json({ success: true });
});

export default router;






