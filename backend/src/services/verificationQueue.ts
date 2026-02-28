import prisma from '../config/database';
import { analyzePaymentProof, PaymentAnalysisResult } from './geminiVisionPaymentService';

const VERIFICATION_DELAY_MS = 2 * 60 * 1000; // 2 minutos

const pendingJobs = new Map<string, NodeJS.Timeout>();

/**
 * Programa la verificación automática 2 minutos después de recibir el comprobante.
 */
export function schedulePaymentVerification(purchaseId: string, imageBase64: string): void {
    if (pendingJobs.has(purchaseId)) {
        clearTimeout(pendingJobs.get(purchaseId)!);
    }

    console.log(`⏳ Verificación programada para orden ${purchaseId.slice(-8)} en 2 minutos...`);

    const timeoutId = setTimeout(() => {
        pendingJobs.delete(purchaseId);
        console.log(`⏰ [VERIFICACIÓN] Ejecutando para orden ${purchaseId.slice(-8)}.`);
        runVerification(purchaseId, imageBase64).catch((err: any) => {
            console.error(`❌ [VERIFICACIÓN] Job falló para orden ${purchaseId.slice(-8)}:`, err?.message);
        });
    }, VERIFICATION_DELAY_MS);

    pendingJobs.set(purchaseId, timeoutId);
}

async function runVerification(purchaseId: string, imageBase64: string): Promise<void> {
    console.log(`\n🔍 [VERIFICACIÓN] Iniciando para orden ${purchaseId.slice(-8)}...`);

    try {
        // Obtener compra con datos del usuario
        const purchase = await prisma.purchase.findUnique({
            where: { id: purchaseId },
            include: { user: true },
        });

        if (!purchase) {
            console.warn(`⚠️  Orden ${purchaseId.slice(-8)} no encontrada`);
            return;
        }
        if (purchase.status === 'paid' || purchase.status === 'cancelled') {
            console.log(`ℹ️  Orden ${purchaseId.slice(-8)} ya procesada (${purchase.status}), omitiendo`);
            return;
        }

        // Obtener configuración del sistema (beneficiario y CLABE)
        const settings = await prisma.systemSettings.findUnique({ where: { id: 'default' } });
        const beneficiaryName = settings?.beneficiary || 'RIFAS NAO';
        const clabe = settings?.clabe || undefined;
        // Extraer últimos 4 dígitos de la CLABE (ignorar espacios)
        const accountLastDigits = clabe ? clabe.replace(/\s/g, '').slice(-4) : undefined;

        // Analizar comprobante con Gemini
        console.log(`🤖 Analizando comprobante con Gemini Vision...`);
        const analysis = await analyzePaymentProof(imageBase64, {
            expectedAmount: purchase.totalAmount,
            customerName: purchase.user.name,
            beneficiaryName,
            clabe,
            accountLastDigits,
        });

        console.log(`📊 Resultado del análisis:`, {
            ordenante: analysis.ordenante,
            monto: analysis.monto,
            cuentaDestino: analysis.cuentaDestino,
            autenticidad: analysis.authenticity,
            señales: analysis.manipulationSigns,
            montoCoincide: analysis.amountMatch,
            nombreCoincide: analysis.nameMatch,
            cuentaCoincide: analysis.accountMatch,
            veredicto: analysis.verdict,
            razon: analysis.verdictReason,
        });

        // Seguridad extra: override del veredicto en casos críticos
        // (por si Gemini comete un error y dice "approve" cuando no debe)
        let finalVerdict = analysis.verdict;

        if (analysis.authenticity === 'fake') {
            finalVerdict = 'reject'; // comprobante claramente falso → siempre a revisión urgente
        } else if (analysis.accountMatch === false) {
            finalVerdict = 'review'; // cuenta destino incorrecta → nunca auto-aprobar
        } else if (analysis.amountMatch === false) {
            finalVerdict = 'review'; // monto incorrecto → nunca auto-aprobar
        }

        if (finalVerdict !== analysis.verdict) {
            console.log(`⚠️  Veredicto Gemini "${analysis.verdict}" sobreescrito a "${finalVerdict}" por regla de seguridad`);
        }

        // Aplicar veredicto final
        if (finalVerdict === 'approve') {
            await autoConfirmPurchase(purchaseId, analysis);
        } else if (finalVerdict === 'reject') {
            await markSuspiciousManual(purchaseId, analysis);
        } else {
            await markPendingManual(purchaseId, analysis);
        }

    } catch (error: any) {
        console.error(`❌ Error verificando orden ${purchaseId.slice(-8)}:`, error.message);
        await prisma.purchase.update({
            where: { id: purchaseId },
            data: {
                verificationStatus: 'pending_manual',
                verificationNote: `Error en verificación automática: ${error.message}. Revisar manualmente.`,
            },
        }).catch(() => {});
    }
}

