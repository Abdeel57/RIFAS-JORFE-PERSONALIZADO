import { GoogleGenAI } from '@google/genai';
import env from '../config/env';

export interface ExtractedPaymentData {
    claveRastreo: string | null;
    monto: number | null;
    fecha: string | null;
    bancoEmisor: string | null;
    bancoDestino: string | null;
    beneficiario: string | null;
    concepto: string | null;
    confidence: 'high' | 'medium' | 'low';
}

const EXTRACTION_PROMPT = `Analiza esta imagen de un comprobante de pago SPEI (transferencia bancaria mexicana).

Extrae EXACTAMENTE los siguientes datos en formato JSON (sin markdown, solo JSON puro):
{
  "claveRastreo": "string o null — la clave de rastreo SPEI de 18-22 dígitos numéricos (también puede llamarse Referencia, Folio, o Tracking). Si no está visible o legible → null",
  "monto": "número decimal o null — el monto total transferido (solo números, sin símbolo de moneda)",
  "fecha": "string formato DD/MM/YYYY o null — la fecha de la operación",
  "bancoEmisor": "string o null — nombre del banco que ENVIÓ el dinero",
  "bancoDestino": "string o null — nombre del banco que RECIBIÓ el dinero",
  "beneficiario": "string o null — nombre del beneficiario/receptor",
  "concepto": "string o null — concepto o descripción del pago",
  "confidence": "high si todos los datos son claramente legibles, medium si algunos son parciales, low si la imagen es borrosa o incompleta"
}

IMPORTANTE:
- La clave de rastreo es el dato MÁS IMPORTANTE. Si no está visible → null
- Si el monto tiene coma de miles (ej: 1,500.00) → devuelve 1500
- No inventes datos. Si algo no está visible → null`;

export async function extractPaymentData(imageBase64: string): Promise<ExtractedPaymentData> {
    if (!env.GEMINI_API_KEY) {
        console.warn('⚠️  GEMINI_API_KEY no configurada — extracción de pago no disponible');
        return {
            claveRastreo: null, monto: null, fecha: null,
            bancoEmisor: null, bancoDestino: null, beneficiario: null,
            concepto: null, confidence: 'low',
        };
    }

    try {
        const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

        // Limpiar el prefijo data:image/...;base64, si existe
        const base64Data = imageBase64.includes(',')
            ? imageBase64.split(',')[1]
            : imageBase64;

        // Detectar mime type del prefijo
        const mimeType = imageBase64.startsWith('data:image/png') ? 'image/png'
            : imageBase64.startsWith('data:image/jpg') || imageBase64.startsWith('data:image/jpeg') ? 'image/jpeg'
                : imageBase64.startsWith('data:image/webp') ? 'image/webp'
                    : 'image/jpeg';

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType,
                        },
                    },
                    { text: EXTRACTION_PROMPT },
                ],
            },
        });

        const rawText = response.text?.trim() || '';
        console.log('🤖 Gemini Vision respuesta raw:', rawText.slice(0, 300));

        // Extraer JSON del texto (puede venir con o sin ```json```)
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error(`Gemini no devolvió JSON válido: ${rawText.slice(0, 200)}`);
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Normalizar el monto a número
        let monto: number | null = null;
        if (parsed.monto !== null && parsed.monto !== undefined) {
            const montoStr = String(parsed.monto).replace(/,/g, '').replace(/\s/g, '');
            const montoNum = parseFloat(montoStr);
            if (!isNaN(montoNum)) monto = montoNum;
        }

        return {
            claveRastreo: parsed.claveRastreo || null,
            monto,
            fecha: parsed.fecha || null,
            bancoEmisor: parsed.bancoEmisor || null,
            bancoDestino: parsed.bancoDestino || null,
            beneficiario: parsed.beneficiario || null,
            concepto: parsed.concepto || null,
            confidence: parsed.confidence || 'low',
        };

    } catch (error: any) {
        console.error('❌ Error en Gemini Vision extracción:', error.message);
        return {
            claveRastreo: null, monto: null, fecha: null,
            bancoEmisor: null, bancoDestino: null, beneficiario: null,
            concepto: null, confidence: 'low',
        };
    }
}
