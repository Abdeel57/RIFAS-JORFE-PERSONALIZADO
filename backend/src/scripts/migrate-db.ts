import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno desde múltiples posibles ubicaciones
const envPaths = [
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../../.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'backend/.env'),
];

for (const envPath of envPaths) {
    console.log(`🔍 Buscando .env en: ${envPath}`);
    dotenv.config({ path: envPath });
}

if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL no encontrada en ninguna de las rutas probadas.');
    console.log('Ambiente actual:', {
        cwd: process.cwd(),
        dirname: __dirname,
    });
    process.exit(1);
}

try {
    console.log('🚀 Iniciando migración de base de datos...');
    execSync('npx prisma migrate dev --name add_gift_tickets_and_opportunities --skip-generate', {
        stdio: 'inherit',
        env: process.env
    });
    console.log('✅ Migración completada. Generando cliente Prisma...');
    execSync('npx prisma generate', {
        stdio: 'inherit',
        env: process.env
    });
    console.log('🎉 Todo listo.');
} catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    process.exit(1);
}
