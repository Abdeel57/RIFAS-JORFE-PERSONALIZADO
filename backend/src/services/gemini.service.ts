import type { Chat } from "@google/genai";
import env from '../config/env';

const getAiClient = async () => {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured. Chatbot feature is disabled.");
  }
  const { GoogleGenAI } = await import('@google/genai');
  return new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
};

export const startSupportChat = async (raffleInfo?: { title: string; ticketPrice: number; whatsapp: string }): Promise<Chat> => {
  const ai = await getAiClient();
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `Eres "Nao Assist", el asistente oficial de Rifas Nao. 
      Tu objetivo es ayudar a los clientes con:
      1. Información del sorteo${raffleInfo ? `: ${raffleInfo.title} por $${raffleInfo.ticketPrice}` : ''}.
      2. Pagos: Explicar transferencia BBVA o pago en OXXO. Recuérdales que es OBLIGATORIO enviar el comprobante a WhatsApp${raffleInfo ? ` (${raffleInfo.whatsapp})` : ''}.
      3. Verificación: Si tienen problemas con sus boletos, guíalos a la pestaña "Verificar" e indica que usen su número de teléfono.
      4. Legalidad: Se basa en la Lotería Nacional de México.
      Sé profesional, amable, muy conciso y enfocado en cerrar la venta o resolver dudas técnicas. No inventes premios ni precios.`,
      temperature: 0.7,
    },
  });
};

export const editImage = async (imageBuffer: string, prompt: string): Promise<string | null> => {
  const ai = await getAiClient();
  const base64Data = imageBuffer.split(',')[1];
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/png',
          },
        },
        {
          text: prompt,
        },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const analyzeImage = async (imageBuffer: string): Promise<string> => {
  const ai = await getAiClient();
  const base64Data = imageBuffer.split(',')[1];

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/png',
          },
        },
        {
          text: "Analiza esta imagen detalladamente. Describe qué ves, el ambiente, colores dominantes y cualquier detalle relevante.",
        },
      ],
    },
  });

  return response.text || "No se pudo generar un análisis.";
};


