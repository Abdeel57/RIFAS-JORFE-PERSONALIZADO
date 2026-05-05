import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';

const ALLOWED_SECTIONS = ['terrenos', 'seminuevos'] as const;

const pageCtaSchema = z.object({
    whatsappPhone: z.string()
        .regex(/^\d{10,15}$/, 'Solo dígitos, 10-15 caracteres')
        .optional()
        .or(z.literal('')),
    whatsappMessage: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
    infoUrl: z.string()
        .regex(/^https?:\/\/.+/, 'Debe ser una URL válida (https://...)')
        .optional()
        .or(z.literal('')),
    primaryLabel: z.string().max(60).optional().or(z.literal('')),
    secondaryLabel: z.string().max(60).optional().or(z.literal('')),
});

export const getPageCta = async (req: Request, res: Response) => {
    try {
        const { section } = req.params;
        if (!ALLOWED_SECTIONS.includes(section as any)) {
            return res.status(400).json({ success: false, message: 'Sección inválida' });
        }
        const cta = await prisma.pageCta.findUnique({ where: { section } });
        res.json({ success: true, data: cta });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const upsertPageCta = async (req: Request, res: Response) => {
    try {
        const { section } = req.params;
        if (!ALLOWED_SECTIONS.includes(section as any)) {
            return res.status(400).json({ success: false, message: 'Sección inválida' });
        }
        const data = pageCtaSchema.parse(req.body);

        // Convertir strings vacíos a null para limpiar la BD
        const cleanData = {
            whatsappPhone: data.whatsappPhone || null,
            whatsappMessage: data.whatsappMessage || null,
            infoUrl: data.infoUrl || null,
            primaryLabel: data.primaryLabel || null,
            secondaryLabel: data.secondaryLabel || null,
        };

        const cta = await prisma.pageCta.upsert({
            where: { section },
            create: { section, ...cleanData },
            update: cleanData,
        });
        res.json({ success: true, data: cta });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: error.errors[0].message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};
