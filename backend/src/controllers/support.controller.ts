import { Request, Response, NextFunction } from 'express';
import { startSupportChat } from '../services/gemini.service';
import prisma from '../config/database';
import { z } from 'zod';

const chatSchema = z.object({
  message: z.string().min(1),
  raffleId: z.string().optional(),
});

export const handleChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verificar si Gemini está configurado
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        error: 'Chatbot no disponible. La funcionalidad de IA no está configurada.',
      });
    }

    const { message, raffleId } = chatSchema.parse(req.body);

    let raffleInfo;
    if (raffleId) {
      const raffle = await prisma.raffle.findUnique({
        where: { id: raffleId },
        select: {
          title: true,
          ticketPrice: true,
        },
      });
      if (raffle) {
        raffleInfo = {
          title: raffle.title,
          ticketPrice: raffle.ticketPrice,
          whatsapp: '+521234567890', // Debería venir de constants o env
        };
      }
    }

    const chat = startSupportChat(raffleInfo);
    const result = await chat.sendMessage(message);

    res.json({
      success: true,
      data: {
        response: result.response.text() || 'No se pudo generar una respuesta.',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(error);
    }
    // Si es error de Gemini no configurado, devolver mensaje amigable
    if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
      return res.status(503).json({
        success: false,
        error: 'Chatbot no disponible. La funcionalidad de IA no está configurada.',
      });
    }
    next(error);
  }
};


