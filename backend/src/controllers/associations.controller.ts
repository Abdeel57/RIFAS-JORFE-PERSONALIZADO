import { Request, Response } from 'express';
import prisma from '../config/database';

export const getPublicAssociations = async (_req: Request, res: Response) => {
    try {
        const associations = await prisma.association.findMany({
            where: { isActive: true },
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
            select: {
                id: true,
                name: true,
                description: true,
                logoUrl: true,
                websiteUrl: true,
            },
        });
        res.json({ success: true, data: associations });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
