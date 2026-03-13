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

TAREA 2 — ANÁLISIS FORENSE DE AUTENTICIDAD:
Eres un perito forense digital. Busca señales de que este comprobante fue modificado por IA o herramientas de edición:
- MONTOS EDITADOS: Mira fijamente el MONTO. ¿El número se ve ligeramente desalineado, con una resolución diferente o con una caja de ruido distinta al texto de alrededor?
- ARTEFACTOS DE COMPRESIÓN: ¿Hay "ruido" o manchas de colores alrededor de los números del monto pero no en el resto del texto? (Señal de edición).
- COINCIDENCIA DE LUZ/SOMBRA: ¿Las sombras de los números editados son consistentes con el resto de la interfaz bancaria?
- TIPOGRAFÍA: ¿La fuente de los números es EXACTAMENTE la misma que usa ese banco (BBVA, Banorte, Coppel, etc.)? La IA suele fallar en grosores de fuente y kerning.
- BORDES: Busca bordes demasiado perfectos o "halos" alrededor del texto.
- IA GENERATIVA: Busca texturas "lisas" irreales o letras que se deforman ligeramente al verlas de cerca.

TAREA 3 — VALIDACIÓN DE DATOS:
1. ¿El monto del comprobante coincide con $${opts.expectedAmount} MXN? (tolerancia ±$5 pesos)
2. REGLA DE NOMBRE — busca en CONCEPTO y en ORDENANTE (en ese orden de prioridad):
   FUENTE PRINCIPAL: campo "Concepto" / "Descripción" / "Referencia" del comprobante.
     Muchos bancos mexicanos no muestran el nombre del emisor, pero el cliente escribe
     su nombre en el concepto de pago. Busca PRIMERO ahí.
   FUENTE SECUNDARIA: campo "Ordenante" / "Nombre emisor" si es visible.
   
   PROCESO:
   - Toma el texto del CONCEPTO (si existe) o del ORDENANTE (si existe). Si ambos existen, evalúa los dos.
   - Divide el nombre del cliente registrado "${opts.customerName}" en palabras individuales.
   - Ignora acentos, mayúsculas/minúsculas y partículas cortas ("de", "del", "la", "el", "los", "las", palabras de 1-2 letras).
   - nameMatch = true  → si AL MENOS 2 palabras del cliente aparecen en el CONCEPTO o en el ORDENANTE.
     Ejemplos válidos: concepto "Juan Pérez" con cliente "Juan Carlos Pérez García" ✓
                       concepto "Pago rifa Juan Garcia" con cliente "Juan García López" ✓
                       ordenante "GARCIA LOPEZ JUAN" con cliente "Juan García López" ✓
   - nameMatch = false → si solo coincide 1 palabra o ninguna en NINGUNA de las dos fuentes.
   - nameMatch = null  → si TANTO el concepto como el ordenante son null o están vacíos (no visibles).
   - IMPORTANTE: NO se requiere el nombre completo. Con 2 coincidencias es suficiente.
${last4 ? `3. ¿La cuenta destino visible en el comprobante termina en "${last4}"? 
   Busca campos como CLABE, cuenta, número de cuenta, ****XXXX. Si no es visible → null.` : ''}

POLÍTICA DE CERO TOLERANCIA:
- Si los datos (monto, nombre) coinciden PERFECTAMENTE pero tienes CUALQUIER duda sobre la autenticidad visual (edición por IA), pon verdict="review" o "reject" y authenticity="suspicious".
- Es preferible mandar a revisión manual un comprobante real que aprobar uno falso.
- Si ves que el "Monto" tiene una tipografía ligeramente más gruesa o distinta al "Concepto", es un REJECT inmediato.

CRITERIOS DE VEREDICTO:
- "approve": autenticidad ALTA/INDUDABLE, todos los datos coinciden perfectamente. Confianza "high".
- "review": duda mínima sobre autenticidad, o datos no legibles/incompletos. Confianza "medium" o "low".
- "reject": signos claros de edición, Clave de Rastreo sospechosa, o cuenta destino claramente incorrecta.

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
        console.log(`🤖 [GEMINI] Solicitando análisis a modelo estable: gemini-1.5-flash...`);
        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY!);
        // Forzamos el uso del modelo estándar
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });


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
