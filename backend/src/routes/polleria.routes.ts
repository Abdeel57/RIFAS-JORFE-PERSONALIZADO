import { Router } from 'express';
import { getConfig, updateConfig, getTakenTickets, claimTickets } from '../controllers/polleria.controller';

const router = Router();

const ADMIN_SECRET = process.env.PROMO_ADMIN_SECRET || 'pollos-admin-2024';
const checkAdmin = (req: any, res: any, next: any) => {
    if (req.headers['x-admin-key'] !== ADMIN_SECRET) {
        return res.status(401).json({ success: false, error: 'No autorizado' });
    }
    next();
};

// Públicas
router.get('/config', getConfig);
router.get('/tickets', getTakenTickets);
router.post('/tickets', claimTickets);

// Admin
router.put('/config', checkAdmin, updateConfig);

export default router;
