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
- concepto: texto del campo "Concepto", "Descripción", "Referencia" o similar. Extrae el valor EXACTO visible. Si el campo no existe en el comprobante → null. Si el campo existe pero está vacío → null.
- beneficiario: nombre de quien RECIBE
- cuentaDestino: número de cuenta, CLABE o CLABE parcial visible en el comprobante (ej. "****6010", "012180...2410")

TAREA 2 — AUTENTICIDAD (solo señales obvias):
Revisa si el comprobante parece falsificado. Solo marca "fake" o "suspicious" si hay señales MUY CLARAS:
- Números del monto claramente recortados/pegados o con bordes irregulares
- Ruido o artefactos evidentes solo alrededor del monto
- Comprobante que claramente no es de un banco real
Si el comprobante se ve coherente y legítimo, marca "authentic". No seas excesivamente estricto con la tipografía.

TAREA 3 — VALIDACIÓN DE DATOS:

1. MONTO: ¿El monto del comprobante coincide con $${opts.expectedAmount} MXN?
   Tolerancia ±$15 pesos (pequeñas diferencias por redondeo son aceptables).

2. NOMBRE EN CONCEPTO — LEE CON MUCHA ATENCIÓN:
   El cliente registrado es: "${opts.customerName}"
   Busca su nombre en el campo CONCEPTO primero, luego en ORDENANTE.

   REGLAS DE COINCIDENCIA — Sé MUY generoso, los clientes escriben de muchas formas:
   - Ignora COMPLETAMENTE mayúsculas/minúsculas y acentos:
     "JUAN" = "juan" = "Juan", "GARCIA" = "García" = "garcia", "PEREZ" = "Pérez"
   
   nameMatch = TRUE si CUALQUIERA de lo siguiente aplica:
     a) Al menos 1 palabra del nombre "${opts.customerName}" aparece en CONCEPTO o ORDENANTE.
        Ejemplos que SON válidos (nameMatch=true):
        ✓ Concepto "JUAN PEREZ" para cliente "Juan Carlos Pérez García"
        ✓ Concepto "pago garcia" para cliente "Luis García"
        ✓ Concepto "PAGO RIFA MARIA" para cliente "María López"
        ✓ Concepto "Orlando Garcia" para cliente "ORLANDO GARCÍA"
        ✓ Concepto "ORTIZ" para cliente "Carmen Ortiz Ramírez"
        ✓ Concepto "JPEREZ" o "J PEREZ" para cliente "Juan Pérez"
        ✓ Ordenante "JUAN CARLOS PEREZ" para cliente "Juan Pérez"
     b) Hay una abreviatura o variante razonable del nombre del cliente.
   
   nameMatch = FALSE ÚNICAMENTE si:
     - El concepto contiene el nombre completo de OTRA persona claramente diferente
       (ej. concepto "PEDRO SANCHEZ RUIZ" cuando el cliente es "María López") 
       Y el ordenante tampoco tiene relación con el cliente.
     - Texto genérico en concepto como "PAGO", "RIFA", "TRANSFERENCIA", números solos,
       "SPEI", "REF123", etc. NO cuenta como false → eso es NULL.
   
   nameMatch = NULL si:
     - El concepto Y el ordenante son ambos null o vacíos.
     - El concepto solo tiene texto completamente genérico sin nombre de persona.

${last4 ? `3. CUENTA DESTINO: ¿Los últimos 4 dígitos visibles coinciden con "${last4}"?
   Busca en CLABE, cuenta, ****XXXX. Si la cuenta NO es visible en el comprobante → accountMatch = null (no penalizar).` : ''}

AUTENTICIDAD:
- Solo marca "fake" o "suspicious" si hay señales OBVIAS de edición.
- Si el comprobante se ve natural y los datos coinciden, favorece "authentic" y verdict="approve".

CRITERIOS DE VEREDICTO — MUY IMPORTANTE:
- "approve": monto coincide (amountMatch=true) Y (nameMatch=true O nameMatch=null) Y cuenta coincide o no visible (accountMatch=true o null) Y autenticidad NO es "fake".
  La confianza puede ser "high", "medium" o "low" siempre que los datos de monto y nombre sean correctos.
- "review": algún dato dudoso sin fraude claro. Úsalo cuando: monto con diferencia mayor a $15, nameMatch=false con nombre de otra persona, fecha muy antigua.
- "reject": SOLO si hay signos INDUDABLES de falsificación (fake) o la cuenta destino visible es claramente INCORRECTA.

IMPORTANTE: nameMatch=null NO debe impedir la aprobación. Si el monto coincide, la cuenta coincide o no es visible, y el comprobante es auténtico, da verdict="approve" aunque nameMatch sea null.

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
