import jwt from 'jsonwebtoken';
import env from '../config/env';

export interface TokenPayload {
  adminId: string;
  email: string;
  role: string;
}

export const generateToken = (payload: TokenPayload): string => {
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
    console.error('❌ [JWT] JWT_SECRET no configurado o muy corto', { jwtSecretLength: env.JWT_SECRET?.length || 0 });
    throw new Error('JWT_SECRET is not configured or is too short');
  }
  const secret: string = env.JWT_SECRET;
  const expiresIn = env.JWT_EXPIRES_IN || '7d';
  
  console.log('🎫 [JWT] Generando token', { payload, expiresIn, jwtSecretLength: secret.length });
  
  try {
    // Usar jwt.sign directamente con las opciones inline para evitar problemas de tipos
    const token = jwt.sign(payload, secret, {
      expiresIn: expiresIn,
    } as jwt.SignOptions);
    console.log('✅ [JWT] Token generado exitosamente', { tokenLength: token.length });
    return token;
  } catch (error) {
    console.error('❌ [JWT] Error al generar token', { error: error instanceof Error ? error.message : 'unknown' });
    throw error;
  }
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET is not configured');
    }
    const secret: string = env.JWT_SECRET;
    return jwt.verify(token, secret) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};


