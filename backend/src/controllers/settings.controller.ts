import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { z } from 'zod';

const updateSettingsSchema = z.object({
    bankName: z.string().min(1).optional(),
    clabe: z.string().min(1).optional(),
    beneficiary: z.string().min(1).optional(),
    accountNumber: z.string().optional().nullable(),
    paymentInstructions: z.string().optional().nullable(),
    whatsapp: z.string().min(1).optional(),
    contactEmail: z.string().email().optional(),
    instagram: z.string().optional(),
    facebookUrl: z.string().url().optional().nullable().or(z.literal('')),
    autoVerificationEnabled: z.boolean().optional(),
    siteName: z.string().min(1).max(40).optional(),
    logoUrl: z.string().optional().nullable(),
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
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
        // Convertir strings vacíos a null para campos opcionales
        const data: Record<string, any> = { ...validated };
        if (data.accountNumber === '') data.accountNumber = null;
        if (data.paymentInstructions === '') data.paymentInstructions = null;
        if (data.logoUrl === '') data.logoUrl = null;
        if (data.facebookUrl === '') data.facebookUrl = null;

        const settings = await prisma.systemSettings.upsert({
            where: { id: 'default' },
            update: data,
            create: { id: 'default', ...data },
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