async function autoConfirmPurchase(purchaseId: string, analysis: PaymentAnalysisResult): Promise<void> {
    await prisma.$transaction(async (tx) => {
        await (tx.purchase.update as any)({
            where: { id: purchaseId },
            data: {
                status: 'paid',
                paymentMethod: 'SPEI',
                paymentReference: analysis.claveRastreo || 'verificado-gemini',
                verificationStatus: 'auto_verified',
                verificationNote: buildApproveNote(analysis),
            },
        });

        await tx.ticket.updateMany({
            where: { purchaseId },
            data: { status: 'sold' },
        });
    });

    console.log(`✅ [AUTO-CONFIRM] Orden ${purchaseId.slice(-8)} confirmada automáticamente`);
    console.log(`   Razón: ${analysis.verdictReason}`);
}

async function markSuspiciousManual(purchaseId: string, analysis: PaymentAnalysisResult): Promise<void> {
    const note = [
        `⚠️ ALERTA: Posible comprobante falso o editado.`,
        `Autenticidad: ${analysis.authenticity} | Confianza: ${analysis.confidence}`,
        analysis.manipulationSigns.length > 0
            ? `Señales detectadas: ${analysis.manipulationSigns.join('; ')}`
            : '',
        `Razón: ${analysis.verdictReason}`,
        `Monto comprobante: $${analysis.monto ?? '?'} | Coincide: ${analysis.amountMatch}`,
        `Cuenta destino visible: ${analysis.cuentaDestino ?? '?'} | Coincide últimos 4 dígitos: ${analysis.accountMatch}`,
        `Ordenante: ${analysis.ordenante ?? '?'} | Nombre cliente coincide: ${analysis.nameMatch}`,
        `Clave rastreo: ${analysis.claveRastreo ?? 'no visible'}`,
    ].filter(Boolean).join('\n');

    await (prisma.purchase.update as any)({
        where: { id: purchaseId },
        data: {
            verificationStatus: 'pending_manual',
            verificationNote: note,
        },
    });

    console.log(`🚨 [SOSPECHOSO] Orden ${purchaseId.slice(-8)} marcada para revisión manual urgente`);
    console.log(`   Señales: ${analysis.manipulationSigns.join(', ') || 'ninguna específica'}`);
}

async function markPendingManual(purchaseId: string, analysis: PaymentAnalysisResult): Promise<void> {
    const note = [
        `Revisión manual requerida.`,
        `Autenticidad: ${analysis.authenticity} | Confianza: ${analysis.confidence}`,
        `Razón: ${analysis.verdictReason}`,
        `Monto comprobante: $${analysis.monto ?? '?'} | Coincide: ${analysis.amountMatch}`,
        `Cuenta destino visible: ${analysis.cuentaDestino ?? '?'} | Coincide últimos 4 dígitos: ${analysis.accountMatch}`,
        `Ordenante: ${analysis.ordenante ?? '?'} | Nombre coincide: ${analysis.nameMatch}`,
        `Clave rastreo: ${analysis.claveRastreo ?? 'no visible'}`,
    ].filter(Boolean).join('\n');

    await (prisma.purchase.update as any)({
        where: { id: purchaseId },
        data: {
            verificationStatus: 'pending_manual',
            verificationNote: note,
        },
    });

    console.log(`👁  [REVISIÓN] Orden ${purchaseId.slice(-8)} → revisión manual. Razón: ${analysis.verdictReason}`);
}

function buildApproveNote(analysis: PaymentAnalysisResult): string {
    return [
        `✅ Verificado automáticamente por Gemini Vision.`,
        `Ordenante: ${analysis.ordenante ?? '?'}`,
        `Monto: $${analysis.monto ?? '?'} | Banco: ${analysis.bancoEmisor ?? '?'}`,
        `Cuenta destino: ${analysis.cuentaDestino ?? '?'} | Coincide: ${analysis.accountMatch}`,
        `Fecha: ${analysis.fecha ?? '?'}`,
        `Clave rastreo: ${analysis.claveRastreo ?? 'no visible'}`,
        `Confianza: ${analysis.confidence}`,
    ].join(' | ');
}

/** Para testing: verificación inmediata (delay = 0) */
export function scheduleImmediateVerification(purchaseId: string, imageBase64: string): void {
    setTimeout(() => runVerification(purchaseId, imageBase64), 1000);
}
