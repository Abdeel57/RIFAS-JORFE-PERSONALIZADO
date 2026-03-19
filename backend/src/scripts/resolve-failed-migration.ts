/**
 * Limpia migraciones fallidas (en estado 'failed') de la tabla _prisma_migrations
 * para que Prisma las vuelva a ejecutar en el próximo deploy.
 *
 * Uso (con DATABASE_URL de Railway):
 *   cd backend
 *   set DATABASE_URL=postgresql://...   (Windows)
 *   npx tsx src/scripts/resolve-failed-migration.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL no definida; omitiendo resolución de migración.');
    process.exit(0);
  }

  const prisma = new PrismaClient();

  try {
    // 1. Listar migraciones fallidas
    const failed = await prisma.$queryRawUnsafe<{ migration_name: string }[]>(
      `SELECT migration_name FROM "_prisma_migrations" WHERE "finished_at" IS NULL AND "rolled_back_at" IS NULL`
    );

    if (failed.length === 0) {
      console.log('ℹ️  No hay migraciones fallidas pendientes.');
    } else {
      console.log(`⚠️  Encontradas ${failed.length} migración(es) bloqueada(s):`);
      for (const m of failed) {
        console.log(`   - ${m.migration_name}`);
        await prisma.$executeRawUnsafe(
          `DELETE FROM "_prisma_migrations" WHERE "migration_name" = $1`,
          m.migration_name
        );
        console.log(`   ✅ Eliminada del registro para re-intento.`);
      }
    }
  } catch (e: any) {
    // Si la tabla no existe aún, no es un error
    if (e.message?.includes('_prisma_migrations') && e.message?.includes('does not exist')) {
      console.log('ℹ️  Tabla _prisma_migrations no existe aún (primera migración). Continuando...');
    } else {
      console.error('❌ Error al resolver migraciones:', e.message);
      // No salir con error para no bloquear el startup
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
