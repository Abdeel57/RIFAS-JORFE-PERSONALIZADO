import { Request, Response } from 'express';
import prisma from '../config/database';

// ── Config ──────────────────────────────────────────────

// GET /api/polleria/config
export async function getConfig(_req: Request, res: Response) {
    try {
        let config = await prisma.polleriaConfig.findUnique({ where: { id: 'default' } });
        if (!config) {
            config = await prisma.polleriaConfig.create({
                data: { id: 'default', updatedAt: new Date() },
            });
        }
        res.json({ success: true, data: config });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}

// PUT /api/polleria/config  (requiere x-admin-key)
export async function updateConfig(req: Request, res: Response) {
    try {
        const { prizeName, prizeImage, drawDate, totalTickets } = req.body;

        // No permitir reducir boletos
        if (totalTickets !== undefined) {
            const current = await prisma.polleriaConfig.findUnique({ where: { id: 'default' } });
            if (current && Number(totalTickets) < current.totalTickets) {
                return res.status(400).json({
                    success: false,
                    error: `No puedes reducir la cantidad de boletos. Mínimo permitido: ${current.totalTickets}`,
                });
            }
        }

        const data: any = { updatedAt: new Date() };
        if (prizeName !== undefined) data.prizeName = prizeName;
        if (prizeImage !== undefined) data.prizeImage = prizeImage;
        if (drawDate !== undefined) data.drawDate = new Date(drawDate);
        if (totalTickets !== undefined) data.totalTickets = Number(totalTickets);

        const config = await prisma.polleriaConfig.upsert({
            where: { id: 'default' },
            update: data,
            create: { id: 'default', ...data },
        });
        res.json({ success: true, data: config });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}

// ── Tickets ──────────────────────────────────────────────

// GET /api/polleria/tickets  → lista de números tomados
export async function getTakenTickets(_req: Request, res: Response) {
    try {
        const tickets = await prisma.polleriaTicket.findMany({
            select: { number: true, ownerName: true },
            orderBy: { number: 'asc' },
        });
        res.json({ success: true, data: tickets });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}

// POST /api/polleria/tickets  → reclamar boletos al registrarse
export async function claimTickets(req: Request, res: Response) {
    try {
        const { tickets, ownerName, ownerPhone } = req.body;
        if (!Array.isArray(tickets) || tickets.length === 0) {
            return res.status(400).json({ success: false, error: 'Se requieren boletos' });
        }
        // Insertar ignorando duplicados (si por alguna razón ya existen)
        await prisma.$transaction(
            tickets.map((number: string) =>
                prisma.polleriaTicket.upsert({
                    where: { number },
                    create: { number, ownerName: ownerName || 'Anónimo', ownerPhone: ownerPhone || '' },
                    update: {},
                })
            )
        );
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}
