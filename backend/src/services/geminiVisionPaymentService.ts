import { GoogleGenerativeAI } from '@google/generative-ai';
import env from '../config/env';

export interface PaymentAnalysisResult {
    // Datos extraídos del comprobante
    claveRastreo: string | null;
    monto: number | null;
    fecha: string | null;
    bancoEmisor: string | null;
    bancoDestino: string | null;
    ordenante: string | null;    // nombre de quien ENVÍA (puede no estar visible en muchos bancos)
    concepto: string | null;     // concepto / referencia / descripción del pago (aquí el cliente escribe su nombre)
    beneficiario: string | null; // nombre de quien RECIBE
    cuentaDestino: string | null; // número/CLABE de cuenta destino visible en el comprobante

    // Análisis de autenticidad
    authenticity: 'authentic' | 'suspicious' | 'fake';
    manipulationSigns: string[]; // señales detectadas de edición/falsificación

    // Validaciones contra los datos de la orden
    amountMatch: boolean | null;
    nameMatch: boolean | null;
    accountMatch: boolean | null; // si los últimos 4 dígitos de la cuenta destino coinciden

    // Veredicto final
    confidence: 'high' | 'medium' | 'low';
    verdict: 'approve' | 'review' | 'reject';
    verdictReason: string;
}

export interface AnalysisOptions {
    expectedAmount: number;
    customerName: string;
    beneficiaryName: string;   // nombre del beneficiario de la cuenta (ej. "Bismark México")
    clabe?: string;            // CLABE completa para extraer últimos 4 dígitos
    accountLastDigits?: string; // últimos 4 dígitos de la CLABE destino (calculados en el backend)
}

function buildPrompt(opts: AnalysisOptions): string {
    const last4 = opts.accountLastDigits || (opts.clabe ? opts.clabe.replace(/\s/g, '').slice(-4) : null);
    const currentDate = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return `Eres un experto en verificación de comprobantes de pago bancarios mexicanos (SPEI).
Analiza esta imagen con máxima precisión y devuelve ÚNICAMENTE el JSON solicitado.
 
═══════════════════════════════════════════════════
DATOS DE LA ORDEN A VERIFICAR:
- Monto esperado: $${opts.expectedAmount} pesos MXN
- Nombre del cliente registrado: "${opts.customerName}"
- Beneficiario esperado (cuenta destino): "${opts.beneficiaryName}"
${last4 ? `- Últimos 4 dígitos de la CLABE destino: "${last4}"` : ''}
- Fecha actual del sistema (Hoy): ${currentDate}
═══════════════════════════════════════════════════

IMPORTANTE SOBRE LA FECHA:
Si el comprobante tiene la fecha de hoy (${currentDate}) o de ayer, es TOTALMENTE VÁLIDO.
NO lo marques como "suspicious" o "future date" si coincide con la fecha actual proporcionada arriba.

TAREA 1 — EXTRACCIÓN DE DATOS:
Extrae EXACTAMENTE los valores visibles en el comprobante:
- claveRastreo: código de rastreo, referencia, folio o tracking (numérico O alfanumérico, valor exacto)
- monto: importe de la transferencia (número sin símbolos)
- fecha: fecha de la operación en formato DD/MM/YYYY
- bancoEmisor: banco que ENVÍA
- bancoDestino: banco que RECIBE
- ordenante: nombre de quien ENVÍA si aparece (en muchos bancos no es visible → null si no aparece)
- concepto: texto del campo "Concepto", "Descripción", "Referencia" o similar — aquí el cliente escribe su nombre. Extrae el valor EXACTO visible. Si no hay campo concepto → null.
- beneficiario: nombre de quien RECIBE
- cuentaDestino: número de cuenta, CLABE o CLABE parcial visible en el comprobante (ej. "****6010", "012180...2410")

TAREA 2 — AUTENTICIDAD (solo señales obvias):
Revisa si el comprobante parece falsificado. Solo marca "fake" o "suspicious" si hay señales MUY CLARAS:
- Números del monto claramente recortados/pegados o con bordes irregulares
- Ruido o artefactos evidentes solo alrededor del monto
- Comprobante que claramente no es de un banco real
Si el comprobante se ve coherente y legítimo, marca "authentic". No seas excesivamente estricto con la tipografía.

TAREA 3 — VALIDACIÓN DE DATOS (CRITERIOS PRINCIPALES):
1. MONTO: ¿El monto del comprobante coincide con $${opts.expectedAmount} MXN? Tolerancia ±$15 pesos (pequeñas diferencias por redondeo son aceptables).
2. NOMBRE EN CONCEPTO: Busca en CONCEPTO primero, luego en ORDENANTE.
   - Compara IGNORANDO mayúsculas/minúsculas y acentos. "JUAN" = "juan" = "Juan".
   - nameMatch = true  → si AL MENOS 1 palabra del cliente "${opts.customerName}" aparece en el CONCEPTO o ORDENANTE.
     Ejemplos válidos: concepto "juan perez" con cliente "Juan Carlos Pérez García" ✓
                       concepto "PAGO RIFA MARIA" con cliente "María López" ✓
                       concepto "Orlando Garcia" con cliente "ORLANDO GARCÍA" ✓
   - nameMatch = false → si ninguna palabra del cliente aparece en concepto ni ordenante.
   - nameMatch = null  → si concepto y ordenante son null o vacíos (no visibles en el comprobante).
${last4 ? `3. CUENTA DESTINO: ¿Los últimos 4 dígitos visibles coinciden con "${last4}"?
   Busca en CLABE, cuenta, ****XXXX. Si la cuenta NO es visible en el comprobante → accountMatch = null (no penalizar).` : ''}

AUTENTICIDAD:
- Solo marca "fake" o "suspicious" si hay señales OBVIAS de edición (números claramente pegados, recortes visibles).
- Si el comprobante se ve natural y los datos (monto, nombre, cuenta) coinciden, favorece "authentic" y verdict="approve".

CRITERIOS DE VEREDICTO:
- "approve": monto coincide, nombre en concepto coincide (sin importar mayúsculas), cuenta coincide o no visible. Confianza "high" o "medium".
- "review": datos incompletos o alguna duda menor. No rechaces por diferencias de mayúsculas o 1 palabra en el concepto.
- "reject": SOLO si hay signos CLAROS de falsificación o la cuenta destino visible es INCORRECTA.

RESPONDE ÚNICAMENTE CON ESTE JSON (sin markdown, sin texto adicional):
{
  "claveRastreo": "valor exacto o null",
  "monto": número_o_null,
  "fecha": "DD/MM/YYYY o null",
  "bancoEmisor": "nombre o null",
  "bancoDestino": "nombre o null",
  "ordenante": "nombre completo o null",
  "concepto": "texto exacto del concepto/descripción/referencia del pago, o null",
  "beneficiario": "nombre completo o null",
  "cuentaDestino": "número o CLABE parcial visible, o null",
  "authenticity": "authentic|suspicious|fake",
  "manipulationSigns": ["señal1", "señal2"],
  "amountMatch": true_o_false_o_null,
  "nameMatch": true_o_false_o_null,
  "accountMatch": true_o_false_o_null,
  "confidence": "high|medium|low",
  "verdict": "approve|review|reject",
  "verdictReason": "explicación breve en español del veredicto"
}`;
}

