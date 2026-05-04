import { Request, Response } from 'express';
import prisma from '../config/database';

export const getPublicLandDevelopments = async (_req: Request, res: Response) => {
    try {
        const items = await prisma.landDevelopment.findMany({
            where: { isActive: true },
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
            select: {
                id: true,
                name: true,
                location: true,
                description: true,
                price: true,
                imageUrl: true,
            },
        });
        res.json({ success: true, data: items });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPublicUsedVehicles = async (_req: Request, res: Response) => {
    try {
        const items = await prisma.usedVehicle.findMany({
            where: { isActive: true },
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
            select: {
                id: true,
                name: true,
                modelYear: true,
                mileage: true,
                description: true,
                price: true,
                imageUrl: true,
            },
        });
        res.json({ success: true, data: items });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPublicFaqs = async (_req: Request, res: Response) => {
    try {
        const items = await prisma.faqItem.findMany({
            where: { isActive: true },
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
            select: {
                id: true,
                question: true,
                answer: true,
            },
        });
        res.json({ success: true, data: items });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
