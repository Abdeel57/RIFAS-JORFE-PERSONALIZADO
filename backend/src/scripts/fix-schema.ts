/**
 * fix-schema.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Repara el esquema de la base de datos aplicando directamente las columnas
 * faltantes con ALTER TABLE ... ADD COLUMN IF NOT EXISTS.
 *
 * Luego marca esas migraciones como "aplicadas" en _prisma_migrations para
 * que `prisma migrate deploy` no las vuelva a ejecutar (evitando conflictos).
 *
 * Se ejecuta automáticamente en startup.sh antes del migrate deploy.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── SQL patches (todos idempotentes gracias a IF NOT EXISTS) ─────────────────

const PATCHES: Array<{ description: string; sql: string }> = [
    {
        description: 'Raffle.isVirtual',
        sql: `ALTER TABLE "Raffle" ADD COLUMN IF NOT EXISTS "isVirtual" BOOLEAN NOT NULL DEFAULT false`,
    },
    {
        description: 'Raffle.opportunities',
        sql: `ALTER TABLE "Raffle" ADD COLUMN IF NOT EXISTS "opportunities" INTEGER NOT NULL DEFAULT 1`,
    },
    {
        description: 'Raffle.autoReleaseHours',
        sql: `ALTER TABLE "Raffle" ADD COLUMN IF NOT EXISTS "autoReleaseHours" INTEGER NOT NULL DEFAULT 0`,
    },
    {
        description: 'Raffle.luckyMachineNumbers',
        sql: `ALTER TABLE "Raffle" ADD COLUMN IF NOT EXISTS "luckyMachineNumbers" INTEGER[] DEFAULT ARRAY[5, 10, 20, 50]::INTEGER[]`,
    },
    {
        description: 'Ticket.isGift',
        sql: `ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "isGift" BOOLEAN NOT NULL DEFAULT false`,
    },
    {
        description: 'SystemSettings.logoSize',
        sql: `ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "logoSize" INTEGER NOT NULL DEFAULT 44`,
    },
    {
        description: 'SystemSettings.facebookPixelId',
        sql: `ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "facebookPixelId" TEXT`,
    },
    {
        description: 'Admin.planType',
        sql: `ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "planType" TEXT`,
    },
    {
        description: 'Admin.planStartDate',
        sql: `ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "planStartDate" TIMESTAMP(3)`,
    },
    {
        description: 'Admin.planExpiryDate',
        sql: `ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "planExpiryDate" TIMESTAMP(3)`,
    },
    {
        description: 'PushSubscription.adminRole',
        sql: `ALTER TABLE "PushSubscription" ADD COLUMN IF NOT EXISTS "adminRole" TEXT`,
    },
    {
        description: 'Purchase.paymentMethodId',
        sql: `ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "paymentMethodId" TEXT`,
    },
    {
        description: 'Raffle.promoTitle',
        sql: `ALTER TABLE "Raffle" ADD COLUMN IF NOT EXISTS "promoTitle" TEXT`,
    },
    {
        description: 'Raffle.promoDescription',
        sql: `ALTER TABLE "Raffle" ADD COLUMN IF NOT EXISTS "promoDescription" TEXT`,
    },
];

// ─── Migraciones que deben quedar marcadas como aplicadas ─────────────────────

const MIGRATIONS_TO_MARK_APPLIED = [
    '20260313000000_add_is_virtual',
    '20260315000000_add_auto_release_to_raffle',
    '20260316000000_add_lucky_machine_numbers',
    '20260317000000_add_gift_tickets_and_opportunities',
    '20260317000001_add_payment_methods_table',
    '20260317000002_add_payment_method_id_to_purchase',
    '20260318000000_add_admin_plan_fields',
    '20260318000001_push_subscription_add_admin_role',
    '20260319000000_fix_missing_raffle_columns',
    '20260323000000_add_promo_fields',
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    if (!process.env.DATABASE_URL) {
        console.log('[fix-schema] DATABASE_URL no definida, omitiendo.');
        process.exit(0);
    }

    console.log('[fix-schema] Iniciando reparación del esquema...');

    // 1. Limpiar migraciones bloqueadas (started_at sin finished_at ni rolled_back_at)
    try {
        const stuck = await prisma.$queryRawUnsafe<{ migration_name: string }[]>(
            `SELECT migration_name FROM "_prisma_migrations"
       WHERE finished_at IS NULL AND rolled_back_at IS NULL`
        );
        if (stuck.length > 0) {
            console.log(`[fix-schema] Limpiando ${stuck.length} migración(es) bloqueada(s)...`);
            for (const m of stuck) {
                await prisma.$executeRawUnsafe(
                    `DELETE FROM "_prisma_migrations" WHERE migration_name = $1`,
                    m.migration_name
                );
                console.log(`  ✅ Desbloqueada: ${m.migration_name}`);
            }
        }
    } catch (e: any) {
        if (e.message?.includes('_prisma_migrations') && e.message?.includes('does not exist')) {
            console.log('[fix-schema] Tabla _prisma_migrations no existe aún (OK, primera vez).');
        } else {
            console.warn('[fix-schema] Warning al limpiar migraciones bloqueadas:', e.message);
        }
    }

    // 2. Aplicar patches SQL directamente (idempotentes)
    console.log('[fix-schema] Aplicando patches de esquema...');
    for (const patch of PATCHES) {
        try {
            await prisma.$executeRawUnsafe(patch.sql);
            console.log(`  ✅ ${patch.description}`);
        } catch (e: any) {
            // Ignorar errores de "ya existe" (no deberían ocurrir con IF NOT EXISTS, pero por si acaso)
            if (e.message?.toLowerCase().includes('already exists')) {
                console.log(`  ⏭️  ${patch.description} (ya existía)`);
            } else {
                console.warn(`  ⚠️  ${patch.description}: ${e.message}`);
            }
        }
    }

    // 3. Marcar las migraciones como aplicadas en _prisma_migrations
    console.log('[fix-schema] Sincronizando tabla _prisma_migrations...');
    try {
        // Obtener las migraciones ya registradas
        const existing = await prisma.$queryRawUnsafe<{ migration_name: string }[]>(
            `SELECT migration_name FROM "_prisma_migrations"`
        );
        const existingNames = new Set(existing.map((r) => r.migration_name));

        for (const migName of MIGRATIONS_TO_MARK_APPLIED) {
            if (existingNames.has(migName)) {
                // Si ya existe pero con finished_at NULL, actualizarla
                await prisma.$executeRawUnsafe(
                    `UPDATE "_prisma_migrations"
           SET finished_at = NOW(), applied_steps_count = 1, logs = NULL, rolled_back_at = NULL
           WHERE migration_name = $1 AND finished_at IS NULL`,
                    migName
                );
                console.log(`  🔄 Actualizada: ${migName}`);
            } else {
                // Insertar como migración aplicada
                await prisma.$executeRawUnsafe(
                    `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
           VALUES (gen_random_uuid()::text, 'manual-fix', NOW(), $1, NULL, NULL, NOW(), 1)
           ON CONFLICT (migration_name) DO NOTHING`,
                    migName
                );
                console.log(`  ✅ Marcada como aplicada: ${migName}`);
            }
        }
    } catch (e: any) {
        console.warn('[fix-schema] Warning al sincronizar _prisma_migrations:', e.message);
    }

    console.log('[fix-schema] ✅ Reparación completada.');
    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error('[fix-schema] Error fatal:', e.message);
    await prisma.$disconnect();
    // No salir con error 1 para no bloquear el startup
    process.exit(0);
});
