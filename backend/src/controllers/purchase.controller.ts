import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { z } from 'zod';

const createPurchaseSchema = z.object({
  raffleId: z.string().min(1),
  ticketNumbers: z.array(z.number().int().positive()).min(1),
  user: z.object({
    name: z.string().min(1),
    phone: z.string().length(10),
    email: z.string().email(),
    state: z.string().min(1),
  }),
});

export const createPurchase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createPurchaseSchema.parse(req.body);
    const { raffleId, ticketNumbers, user: userData } = validated;

    // Verificar que la rifa existe y está activa
    const raffle = await prisma.raffle.findUnique({
      where: { id: raffleId },
    });

    if (!raffle) {
      throw new AppError(404, 'Raffle not found');
    }

    if (raffle.status !== 'active') {
      throw new AppError(400, 'Raffle is not active');
    }

    // Verificar que los boletos existen y están disponibles
    const tickets = await prisma.ticket.findMany({
      where: {
        raffleId,
        number: { in: ticketNumbers },
      },
    });

    if (tickets.length !== ticketNumbers.length) {
      throw new AppError(400, 'Some tickets do not exist');
    }

    const unavailableTickets = tickets.filter(t => t.status !== 'available');
    if (unavailableTickets.length > 0) {
      throw new AppError(400, `Tickets ${unavailableTickets.map(t => t.number).join(', ')} are not available`);
    }

    // Crear o obtener usuario
    let user = await prisma.user.findUnique({
      where: { phone: userData.phone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: userData,
      });
    } else {
      // Actualizar datos del usuario si han cambiado
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: userData.name,
          email: userData.email,
          state: userData.state,
        },
      });
    }

    // Calcular total
    const totalAmount = ticketNumbers.length * raffle.ticketPrice;

    // Crear compra y actualizar boletos en una transacción
    const purchase = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          userId: user.id,
          raffleId,
          totalAmount,
          status: 'pending',
        },
      });

      await tx.ticket.updateMany({
        where: {
          raffleId,
          number: { in: ticketNumbers },
        },
        data: {
          status: 'reserved',
          purchaseId: purchase.id,
        },
      });

      return purchase;
    });

    // Obtener la compra completa con relaciones
    const purchaseWithDetails = await prisma.purchase.findUnique({
      where: { id: purchase.id },
      include: {
        user: true,
        raffle: true,
        tickets: {
          select: {
            id: true,
            number: true,
            status: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: purchaseWithDetails,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(error);
    }
    next(error);
  }
};





