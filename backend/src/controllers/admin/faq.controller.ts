import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';

const faqSchema = z.object({
    question: z.string().min(1, 'La pregunta es requerida'),
    answer: z.string().min(1, 'La respuesta es requerida'),
    order: z.number().int().default(0),
    isActive: z.boolean().default(true),
});

export const getFaqs = async (_req: Request, res: Response) => {
    try {
        const items = await prisma.faqItem.findMany({
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        });
        res.json({ success: true, data: items });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createFaq = async (req: Request, res: Response) => {
    try {
        const data = faqSchema.parse(req.body);
        const item = await prisma.faqItem.create({ data });
        res.status(201).json({ success: true, data: item });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: error.errors[0].message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateFaq = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = faqSchema.partial().parse(req.body);
        const item = await prisma.faqItem.update({ where: { id }, data });
        res.json({ success: true, data: item });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: error.errors[0].message });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Pregunta no encontrada' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteFaq = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.faqItem.delete({ where: { id } });
        res.json({ success: true, message: 'Pregunta eliminada' });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Pregunta no encontrada' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};
