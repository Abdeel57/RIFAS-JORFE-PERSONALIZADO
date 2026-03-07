import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import { AppError } from '../../utils/errors';
import { z } from 'zod';

const createAdminSchema = z.object({
    name: z.string().min(2),
    email: z.string().min(3),
    password: z.string().min(6),
    role: z.enum(['admin', 'vendedor']).default('admin'),
});

const updateAdminSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().min(3).optional(),
    password: z.string().min(6).optional(),
    role: z.enum(['admin', 'vendedor']).optional(),
});

export const getAdmins = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const admins = await prisma.admin.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
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
        const { name, email, password, role } = createAdminSchema.parse(req.body);

        const existingAdmin = await prisma.admin.findUnique({
            where: { email },
        });

        if (existingAdmin) {
            throw new AppError(400, 'El email ya está registrado');
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const admin = await prisma.admin.create({
            data: {
                name,
                email,
                passwordHash,
                role,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
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

export const updateAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name, email, password, role } = updateAdminSchema.parse(req.body);

        const admin = await prisma.admin.findUnique({
            where: { id },
        });

        if (!admin) {
            throw new AppError(404, 'Admin no encontrado');
        }

        const data: any = {
            name,
            email,
            role,
        };

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
                createdAt: true,
            },
        });

        res.json({
            success: true,
            data: updatedAdmin,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // Evitar que un admin se borre a sí mismo (opcional, pero recomendado)
        // if (req.admin?.adminId === id) {
        //   throw new AppError(400, 'No puedes eliminar tu propio usuario');
        // }

        const adminCount = await prisma.admin.count();
        if (adminCount <= 1) {
            throw new AppError(400, 'Debe haber al menos un administrador en el sistema');
        }

        await prisma.admin.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Admin eliminado correctamente',
        });
    } catch (error) {
        next(error);
    }
};
