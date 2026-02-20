import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.string().optional().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  GEMINI_API_KEY: z.string().optional(), // Opcional - solo necesario si usas el chatbot
  FRONTEND_URL: z.string().url().optional().default('http://localhost:3000'),
});

// Parsear con manejo de errores más flexible para Railway
// Permitir que el servidor inicie incluso si faltan algunas variables (solo para health check)
let env: z.infer<typeof envSchema>;
try {
  // Intentar parsear con valores por defecto
  const envWithDefaults = {
    DATABASE_URL: process.env.DATABASE_URL,
    PORT: process.env.PORT || '3001',
    NODE_ENV: (process.env.NODE_ENV as any) || 'production',
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  };
  
  env = envSchema.parse(envWithDefaults);
  
  // Validar variables críticas y mostrar advertencias
  if (!env.DATABASE_URL) {
    console.warn('⚠️  ADVERTENCIA: DATABASE_URL no está configurada. Las funciones de base de datos no funcionarán.');
  }
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
    console.warn('⚠️  ADVERTENCIA: JWT_SECRET no está configurada o es muy corta. La autenticación no funcionará.');
  }
  
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Error en variables de entorno:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    // Usar valores por defecto para permitir que el servidor inicie
    env = {
      DATABASE_URL: process.env.DATABASE_URL || '',
      PORT: process.env.PORT || '3001',
      NODE_ENV: (process.env.NODE_ENV as any) || 'production',
      JWT_SECRET: process.env.JWT_SECRET || '',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
      FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    } as z.infer<typeof envSchema>;
    console.warn('⚠️  Continuando con valores por defecto. Algunas funciones pueden no estar disponibles.');
  } else {
    throw error;
  }
}

export default env;

