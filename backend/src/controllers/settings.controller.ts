import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { z } from 'zod';

const updateSettingsSchema = z.object({
    bankName: z.string().min(1).optional(),
    clabe: z.string().min(1).optional(),
    beneficiary: z.string().min(1).optional(),
    whatsapp: z.string().min(1).optional(),
    contactEmail: z.string().email().optional(),
    instagram: z.string().optional(),
});

export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let settings = await prisma.systemSettings.findUnique({
            where: { id: 'default' },
        });

        if (!settings) {
            // Create default settings if they don't exist
            settings = await prisma.systemSettings.create({
                data: { id: 'default' },
            });
        }

        res.json({
            success: true,
            data: settings,
        });
    } catch (error) {
        next(error);
    }
};

export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validated = updateSettingsSchema.parse(req.body);

        const settings = await prisma.systemSettings.upsert({
            where: { id: 'default' },
            update: validated,
            create: { id: 'default', ...validated },
        });

        res.json({
            success: true,
            data: settings,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return next(error);
        }
        next(error);
    }
};
