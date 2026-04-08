import { Request, Response } from 'express';
import prisma from '../../config/database';

// GET /api/admin/promo-codes
export async function listPromoCodes(_req: Request, res: Response) {
    try {
        const codes = await prisma.promoCode.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: codes });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}

// POST /api/admin/promo-codes
export async function createPromoCode(req: Request, res: Response) {
    try {
        const { code, maxUses } = req.body;
        if (!code || typeof code !== 'string' || code.trim() === '') {
            return res.status(400).json({ success: false, error: 'El código es requerido' });
        }
        const existing = await prisma.promoCode.findUnique({ where: { code: code.trim().toUpperCase() } });
        if (existing) {
            return res.status(409).json({ success: false, error: 'Ese código ya existe' });
        }
        const promo = await prisma.promoCode.create({
            data: {
                code: code.trim().toUpperCase(),
                maxUses: maxUses ? Number(maxUses) : 1,
            },
        });
        res.status(201).json({ success: true, data: promo });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}

// DELETE /api/admin/promo-codes/:id
export async function deletePromoCode(req: Request, res: Response) {
    try {
        const { id } = req.params;
        await prisma.promoCode.delete({ where: { id } });
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}
