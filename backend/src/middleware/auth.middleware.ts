import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/jwt.service';
import { AppError } from '../utils/errors';

export interface AuthRequest extends Request {
  admin?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'No token provided');
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    req.admin = {
      id: payload.adminId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError(401, 'Invalid or expired token'));
  }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.admin?.role !== 'admin' && req.admin?.role !== 'super_admin') {
    return next(new AppError(403, 'No tienes permisos suficientes para realizar esta acción. Solo administradores.'));
  }
  next();
};

export const isSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.admin?.role !== 'super_admin') {
    return next(new AppError(403, 'Solo el super administrador puede realizar esta acción.'));
  }
  next();
};






