import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { z } from 'zod';

const verifySchema = z.object({
  phone: z.string().length(10),
});

export const verifyTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = verifySchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { phone },
      include: {
        purchases: {
          where: {
            status: { in: ['pending', 'paid'] },
          },
          include: {
            raffle: {
              select: {
                id: true,
                title: true,
                drawDate: true,
              },
            },
            tickets: {
              select: {
                id: true,
                number: true,
                status: true,
              },
              orderBy: { number: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return res.json({
        success: true,
        data: {
          user: null,
          tickets: [],
        },
      });
    }

    const tickets = user.purchases.flatMap(purchase =>
      purchase.tickets.map(ticket => ({
        number: ticket.number,
        status: purchase.status === 'paid' ? 'Pagado' : 'Pendiente',
        purchaseId: purchase.id,
        raffle: purchase.raffle,
      }))
    );

    res.json({
      success: true,
      data: {
        user: {
          name: user.name,
          phone: user.phone,
          email: user.email,
        },
        tickets,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(error);
    }
    next(error);
  }
};






