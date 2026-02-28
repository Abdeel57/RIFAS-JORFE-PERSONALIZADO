import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import { generateToken } from '../../services/jwt.service';
import { AppError } from '../../utils/errors';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('🔐 [LOGIN] Intento de login iniciado', { email: req.body?.email });

    const { email, password } = loginSchema.parse(req.body);

    console.log('📧 [LOGIN] Email parseado', { email, passwordLength: password.length });

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    console.log('👤 [LOGIN] Resultado de búsqueda de admin', { adminFound: !!admin, adminEmail: admin?.email });

    if (!admin) {
      console.log('❌ [LOGIN] Admin no encontrado', { email });
      throw new AppError(401, 'Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
    
    console.log('🔑 [LOGIN] Comparación de contraseña', { isValidPassword });

    if (!isValidPassword) {
      console.log('❌ [LOGIN] Contraseña inválida', { email });
      throw new AppError(401, 'Invalid credentials');
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
      isZodError: error instanceof z.ZodError 
    });

    if (error instanceof z.ZodError) {
      return next(error);
    }
    next(error);
  }
};
