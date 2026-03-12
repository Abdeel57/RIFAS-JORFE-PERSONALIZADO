import prisma from '../config/database';

/**
 * Service to automatically release unpaid ticket reservations.
 */
export function initAutoReleaseWorker() {
    // Run every 5 minutes
    const INTERVAL_MS = 5 * 60 * 1000;

    console.log('🚀 [AUTO-RELEASE] Worker iniciado. Intervalo: 5 minutos.');

    setInterval(async () => {
        try {
            await runAutoRelease();
        } catch (error: any) {
            console.error('❌ [AUTO-RELEASE] Error en ejecución del worker:', error.message);
        }
    }, INTERVAL_MS);

    // Run once on startup after a short delay
    setTimeout(() => {
        runAutoRelease().catch(err => console.error('❌ [AUTO-RELEASE] Error en ejecución inicial:', err.message));
    }, 10000);
}

async function runAutoRelease() {
    console.log(`⏰ [AUTO-RELEASE] Ejecutando escaneo de pedidos expirados... (${new Date().toISOString()})`);

    // 1. Obtener todas las rifas activas que tengan habilitada la liberación automática
    const activeRaffles = await prisma.raffle.findMany({
        where: {
            status: 'active',
            autoReleaseHours: { gt: 0 }
        }
    });

    if (activeRaffles.length === 0) {
        return;
    }

    let totalReleased = 0;

    for (const raffle of activeRaffles) {
        const expirationLimit = new Date();
        expirationLimit.setHours(expirationLimit.getHours() - (raffle.autoReleaseHours || 0));

        // 2. Buscar compras pendientes para esta rifa creadas antes del límite de expiración
        const expiredPurchases = await prisma.purchase.findMany({
            where: {
                raffleId: raffle.id,
                status: 'pending',
                createdAt: { lt: expirationLimit }
            },
            include: {
                tickets: true
            }
        });

        if (expiredPurchases.length === 0) continue;

        console.log(`🔍 [AUTO-RELEASE] Rifa "${raffle.title}": Encontrados ${expiredPurchases.length} pedidos expirados.`);

        for (const purchase of expiredPurchases) {
            try {
                // 3. Liberar en una transacción: marcar compra como cancelada y boletos como disponibles
                await prisma.$transaction(async (tx) => {
                    // Marcar compra como cancelada
                    await tx.purchase.update({
                        where: { id: purchase.id },
                        data: {
                            status: 'cancelled',
                            verificationNote: `Liberación automática: Excedió el tiempo límite de ${raffle.autoReleaseHours} horas.`
                        }
                    });

                    // Liberar boletos
                    if (purchase.tickets.length > 0) {
                        await tx.ticket.updateMany({
                            where: { purchaseId: purchase.id },
                            data: {
                                status: 'available',
                                purchaseId: null
                            }
                        });
                    }
                });
                totalReleased++;
            } catch (err: any) {
                console.error(`❌ [AUTO-RELEASE] Error liberando pedido ${purchase.id}:`, err.message);
            }
        }
    }

    if (totalReleased > 0) {
        console.log(`✅ [AUTO-RELEASE] Proceso completado. Pedidos liberados: ${totalReleased}`);
    }
}
