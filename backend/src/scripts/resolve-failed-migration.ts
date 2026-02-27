/**
 * Marca la migración fallida como "rolled back" borrando su registro.
 * Así Prisma volverá a ejecutarla en el próximo deploy.
 *
 * Uso (con DATABASE_URL de Railway):
 *   cd backend
 *   set DATABASE_URL=postgresql://...   (Windows)
 *   npx tsx src/scripts/resolve-failed-migration.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const MIGRATION_NAME = '20260226130000_add_payment_settings_fields';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL no definida; omitiendo resolución de migración.');
    process.exit(0); // No fallar el start para que al menos se intente migrate deploy
  }

  const prisma = new PrismaClient();

  try {
    // Borrar el registro de la migración fallida para que Prisma la vuelva a intentar
    const result = await prisma.$executeRawUnsafe(
      `DELETE FROM "_prisma_migrations" WHERE "migration_name" = $1`,
      MIGRATION_NAME
    );

    if (result > 0) {
      console.log(`✅ Migración "${MIGRATION_NAME}" marcada como rolled back (registro eliminado).`);
      console.log('   En el próximo deploy se volverá a aplicar.');
    } else {
      console.log(`ℹ️  No había registro de "${MIGRATION_NAME}" (quizá ya se resolvió).`);
    }
  } catch (e: any) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
