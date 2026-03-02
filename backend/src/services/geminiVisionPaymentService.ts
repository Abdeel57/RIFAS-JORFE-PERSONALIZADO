import { GoogleGenerativeAI } from '@google/generative-ai';
import env from '../config/env';

export interface PaymentAnalysisResult {
    // Datos extraídos del comprobante
    claveRastreo: string | null;
    monto: number | null;
    fecha: string | null;
    bancoEmisor: string | null;
    bancoDestino: string | null;
    ordenante: string | null;    // nombre de quien ENVÍA
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
    beneficiaryName: string;   // nombre del beneficiario de la cuenta (ej. "RIFAS NAO MÉXICO")
    clabe?: string;            // CLABE completa para extraer últimos 4 dígitos
    accountLastDigits?: string; // últimos 4 dígitos de la CLABE destino (calculados en el backend)
}

function buildPrompt(opts: AnalysisOptions): string {
    const last4 = opts.accountLastDigits || (opts.clabe ? opts.clabe.replace(/\s/g, '').slice(-4) : null);

    return `Eres un experto en verificación de comprobantes de pago bancarios mexicanos (SPEI).
Analiza esta imagen con máxima precisión y devuelve ÚNICAMENTE el JSON solicitado.

═══════════════════════════════════════════════════
DATOS DE LA ORDEN A VERIFICAR:
- Monto esperado: $${opts.expectedAmount} pesos MXN
- Nombre del cliente registrado: "${opts.customerName}"
- Beneficiario esperado (cuenta destino): "${opts.beneficiaryName}"
${last4 ? `- Últimos 4 dígitos de la CLABE destino: "${last4}"` : ''}
═══════════════════════════════════════════════════

TAREA 1 — EXTRACCIÓN DE DATOS:
Extrae EXACTAMENTE los valores visibles en el comprobante:
- claveRastreo: código de rastreo, referencia, folio o tracking (numérico O alfanumérico, valor exacto)
- monto: importe de la transferencia (número sin símbolos)
- fecha: fecha de la operación en formato DD/MM/YYYY
- bancoEmisor: banco que ENVÍA
- bancoDestino: banco que RECIBE
- ordenante: nombre completo de quien ENVÍA
- beneficiario: nombre de quien RECIBE
- cuentaDestino: número de cuenta, CLABE o CLABE parcial visible en el comprobante (ej. "****6010", "012180...2410")

TAREA 2 — ANÁLISIS DE AUTENTICIDAD:
Busca ACTIVAMENTE señales de manipulación digital:
- Inconsistencias tipográficas (mezcla de fuentes, tamaños o pesos diferentes)
- Artefactos de edición (bordes borrosos alrededor de números/texto, halos)
- Colores o sombras incoherentes con el resto de la app
- Texto que parece "pegado" sobre el fondo (bordes duros, sombras artificiales)
- Números mal alineados o con espaciado irregular
- Píxeles con compresión inconsistente (JPEG artifacts selectivos)
- Generación por IA (texturas irreales, inconsistencias de iluminación)
- Cualquier elemento que visualmente "no encaja" con un screenshot legítimo

TAREA 3 — VALIDACIÓN DE DATOS:
1. ¿El monto del comprobante coincide con $${opts.expectedAmount} MXN? (tolerancia ±$5 pesos)
2. REGLA DE NOMBRE (obligatoria):
   - Divide el nombre del ordenante del comprobante en palabras individuales.
   - Divide el nombre del cliente registrado "${opts.customerName}" en palabras individuales.
   - Ignora acentos, mayúsculas/minúsculas y palabras cortas (partículas: "de", "del", "la", "el", "los", "las", o cualquier palabra de 1-2 letras).
   - nameMatch = true  → si AL MENOS 2 palabras coinciden entre ambos nombres (ej. "Juan" + "Pérez", o "García" + "López", o "María" + "García").
   - nameMatch = false → si solo coincide 1 palabra, ninguna, o el nombre del ordenante NO es visible.
   - IMPORTANTE: NO se requiere que el nombre esté completo. Nombre parcial con 2 coincidencias es suficiente.
${last4 ? `3. ¿La cuenta destino visible en el comprobante termina en "${last4}"? 
   Busca campos como CLABE, cuenta, número de cuenta, ****XXXX. Si no es visible → null.` : ''}

CRITERIOS DE VEREDICTO:
- "approve": autenticidad alta/media, monto coincide, al menos 2 palabras del nombre coinciden, Y cuenta destino coincide (o no visible)
- "review": comprobante parece auténtico pero algún dato no coincide, solo 1 palabra del nombre coincide, o no es visible
- "reject": signos CLAROS de edición/falsificación, O la cuenta destino claramente NO coincide con "${last4 || 'la cuenta registrada'}"

RESPONDE ÚNICAMENTE CON ESTE JSON (sin markdown, sin texto adicional):
{
  "claveRastreo": "valor exacto o null",
  "monto": número_o_null,
  "fecha": "DD/MM/YYYY o null",
  "bancoEmisor": "nombre o null",
  "bancoDestino": "nombre o null",
  "ordenante": "nombre completo o null",
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
        ordenante: null, beneficiario: null, cuentaDestino: null,
        authenticity: 'suspicious',
        manipulationSigns: [],
        amountMatch: null, nameMatch: null, accountMatch: null,
        confidence: 'low',
        verdict: 'review',
        verdictReason: 'No se pudo analizar el comprobante automáticamente.',
    };

    if (!env.GEMINI_API_KEY) {
        console.warn('⚠️  GEMINI_API_KEY no configurada — revisión manual requerida');
        return empty;
    }

    try {
        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY!);
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
