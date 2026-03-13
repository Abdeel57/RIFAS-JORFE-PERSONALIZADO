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
    logoSize: z.number().int().min(20).max(120).optional(),
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    facebookPixelId: z.string().optional().nullable().or(z.literal('')),
});

const paymentMethodSchema = z.object({
    bankName: z.string().min(1),
    clabe: z.string().min(1),
    beneficiary: z.string().min(1),
    accountNumber: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
});

export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let settings = await prisma.systemSettings.findUnique({
            where: { id: 'default' },
        });

        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: { id: 'default' },
            });
        }

        // Obtener todos los métodos de pago activos
        const activePayments = await prisma.paymentMethod.findMany({
            where: { isActive: true },
            orderBy: { updatedAt: 'desc' }
        });

        // Para compatibilidad con el diseño actual, 'data' seguirá teniendo los campos de la primera tarjeta activa
        // pero añadimos 'activePaymentMethods' para que el frontend pueda iterar si hay varios.
        const firstActive = activePayments[0];

        const data = {
            ...settings,
            bankName: firstActive?.bankName || settings.bankName,
            clabe: firstActive?.clabe || settings.clabe,
            beneficiary: firstActive?.beneficiary || settings.beneficiary,
            accountNumber: firstActive?.accountNumber || settings.accountNumber,
            activePaymentMethods: activePayments.length > 0 ? activePayments : [{
                id: 'legacy',
                bankName: settings.bankName,
                clabe: settings.clabe,
                beneficiary: settings.beneficiary,
                accountNumber: settings.accountNumber,
                isActive: true
            }]
        };

        res.json({
            success: true,
            data,
        });
    } catch (error) {
        next(error);
    }
};

export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validated = updateSettingsSchema.parse(req.body);
        const data: Record<string, any> = { ...validated };
        if (data.accountNumber === '') data.accountNumber = null;
        if (data.paymentInstructions === '') data.paymentInstructions = null;
        if (data.logoUrl === '') data.logoUrl = null;
        if (data.facebookUrl === '') data.facebookUrl = null;
        if (data.facebookPixelId === '') data.facebookPixelId = null;

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
        if (error instanceof z.ZodError) return next(error);
        next(error);
    }
};

// ─── Payment Methods CRUD ─────────────────────────────────────────────────────

export const getPaymentMethods = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const methods = await prisma.paymentMethod.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: methods });
    } catch (error) { next(error); }
};

export const createPaymentMethod = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validated = paymentMethodSchema.parse(req.body);
        const method = await prisma.paymentMethod.create({
            data: validated
        });

        res.json({ success: true, data: method });
    } catch (error) { next(error); }
};

export const updatePaymentMethod = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const validated = paymentMethodSchema.partial().parse(req.body);

        const method = await prisma.paymentMethod.update({
            where: { id },
            data: validated
        });

        res.json({ success: true, data: method });
    } catch (error) { next(error); }
};

export const deletePaymentMethod = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await prisma.paymentMethod.delete({ where: { id } });
        res.json({ success: true, message: 'Método de pago eliminado' });
    } catch (error) { next(error); }
};

