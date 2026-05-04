import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';

const landDevelopmentSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    location: z.string().min(1, 'La ubicación es requerida'),
    description: z.string().min(1, 'La descripción es requerida'),
    price: z.string().min(1, 'El precio es requerido'),
    imageUrl: z.string().optional().nullable(),
    order: z.number().int().default(0),
    isActive: z.boolean().default(true),
});

export const getLandDevelopments = async (_req: Request, res: Response) => {
    try {
        const items = await prisma.landDevelopment.findMany({
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        });
        res.json({ success: true, data: items });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createLandDevelopment = async (req: Request, res: Response) => {
    try {
        const data = landDevelopmentSchema.parse(req.body);
        const item = await prisma.landDevelopment.create({ data });
        res.status(201).json({ success: true, data: item });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: error.errors[0].message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateLandDevelopment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = landDevelopmentSchema.partial().parse(req.body);
        const item = await prisma.landDevelopment.update({ where: { id }, data });
        res.json({ success: true, data: item });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: error.errors[0].message });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Desarrollo no encontrado' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteLandDevelopment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.landDevelopment.delete({ where: { id } });
        res.json({ success: true, message: 'Desarrollo eliminado' });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Desarrollo no encontrado' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};
