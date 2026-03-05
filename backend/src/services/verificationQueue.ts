import prisma from '../config/database';
import { analyzePaymentProof, PaymentAnalysisResult } from './geminiVisionPaymentService';
import { sendPushToAdmins } from './pushNotificationService';

const VERIFICATION_DELAY_MS = 500; // 0.5 segundos (respuesta inmediata)

// ─── Helpers de fecha México ───────────────────────────────────────────────────

/** Devuelve la fecha/hora actual en la zona horaria de México (UTC-6 CST). */
function getMexicoNow(): Date {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utcMs - 6 * 60 * 60 * 1000); // UTC-6 (hora estándar del centro de México)
}

/**
 * Parsea una fecha en formato DD/MM/YYYY.
 * Devuelve un Date con la medianoche de ese día (sin hora) o null si no parsea.
 */
function parseFechaMX(fecha: string | null): Date | null {
    if (!fecha) return null;
    const m = fecha.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    const [, dd, mm, yyyy] = m;
    return new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
}
const MAX_RETRIES = 3;        // reintentos si Gemini falla por error de red/timeout
const RETRY_DELAY_MS = 30000; // 30 segundos entre reintentos

const pendingJobs = new Map<string, NodeJS.Timeout>();

/**
 * Programa la verificación automática 2 minutos después de recibir el comprobante.
 */
export function schedulePaymentVerification(purchaseId: string, imageBase64: string): void {
    if (pendingJobs.has(purchaseId)) {
        clearTimeout(pendingJobs.get(purchaseId)!);
    }

    console.log(`⚡ Verificación instantánea programada para orden ${purchaseId.slice(-8)}...`);

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

        // Analizar comprobante con Gemini (con reintentos ante fallos de red)
        console.log(`🤖 Analizando comprobante con Gemini Vision...`);
        const analysis = await analyzeWithRetry(imageBase64, {
            expectedAmount: purchase.totalAmount,
            customerName: purchase.user.name,
            beneficiaryName,
            clabe,
            accountLastDigits,
        }, purchaseId);

        console.log(`📊 Resultado del análisis:`, {
            ordenante: analysis.ordenante,
            concepto: analysis.concepto,
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

        // Solo auto-aprobar si la confianza es ALTA. 
        // Si es medium o low, forzamos revisión manual por seguridad (Cero Tolerancia).
        if (analysis.verdict === 'approve' && analysis.confidence !== 'high') {
            console.log(`⚠️  Confianza ${analysis.confidence} → forzando revisión manual por seguridad`);
            analysis.verdict = 'review';
            analysis.verdictReason = `Confianza insuficiente (${analysis.confidence}). Se requiere validación visual por un humano.`;
        }

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

        // ── Validación de fecha (zona horaria México, UTC-6) ────────────────────
        // Acepta: hoy y ayer  →  cubre pagos tardíos o comprobantes subidos horas después
        // Rechaza (→ review): fechas de 2+ días atrás o fechas futuras
        const comprobanteFecha = parseFechaMX(analysis.fecha);
        if (comprobanteFecha !== null) {
            const mexicoHoy = getMexicoNow();
            const hoyMidnight = new Date(mexicoHoy.getFullYear(), mexicoHoy.getMonth(), mexicoHoy.getDate());
            const diffDias = Math.round(
                (hoyMidnight.getTime() - comprobanteFecha.getTime()) / 86_400_000
            );

            if (diffDias < 0) {
                // Fecha futura en el comprobante — sospechoso
                finalVerdict = 'review';
                analysis.verdictReason =
                    `Fecha futura en el comprobante (${analysis.fecha}). ${analysis.verdictReason}`;
                console.log(`⚠️  [FECHA] Futura detectada: ${analysis.fecha} → revisión manual`);
            } else if (diffDias > 1) {
                // Comprobante con más de 1 día de antigüedad — fuera del margen aceptado
                finalVerdict = 'review';
                analysis.verdictReason =
                    `Comprobante con fecha antigua (${analysis.fecha}, hace ${diffDias} día(s)). `
                    + `Solo se aceptan comprobantes de hoy o ayer. ${analysis.verdictReason}`;
                console.log(`⚠️  [FECHA] Antigua detectada: ${analysis.fecha} (${diffDias} días atrás) → revisión manual`);
            } else {
                // diffDias === 0 (hoy) o diffDias === 1 (ayer) → válido, sin cambio
                console.log(`✅ [FECHA] Comprobante del ${analysis.fecha} (${diffDias === 0 ? 'hoy' : 'ayer'}) — fecha válida`);
            }
        } else if (analysis.fecha === null) {
            // Gemini no pudo leer la fecha → no auto-aprobar si el veredicto era approve
            if (finalVerdict === 'approve') {
                finalVerdict = 'review';
                analysis.verdictReason =
                    `Fecha no legible en el comprobante, se requiere revisión manual. ${analysis.verdictReason}`;
                console.log(`⚠️  [FECHA] No legible → rebajando de approve a review`);
            }
        }
        // ─────────────────────────────────────────────────────────────────────────

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
        }).catch(() => { });
    }
}

