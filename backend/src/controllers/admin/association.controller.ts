import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';

const associationSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    description: z.string().min(1, 'La descripción es requerida'),
    logoUrl: z.string().min(1, 'El logo es requerido'),
    websiteUrl: z.string().url('El link debe ser una URL válida'),
    order: z.number().int().default(0),
    isActive: z.boolean().default(true),
});

export const getAssociations = async (_req: Request, res: Response) => {
    try {
        const associations = await prisma.association.findMany({
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        });
        res.json({ success: true, data: associations });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createAssociation = async (req: Request, res: Response) => {
    try {
        const data = associationSchema.parse(req.body);
        const association = await prisma.association.create({ data });
        res.status(201).json({ success: true, data: association });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: error.errors[0].message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateAssociation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = associationSchema.partial().parse(req.body);
        const association = await prisma.association.update({
            where: { id },
            data,
        });
        res.json({ success: true, data: association });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: error.errors[0].message });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Asociación no encontrada' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteAssociation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.association.delete({ where: { id } });
        res.json({ success: true, message: 'Asociación eliminada' });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Asociación no encontrada' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};
