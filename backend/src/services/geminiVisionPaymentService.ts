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

    // Análisis de autenticidad
    authenticity: 'authentic' | 'suspicious' | 'fake';
    manipulationSigns: string[]; // señales detectadas de edición/falsificación

    // Validaciones contra los datos de la orden
    amountMatch: boolean | null;
    nameMatch: boolean | null;

    // Veredicto final
    confidence: 'high' | 'medium' | 'low';
    verdict: 'approve' | 'review' | 'reject';
    verdictReason: string;
}

export interface AnalysisOptions {
    expectedAmount: number;
    customerName: string;
    beneficiaryName: string; // nombre del beneficiario de la cuenta (ej. "RIFAS NAO MÉXICO")
    clabe?: string;          // últimos dígitos o CLABE completa para validar cuenta destino
}

function buildPrompt(opts: AnalysisOptions): string {
    return `Eres un experto en verificación de comprobantes de pago bancarios mexicanos (SPEI).
Analiza esta imagen con máxima precisión y devuelve ÚNICAMENTE el JSON solicitado.

═══════════════════════════════════════════════════
DATOS DE LA ORDEN A VERIFICAR:
- Monto esperado: $${opts.expectedAmount} pesos MXN
- Nombre del cliente registrado: "${opts.customerName}"
- Beneficiario esperado (cuenta destino): "${opts.beneficiaryName}"
${opts.clabe ? `- CLABE/cuenta destino (parcial): "${opts.clabe}"` : ''}
═══════════════════════════════════════════════════

TAREA 1 — EXTRACCIÓN DE DATOS:
Extrae EXACTAMENTE los valores visibles en el comprobante:
- claveRastreo: cualquier código de rastreo, referencia, folio o tracking (puede ser numérico O alfanumérico, extrae el valor exacto)
- monto: importe de la transferencia (número sin símbolos)
- fecha: fecha de la operación en formato DD/MM/YYYY
- bancoEmisor: banco que ENVÍA
- bancoDestino: banco que RECIBE
- ordenante: nombre completo de quien ENVÍA el dinero
- beneficiario: nombre de quien RECIBE el dinero

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
2. ¿El nombre del ordenante contiene al menos 1 nombre Y 1 apellido del cliente "${opts.customerName}"?
   (ignora acentos, mayúsculas/minúsculas, orden de nombres, abreviaciones)

CRITERIOS DE VEREDICTO:
- "approve": autenticidad alta/media, monto coincide, y nombre coincide (o no es legible pero todo lo demás es consistente)
- "review": algo sospechoso sin ser concluyente, o monto/nombre no coincide pero el comprobante parece auténtico
- "reject": signos CLAROS de edición o falsificación detectados en la imagen

RESPONDE ÚNICAMENTE CON ESTE JSON (sin markdown, sin texto adicional):
{
  "claveRastreo": "valor exacto o null",
  "monto": número_o_null,
  "fecha": "DD/MM/YYYY o null",
  "bancoEmisor": "nombre o null",
  "bancoDestino": "nombre o null",
  "ordenante": "nombre completo o null",
  "beneficiario": "nombre completo o null",
  "authenticity": "authentic|suspicious|fake",
  "manipulationSigns": ["señal1", "señal2"],
  "amountMatch": true_o_false_o_null,
  "nameMatch": true_o_false_o_null,
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
        ordenante: null, beneficiario: null,
        authenticity: 'suspicious',
        manipulationSigns: [],
        amountMatch: null, nameMatch: null,
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
            authenticity: parsed.authenticity || 'suspicious',
            manipulationSigns: Array.isArray(parsed.manipulationSigns) ? parsed.manipulationSigns : [],
            amountMatch: parsed.amountMatch ?? null,
            nameMatch: parsed.nameMatch ?? null,
            confidence: parsed.confidence || 'low',
            verdict: parsed.verdict || 'review',
            verdictReason: parsed.verdictReason || 'Sin razón especificada',
        };

    } catch (error: any) {
        console.error('❌ Error en análisis Gemini:', error.message);
        return { ...empty, verdictReason: `Error de análisis: ${error.message}` };
    }
}
