import { Router } from 'express';
import { authenticateAdmin, isAdmin } from '../middleware/auth.middleware';
import { login } from '../controllers/admin/auth.controller';
import { getDashboardStats } from '../controllers/admin/dashboard.controller';
import {
    getAllRaffles,
    createRaffle,
    updateRaffle,
    deleteRaffle,
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
} from '../controllers/admin/admin.controller';
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

// Admin Users (Management) - SOLO ADMINS
router.get('/admin-users', isAdmin, getAdmins);
router.post('/admin-users', isAdmin, createAdmin);
router.put('/admin-users/:id', isAdmin, updateAdmin);
router.delete('/admin-users/:id', isAdmin, deleteAdmin);

// Push Notifications
router.get('/push/vapid-key', (_req, res) => {
    const key = getVapidPublicKey();
    if (!key) return res.status(503).json({ error: 'Push notifications no configuradas (falta VAPID_PUBLIC_KEY)' });
    res.json({ publicKey: key });
});

router.post('/push/subscribe', async (req, res) => {
    try {
        const { endpoint, keys } = req.body;
        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return res.status(400).json({ error: 'Datos de suscripción inválidos' });
        }
        await prisma.pushSubscription.upsert({
            where: { endpoint },
            create: { endpoint, p256dh: keys.p256dh, auth: keys.auth },
            update: { p256dh: keys.p256dh, auth: keys.auth },
        });
        console.log('📲 Nueva suscripción push registrada');
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/push/subscribe', async (req, res) => {
    try {
        const { endpoint } = req.body;
        if (!endpoint) return res.status(400).json({ error: 'endpoint requerido' });
        await prisma.pushSubscription.deleteMany({ where: { endpoint } });
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Test de notificación (solo en desarrollo o para el admin)
router.post('/push/test', async (_req, res) => {
    await sendPushToAdmins({
        title: '🔔 Prueba de notificación',
        body: 'Las notificaciones push funcionan correctamente.',
        tag: 'test',
    });
    res.json({ success: true });
});

export default router;