export async function analyzePaymentProof(
    imageBase64: string,
    options: AnalysisOptions
): Promise<PaymentAnalysisResult> {
    const empty: PaymentAnalysisResult = {
        claveRastreo: null, monto: null, fecha: null,
        bancoEmisor: null, bancoDestino: null,
        ordenante: null, concepto: null, beneficiario: null, cuentaDestino: null,
        authenticity: 'suspicious',
        manipulationSigns: [],
        amountMatch: null, nameMatch: null, accountMatch: null,
        confidence: 'low',
        verdict: 'review',
        verdictReason: 'No se pudo analizar el comprobante automáticamente.',
    };


    if (!env.GEMINI_API_KEY) {
        console.warn('⚠️  [GEMINI] GEMINI_API_KEY no detectada en env. Revisión manual requerida.');
        return empty;
    }


    try {
        console.log(`🤖 [GEMINI] Solicitando análisis a modelo gemini-2.5-flash...`);
        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY!);
        // gemini-1.5-flash está deprecado (404). Usamos gemini-2.5-flash (estable actual).
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });


        const base64Data = imageBase64.includes(',')
            ? imageBase64.split(',')[1]
            : imageBase64;


        const mimeType = imageBase64.startsWith('data:image/png') ? 'image/png'
            : imageBase64.startsWith('data:image/webp') ? 'image/webp'
                : 'image/jpeg';

        const result = await model.generateContent([
            buildPrompt(options),
            { inlineData: { data: base64Data, mimeType } },
        ]);

        const rawText = result.response.text().trim();
        console.log('🤖 Gemini análisis raw:', rawText.slice(0, 500));

        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error(`Gemini no devolvió JSON válido: ${rawText.slice(0, 200)}`);
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Normalizar monto
        let monto: number | null = null;
        if (parsed.monto !== null && parsed.monto !== undefined) {
            const montoNum = parseFloat(String(parsed.monto).replace(/,/g, ''));
            if (!isNaN(montoNum)) monto = montoNum;
        }

        return {
            claveRastreo: parsed.claveRastreo || null,
            monto,
            fecha: parsed.fecha || null,
            bancoEmisor: parsed.bancoEmisor || null,
            bancoDestino: parsed.bancoDestino || null,
            ordenante: parsed.ordenante || null,
            concepto: parsed.concepto || null,
            beneficiario: parsed.beneficiario || null,
            cuentaDestino: parsed.cuentaDestino || null,
            authenticity: parsed.authenticity || 'suspicious',
            manipulationSigns: Array.isArray(parsed.manipulationSigns) ? parsed.manipulationSigns : [],
            amountMatch: parsed.amountMatch ?? null,
            nameMatch: parsed.nameMatch ?? null,
            accountMatch: parsed.accountMatch ?? null,
            confidence: parsed.confidence || 'low',
            verdict: parsed.verdict || 'review',
            verdictReason: parsed.verdictReason || 'Sin razón especificada',
        };

    } catch (error: any) {
        console.error('❌ Error en análisis Gemini:', error.message);
        return { ...empty, verdictReason: `Error de análisis: ${error.message}` };
    }
}