/**
 * Llama a Gemini con reintentos ante errores transitorios (red, timeout, rate limit).
 * Si todos los intentos fallan, devuelve resultado de revisión manual.
 */
async function analyzeWithRetry(
    imageBase64: string,
    options: Parameters<typeof analyzePaymentProof>[1],
    purchaseId: string
): Promise<PaymentAnalysisResult> {
    let lastError = '';

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const result = await analyzePaymentProof(imageBase64, options);
            // Si Gemini devolvió un resultado con confidence (no vino de catch interno), éxito
            if (attempt > 1) {
                console.log(`✅ Gemini respondió en intento ${attempt} para orden ${purchaseId.slice(-8)}`);
            }
            return result;
        } catch (err: any) {
            lastError = err?.message || 'Error desconocido';
            console.warn(`⚠️  Gemini intento ${attempt}/${MAX_RETRIES} falló: ${lastError}`);
            if (attempt < MAX_RETRIES) {
                await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
            }
        }
    }

    console.error(`❌ Gemini falló ${MAX_RETRIES} veces para orden ${purchaseId.slice(-8)}`);
    return {
        claveRastreo: null, monto: null, fecha: null,
        bancoEmisor: null, bancoDestino: null,
        ordenante: null, concepto: null, beneficiario: null, cuentaDestino: null,
        authenticity: 'suspicious', manipulationSigns: [],
        amountMatch: null, nameMatch: null, accountMatch: null,
        confidence: 'low', verdict: 'review',
        verdictReason: `Análisis automático no disponible tras ${MAX_RETRIES} intentos: ${lastError}`,
    };
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

    await sendPushToAdmins({
        title: '✅ Pago verificado automáticamente',
        body: `Orden ${purchaseId.slice(-8)} — $${analysis.monto ?? '?'} de ${analysis.ordenante ?? 'cliente'}. Boletos confirmados.`,
        url: '/admin',
        tag: 'verificacion',
    }).catch(() => { });
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
        `Ordenante: ${analysis.ordenante ?? 'no visible'} | Concepto: ${analysis.concepto ?? 'no visible'} | Nombre coincide: ${analysis.nameMatch}`,
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

    await sendPushToAdmins({
        title: '🚨 Comprobante sospechoso — revisión urgente',
        body: `Orden ${purchaseId.slice(-8)} — posible falsificación. Revisar en el panel admin.`,
        url: '/admin',
        tag: 'alerta',
    }).catch(() => { });
}

async function markPendingManual(purchaseId: string, analysis: PaymentAnalysisResult): Promise<void> {
    const note = [
        `Revisión manual requerida.`,
        `Autenticidad: ${analysis.authenticity} | Confianza: ${analysis.confidence}`,
        `Razón: ${analysis.verdictReason}`,
        `Monto comprobante: $${analysis.monto ?? '?'} | Coincide: ${analysis.amountMatch}`,
        `Cuenta destino visible: ${analysis.cuentaDestino ?? '?'} | Coincide últimos 4 dígitos: ${analysis.accountMatch}`,
        `Ordenante: ${analysis.ordenante ?? 'no visible'} | Concepto: ${analysis.concepto ?? 'no visible'} | Nombre coincide: ${analysis.nameMatch}`,
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

    await sendPushToAdmins({
        title: '👁 Comprobante requiere revisión',
        body: `Orden ${purchaseId.slice(-8)} — ${analysis.verdictReason}`,
        url: '/admin',
        tag: 'revision',
    }).catch(() => { });
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
