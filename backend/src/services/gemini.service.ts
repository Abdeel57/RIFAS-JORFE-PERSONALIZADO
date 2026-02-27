import { GoogleGenerativeAI, ChatSession } from '@google/generative-ai';
import env from '../config/env';

const getGenAI = () => {
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured. Chatbot feature is disabled.');
  }
  return new GoogleGenerativeAI(env.GEMINI_API_KEY);
};

export const startSupportChat = (raffleInfo?: { title: string; ticketPrice: number; whatsapp: string }): ChatSession => {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: `Eres "Nao Assist", el asistente oficial de Rifas Nao. 
      Tu objetivo es ayudar a los clientes con:
      1. Información del sorteo${raffleInfo ? `: ${raffleInfo.title} por $${raffleInfo.ticketPrice}` : ''}.
      2. Pagos: Explicar transferencia BBVA o pago en OXXO. Recuérdales que es OBLIGATORIO enviar el comprobante a WhatsApp${raffleInfo ? ` (${raffleInfo.whatsapp})` : ''}.
      3. Verificación: Si tienen problemas con sus boletos, guíalos a la pestaña "Verificar" e indica que usen su número de teléfono.
      4. Legalidad: Se basa en la Lotería Nacional de México.
      Sé profesional, amable, muy conciso y enfocado en cerrar la venta o resolver dudas técnicas. No inventes premios ni precios.`,
  });
  return model.startChat({ history: [] });
};

export const editImage = async (imageBuffer: string, prompt: string): Promise<string | null> => {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const base64Data = imageBuffer.split(',')[1];

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64Data, mimeType: 'image/png' } },
  ]);

  return result.response.text() || null;
};

export const analyzeImage = async (imageBuffer: string): Promise<string> => {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const base64Data = imageBuffer.split(',')[1];

  const result = await model.generateContent([
    'Analiza esta imagen detalladamente. Describe qué ves, el ambiente, colores dominantes y cualquier detalle relevante.',
    { inlineData: { data: base64Data, mimeType: 'image/png' } },
  ]);

  return result.response.text() || 'No se pudo generar un análisis.';
};
