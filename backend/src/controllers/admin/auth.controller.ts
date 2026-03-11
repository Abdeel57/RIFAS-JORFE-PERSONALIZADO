import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import env from '../../config/env';
import { generateToken } from '../../services/jwt.service';
import { AppError } from '../../utils/errors';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().min(3),
  password: z.string().min(6),
});

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('🔐 [LOGIN] Intento de login iniciado', { email: req.body?.email });

    if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
      console.error('❌ [LOGIN] JWT_SECRET no configurado o muy corto');
      return res.status(503).json({
        success: false,
        error: 'Servidor mal configurado: JWT_SECRET debe tener al menos 32 caracteres. Revisa las variables de entorno en Railway.',
      });
    }

    const { email, password } = loginSchema.parse(req.body);

    console.log('📧 [LOGIN] Email parseado', { email, passwordLength: password.length });

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    console.log('👤 [LOGIN] Resultado de búsqueda de admin', { adminFound: !!admin, adminEmail: admin?.email });

    if (!admin) {
      console.log('❌ [LOGIN] Admin no encontrado', { email });
      throw new AppError(401, 'Credenciales incorrectas');
    }

    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);

    console.log('🔑 [LOGIN] Comparación de contraseña', { isValidPassword });

    if (!isValidPassword) {
      console.log('❌ [LOGIN] Contraseña inválida', { email });
      throw new AppError(401, 'Credenciales incorrectas');
    }

    console.log('🎫 [LOGIN] Generando token', { adminId: admin.id, email: admin.email, role: admin.role });

    const token = generateToken({
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
    });

    console.log('✅ [LOGIN] Login exitoso', { tokenLength: token.length, adminId: admin.id });

    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      },
    });
  } catch (error) {
    console.error('❌ [LOGIN] Error en login', {
      errorType: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : 'unknown',
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Usuario y contraseña son obligatorios (mín. 6 caracteres).',
      });
    }
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    next(error);
  }
};
