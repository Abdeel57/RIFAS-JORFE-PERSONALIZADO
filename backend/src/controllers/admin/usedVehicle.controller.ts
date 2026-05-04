import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../config/database';

const usedVehicleSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    modelYear: z.string().min(1, 'El año es requerido'),
    mileage: z.string().min(1, 'El kilometraje es requerido'),
    description: z.string().min(1, 'La descripción es requerida'),
    price: z.string().min(1, 'El precio es requerido'),
    imageUrl: z.string().optional().nullable(),
    order: z.number().int().default(0),
    isActive: z.boolean().default(true),
});

export const getUsedVehicles = async (_req: Request, res: Response) => {
    try {
        const items = await prisma.usedVehicle.findMany({
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        });
        res.json({ success: true, data: items });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createUsedVehicle = async (req: Request, res: Response) => {
    try {
        const data = usedVehicleSchema.parse(req.body);
        const item = await prisma.usedVehicle.create({ data });
        res.status(201).json({ success: true, data: item });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: error.errors[0].message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateUsedVehicle = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = usedVehicleSchema.partial().parse(req.body);
        const item = await prisma.usedVehicle.update({ where: { id }, data });
        res.json({ success: true, data: item });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: error.errors[0].message });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Vehículo no encontrado' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteUsedVehicle = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.usedVehicle.delete({ where: { id } });
        res.json({ success: true, message: 'Vehículo eliminado' });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Vehículo no encontrado' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};
