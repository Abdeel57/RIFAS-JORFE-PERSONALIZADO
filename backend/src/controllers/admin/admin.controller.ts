import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import { AppError } from '../../utils/errors';
import { AuthRequest } from '../../middleware/auth.middleware';
import { z } from 'zod';

const createAdminSchema = z.object({
    name: z.string().min(2),
    email: z.string().min(3),
    password: z.string().min(6),
    role: z.enum(['admin', 'vendedor']).default('admin'),
    planType: z.enum(['mensual', 'por_rifa']).optional(),
});

const updateAdminSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().min(3).optional(),
    password: z.string().min(6).optional(),
    role: z.enum(['admin', 'vendedor']).optional(),
});

const setPlanSchema = z.object({
    planType: z.enum(['mensual', 'por_rifa']).nullable(),
});

export const getAdmins = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const admins = await prisma.admin.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                planType: true,
                planStartDate: true,
                planExpiryDate: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json({
            success: true,
            data: admins,
        });
    } catch (error) {
        next(error);
    }
};

export const createAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password, role, planType } = createAdminSchema.parse(req.body);

        const existingAdmin = await prisma.admin.findUnique({
            where: { email },
        });

        if (existingAdmin) {
            throw new AppError(400, 'El email ya está registrado');
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const now = new Date();
        const planStartDate = planType ? now : undefined;
        const planExpiryDate = planType === 'mensual' ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) : undefined;

        const admin = await prisma.admin.create({
            data: {
                name,
                email,
                passwordHash,
                role,
                planType,
                planStartDate,
                planExpiryDate,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                planType: true,
                planStartDate: true,
                planExpiryDate: true,
                createdAt: true,
            },
        });

        res.status(201).json({
            success: true,
            data: admin,
        });
    } catch (error) {
        next(error);
    }
};

export const updateAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name, email, password, role } = updateAdminSchema.parse(req.body);

        const admin = await prisma.admin.findUnique({ where: { id } });

        if (!admin) {
            throw new AppError(404, 'Admin no encontrado');
        }

        // Proteger al super_admin de ser modificado por rutas normales
        if (admin.role === 'super_admin') {
            throw new AppError(403, 'No se puede modificar al super administrador desde esta ruta.');
        }

        const data: any = { name, email, role };

        if (password) {
            data.passwordHash = await bcrypt.hash(password, 10);
        }

        const updatedAdmin = await prisma.admin.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                planType: true,
                planStartDate: true,
                planExpiryDate: true,
                createdAt: true,
            },
        });

        res.json({ success: true, data: updatedAdmin });
    } catch (error) {
        next(error);
    }
};

export const setAdminPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { planType } = setPlanSchema.parse(req.body);

        const admin = await prisma.admin.findUnique({ where: { id } });

        if (!admin) {
            throw new AppError(404, 'Admin no encontrado');
        }

        if (admin.role === 'super_admin') {
            throw new AppError(400, 'El super administrador no necesita un plan.');
        }

        let planStartDate: Date | null = null;
        let planExpiryDate: Date | null = null;

        if (planType === 'mensual') {
            planStartDate = new Date();
            planExpiryDate = new Date(planStartDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        } else if (planType === 'por_rifa') {
            planStartDate = new Date();
            planExpiryDate = null;
        }

        const updatedAdmin = await prisma.admin.update({
            where: { id },
            data: {
                planType,
                planStartDate,
                planExpiryDate,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                planType: true,
                planStartDate: true,
                planExpiryDate: true,
                createdAt: true,
            },
        });

        res.json({ success: true, data: updatedAdmin });
    } catch (error) {
        next(error);
    }
};

export const deleteAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const admin = await prisma.admin.findUnique({ where: { id } });

        if (!admin) {
            throw new AppError(404, 'Admin no encontrado');
        }

        if (admin.role === 'super_admin') {
            throw new AppError(403, 'No se puede eliminar al super administrador.');
        }

        const adminCount = await prisma.admin.count();
        if (adminCount <= 1) {
            throw new AppError(400, 'Debe haber al menos un administrador en el sistema');
        }

        await prisma.admin.delete({ where: { id } });

        res.json({ success: true, message: 'Admin eliminado correctamente' });
    } catch (error) {
        next(error);
    }
};
