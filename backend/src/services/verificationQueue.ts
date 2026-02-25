import prisma from '../config/database';
import { extractPaymentData } from './geminiVisionPaymentService';
import { verifyWithBanxico } from './banxicoCepService';

const VERIFICATION_DELAY_MS = 5 * 60 * 1000; // 5 minutos

// Mapa en memoria de jobs pendientes (suficiente para el volumen actual)
const pendingJobs = new Map<string, NodeJS.Timeout>();

/**
 * Programa la verificación automática de un pago 5 minutos después de recibir el comprobante.
 * Si el servidor reinicia, los jobs se pierden pero el admin puede confirmar manualmente.
 */
export function schedulePaymentVerification(purchaseId: string, imageBase64: string): void {
    // Cancelar job previo si existía
    if (pendingJobs.has(purchaseId)) {
        clearTimeout(pendingJobs.get(purchaseId)!);
    }

    console.log(`⏳ Job de verificación programado para orden ${purchaseId.slice(-8)} en 5 minutos...`);

    const timeoutId = setTimeout(async () => {
        pendingJobs.delete(purchaseId);
        await runVerification(purchaseId, imageBase64);
    }, VERIFICATION_DELAY_MS);

    pendingJobs.set(purchaseId, timeoutId);
}

/**
 * Ejecuta la verificación real: Gemini Vision → Banxico CEP → actualiza BD
 */
async function runVerification(purchaseId: string, imageBase64: string): Promise<void> {
    console.log(`\n🔍 [VERIFICACIÓN] Iniciando para orden ${purchaseId.slice(-8)}...`);
    const startTime = Date.now();

    try {
        // 1. Verificar que la orden todavía está pendiente
        const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId } });
        if (!purchase) {
            console.warn(`⚠️  Orden ${purchaseId.slice(-8)} no encontrada en BD`);
            return;
        }
        if (purchase.status === 'paid' || purchase.status === 'cancelled') {
            console.log(`ℹ️  Orden ${purchaseId.slice(-8)} ya fue procesada (${purchase.status}), omitiendo verificación`);
            return;
        }

        // 2. Gemini Vision: extraer datos del comprobante
        console.log(`🤖 Analizando imagen con Gemini Vision...`);
        const paymentData = await extractPaymentData(imageBase64);
        console.log(`📊 Datos extraídos:`, {
            claveRastreo: paymentData.claveRastreo,
            monto: paymentData.monto,
            fecha: paymentData.fecha,
            banco: paymentData.bancoEmisor,
            confidence: paymentData.confidence,
        });

        // 3. ¿Tiene clave de rastreo visible?
        if (!paymentData.claveRastreo) {
            console.log(`⚠️  No se detectó clave de rastreo → pendiente manual`);
            await markPendingManual(purchaseId, 'no_tracking_key',
                'La clave de rastreo no es visible en el comprobante adjunto.');
            return;
        }

        // 4. Validar que el monto sea aproximadamente correcto (tolerancia 5 pesos)
        if (paymentData.monto !== null) {
            const diff = Math.abs(paymentData.monto - purchase.totalAmount);
            if (diff > 5) {
                console.log(`⚠️  Monto no coincide: extraído=${paymentData.monto}, esperado=${purchase.totalAmount}`);
                await markPendingManual(purchaseId, 'amount_mismatch',
                    `Monto del comprobante ($${paymentData.monto}) no coincide con el total de la orden ($${purchase.totalAmount}).`);
                return;
            }
        }

        // 5. Banxico CEP: verificar el pago
        console.log(`🌐 Verificando en Banxico CEP...`);
        const banxicoResult = await verifyWithBanxico(paymentData);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`📡 Resultado Banxico (${elapsed}s):`, banxicoResult);

        if (banxicoResult.verified) {
            // ✅ PAGO VERIFICADO — Confirmar automáticamente
            await autoConfirmPurchase(purchaseId, paymentData.claveRastreo);
        } else {
            // ❌ Banxico no lo encontró → pendiente manual
            await markPendingManual(purchaseId, banxicoResult.error || 'banxico_not_found',
                `Banxico no pudo verificar el pago. Clave: ${paymentData.claveRastreo}. Error: ${banxicoResult.error || 'no encontrado'}`);
        }

    } catch (error: any) {
        console.error(`❌ Error en verificación de orden ${purchaseId.slice(-8)}:`, error.message);
        await markPendingManual(purchaseId, 'verification_error', error.message);
    }
}

async function autoConfirmPurchase(purchaseId: string, claveRastreo: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
        // Actualizar compra
        await (tx.purchase.update as any)({
            where: { id: purchaseId },
            data: {
                status: 'paid',
                paymentMethod: 'SPEI',
                paymentReference: claveRastreo,
                verificationStatus: 'auto_verified',
                verificationNote: `Verificado automáticamente por Banxico CEP. Clave: ${claveRastreo}`,
            },
        });

        // Marcar boletos como vendidos
        await tx.ticket.updateMany({
            where: { purchaseId },
            data: { status: 'sold' },
        });
    });

    console.log(`✅ [AUTO-CONFIRM] Orden ${purchaseId.slice(-8)} confirmada automáticamente por Banxico`);
}

async function markPendingManual(purchaseId: string, reason: string, note: string): Promise<void> {
    await (prisma.purchase.update as any)({
        where: { id: purchaseId },
        data: {
            verificationStatus: 'pending_manual',
            verificationNote: note,
        },
    });

    console.log(`👁  [PENDING MANUAL] Orden ${purchaseId.slice(-8)} → revisión manual. Razón: ${reason}`);
}

/**
 * Útil para testing: forzar verificación inmediata (delay = 0)
 */
export function scheduleImmediateVerification(purchaseId: string, imageBase64: string): void {
    setTimeout(() => runVerification(purchaseId, imageBase64), 1000);
}
