import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';

const ALLOWED_TARGET_VIEWS = [
    'terrenos',
    'seminuevos',
    'causas',
    'faq',
    'financiamiento',
    'contacto',
    'verify',
] as const;

const commercialAllySchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    shortName: z.string().min(1, 'Las iniciales son requeridas').max(4, 'Máximo 4 caracteres'),
    logoUrl: z.string().min(1, 'El logo es requerido'),
    targetView: z.enum(ALLOWED_TARGET_VIEWS, { errorMap: () => ({ message: 'Sección destino inválida' }) }),
    badgeLabel: z.string().min(1, 'La etiqueta es requerida'),
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color hex inválido (#rrggbb)').default('#3b82f6'),
    gradientFrom: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color hex inválido (#rrggbb)').default('#dbeafe'),
    gradientTo: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color hex inválido (#rrggbb)').default('#bfdbfe'),
    order: z.number().int().default(0),
    isActive: z.boolean().default(true),
});

export const getCommercialAllies = async (_req: Request, res: Response) => {
    try {
        const allies = await prisma.commercialAlly.findMany({
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        });
        res.json({ success: true, data: allies });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createCommercialAlly = async (req: Request, res: Response) => {
    try {
        const data = commercialAllySchema.parse(req.body);
        const ally = await prisma.commercialAlly.create({ data });
        res.status(201).json({ success: true, data: ally });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: error.errors[0].message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateCommercialAlly = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = commercialAllySchema.partial().parse(req.body);
        const ally = await prisma.commercialAlly.update({
            where: { id },
            data,
        });
        res.json({ success: true, data: ally });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: error.errors[0].message });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Aliado comercial no encontrado' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteCommercialAlly = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.commercialAlly.delete({ where: { id } });
        res.json({ success: true, message: 'Aliado comercial eliminado' });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Aliado comercial no encontrado' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// Endpoint público para el frontend de la rifa (solo activos, ordenados)
export const getPublicCommercialAllies = async (_req: Request, res: Response) => {
    try {
        const allies = await prisma.commercialAlly.findMany({
            where: { isActive: true },
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        });
        res.json({ success: true, data: allies });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
