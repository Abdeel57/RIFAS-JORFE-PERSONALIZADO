import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { AppError } from '../../utils/errors';
import { z } from 'zod';

const updateTicketSchema = z.object({
  status: z.enum(['available', 'reserved', 'sold']),
});

export const getTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { raffleId, status, purchaseId } = req.query;

    const where: any = {};
    if (raffleId) where.raffleId = raffleId as string;
    if (status) where.status = status as string;
    if (purchaseId) where.purchaseId = purchaseId as string;

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        raffle: {
          select: {
            id: true,
            title: true,
          },
        },
        purchase: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [
        { raffleId: 'asc' },
        { number: 'asc' },
      ],
    });

    res.json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = updateTicketSchema.parse(req.body);

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new AppError(404, 'Ticket not found');
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: { status },
      include: {
        raffle: {
          select: {
            id: true,
            title: true,
          },
        },
        purchase: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedTicket,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(error);
    }
    next(error);
  }
};






