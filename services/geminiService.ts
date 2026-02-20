
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { FEATURED_RAFFLE, CONTACT_INFO } from '../constants.ts';

const getAiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const startSupportChat = () => {
  const ai = getAiClient();
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `Eres "Nao Assist", el asistente oficial de Rifas Nao. 
      Tu objetivo es ayudar a los clientes con:
      1. Información del sorteo: ${FEATURED_RAFFLE.title} por $${FEATURED_RAFFLE.ticketPrice}.
      2. Pagos: Explicar transferencia BBVA o pago en OXXO. Recuérdales que es OBLIGATORIO enviar el comprobante a WhatsApp (${CONTACT_INFO.whatsapp}).
      3. Verificación: Si tienen problemas con sus boletos, guíalos a la pestaña "Verificar" e indica que usen su número de teléfono.
      4. Legalidad: Se basa en la Lotería Nacional de México.
      Sé profesional, amable, muy conciso y enfocado en cerrar la venta o resolver dudas técnicas. No inventes premios ni precios.`,
      temperature: 0.7,
    },
  });
};

export const editImage = async (imageBuffer: string, prompt: string): Promise<string | null> => {
  const ai = getAiClient();
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
  const ai = getAiClient();
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
