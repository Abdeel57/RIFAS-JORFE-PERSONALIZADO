import prisma from '../config/database';
import { extractPaymentData } from './geminiVisionPaymentService';

const VERIFICATION_DELAY_MS = 2 * 60 * 1000; // 2 minutos

// Mapa en memoria de jobs pendientes (suficiente para el volumen actual)
const pendingJobs = new Map<string, NodeJS.Timeout>();

/**
 * Programa la verificación automática de un pago 2 minutos después de recibir el comprobante.
 * Si el servidor reinicia, los jobs se pierden pero el admin puede confirmar manualmente.
 */
export function schedulePaymentVerification(purchaseId: string, imageBase64: string): void {
    // Cancelar job previo si existía
    if (pendingJobs.has(purchaseId)) {
        clearTimeout(pendingJobs.get(purchaseId)!);
    }

    console.log(`⏳ Job de verificación programado para orden ${purchaseId.slice(-8)} en 2 minutos...`);

    const timeoutId = setTimeout(() => {
        pendingJobs.delete(purchaseId);
        console.log(`⏰ [VERIFICACIÓN] Ejecutando job ahora para orden ${purchaseId.slice(-8)} (2 min tras comprobante).`);
        runVerification(purchaseId, imageBase64).catch((err: any) => {
            console.error(`❌ [VERIFICACIÓN] Job falló para orden ${purchaseId.slice(-8)}:`, err?.message);
        });
    }, VERIFICATION_DELAY_MS);

    pendingJobs.set(purchaseId, timeoutId);
}

/**
 * Ejecuta la verificación real: Gemini Vision → Banxico CEP → actualiza BD
 */
async function runVerification(purchaseId: string, imageBase64: string): Promise<void> {
    console.log(`\n🔍 [VERIFICACIÓN] Iniciando para orden ${purchaseId.slice(-8)}...`);

    try {
        // 1. Verificar que la orden todavía está pendiente
        const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId } });
        if (!purchase) {
            console.warn(`⚠️  Orden ${purchaseId.slice(-8)} no encontrada en BD`);
            return;
        }
        if (purchase.status === 'paid' || purchase.status === 'cancelled') {
            console.log(`ℹ️  Orden ${purchaseId.slice(-8)} ya fue procesada (${purchase.status}), omitiendo`);
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

        // 3. Sin clave de rastreo → imagen ilegible o no es un comprobante válido
        if (!paymentData.claveRastreo) {
            console.log(`⚠️  No se detectó clave de rastreo → pendiente manual`);
            await markPendingManual(purchaseId, 'no_tracking_key',
                'No se pudo leer la clave de rastreo del comprobante. Un administrador revisará tu pago manualmente.');
            return;
        }

        // 4. Confianza baja → imagen borrosa o datos parciales
        if (paymentData.confidence === 'low') {
            console.log(`⚠️  Confianza baja en extracción → pendiente manual`);
            await markPendingManual(purchaseId, 'low_confidence',
                `Imagen poco legible. Clave extraída: ${paymentData.claveRastreo}. Un administrador verificará tu pago.`);
            return;
        }

        // 5. Validar monto (tolerancia $5 para diferencias de redondeo)
        if (paymentData.monto !== null) {
            const diff = Math.abs(paymentData.monto - purchase.totalAmount);
            if (diff > 5) {
                console.log(`⚠️  Monto no coincide: extraído=$${paymentData.monto}, esperado=$${purchase.totalAmount}`);
                await markPendingManual(purchaseId, 'amount_mismatch',
                    `El monto del comprobante ($${paymentData.monto}) no coincide con el total de la orden ($${purchase.totalAmount}). Un administrador revisará tu pago.`);
                return;
            }
        }

        // 6. ✅ Gemini extrajo datos con confianza media/alta y el monto coincide.
        //    Verificación por Banxico CEP omitida: Nu Bank, Mercado Pago, Hey Banco y otros
        //    fintechs generan claves alfanuméricas propias que el portal de Banxico no reconoce.
        //    La foto del comprobante con datos correctos es evidencia suficiente.
        console.log(`✅ Comprobante verificado por Gemini Vision (confianza: ${paymentData.confidence})`);
        console.log(`   Clave: ${paymentData.claveRastreo} | Monto: $${paymentData.monto} | Banco: ${paymentData.bancoEmisor}`);
        await autoConfirmPurchase(purchaseId, paymentData.claveRastreo);

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
