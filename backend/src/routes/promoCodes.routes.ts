import { Router, Request, Response } from 'express';
import prisma from '../config/database';

const router = Router();

// GET /api/promo-codes/validate/:code
// Verifica si el código es válido sin consumirlo
router.get('/validate/:code', async (req: Request, res: Response) => {
    try {
        const code = req.params.code.trim().toUpperCase();
        const promo = await prisma.promoCode.findUnique({ where: { code } });
        if (!promo || !promo.active || promo.uses >= promo.maxUses) {
            return res.status(200).json({ valid: false, reason: !promo ? 'not_found' : !promo.active ? 'inactive' : 'exhausted' });
        }
        res.json({ valid: true, code: promo.code, usesLeft: promo.maxUses - promo.uses });
    } catch (err: any) {
        res.status(500).json({ valid: false, reason: 'error' });
    }
});

// POST /api/promo-codes/redeem/:code
// Incrementa el contador de usos al completar el registro
router.post('/redeem/:code', async (req: Request, res: Response) => {
    try {
        const code = req.params.code.trim().toUpperCase();
        const promo = await prisma.promoCode.findUnique({ where: { code } });
        if (!promo || !promo.active || promo.uses >= promo.maxUses) {
            return res.status(400).json({ success: false, error: 'Código inválido o agotado' });
        }
        const updated = await prisma.promoCode.update({
            where: { code },
            data: { uses: { increment: 1 } },
        });
        // Si llegó al límite, desactivar
        if (updated.uses >= updated.maxUses) {
            await prisma.promoCode.update({ where: { code }, data: { active: false } });
        }
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
