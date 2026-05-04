import { Request, Response } from 'express';
import prisma from '../config/database';

export const getPublicCommercialAllies = async (_req: Request, res: Response) => {
    try {
        const allies = await prisma.commercialAlly.findMany({
            where: { isActive: true },
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
            select: {
                id: true,
                name: true,
                shortName: true,
                logoUrl: true,
                targetView: true,
                badgeLabel: true,
                accentColor: true,
                gradientFrom: true,
                gradientTo: true,
            },
        });
        res.json({ success: true, data: allies });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
