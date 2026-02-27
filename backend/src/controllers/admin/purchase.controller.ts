import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { AppError } from '../../utils/errors';
import { z } from 'zod';

const updatePurchaseStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'cancelled']),
  paymentMethod: z.string().optional(),
  paymentReference: z.string().optional(),
  paymentProofUrl: z.string().optional(),
});

export const getPurchases = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, raffleId, userId } = req.query;

    const where: any = {};
    if (status) where.status = status as string;
    if (raffleId) where.raffleId = raffleId as string;
    if (userId) where.userId = userId as string;

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            state: true,
          },
        },
        raffle: {
          select: {
            id: true,
            title: true,
            ticketPrice: true,
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
    });

    res.json({
      success: true,
      data: purchases,
    });
  } catch (error) {
    next(error);
  }
};

export const getPurchaseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        user: true,
        raffle: true,
        tickets: {
          orderBy: { number: 'asc' },
        },
      },
    });

    if (!purchase) {
      throw new AppError(404, 'Purchase not found');
    }

    res.json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePurchaseStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updatePurchaseStatusSchema.parse(req.body);

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        tickets: true,
      },
    });

    if (!purchase) {
      throw new AppError(404, 'Purchase not found');
    }

    // Si se marca como pagado, actualizar boletos a vendidos
    if (data.status === 'paid' && purchase.status !== 'paid') {
      await prisma.$transaction(async (tx) => {
        await tx.purchase.update({
          where: { id },
          data: {
            status: 'paid',
            paymentMethod: data.paymentMethod,
            paymentReference: data.paymentReference,
          },
        });

        await tx.ticket.updateMany({
          where: {
            purchaseId: id,
          },
          data: {
            status: 'sold',
          },
        });
      });
    } else if (data.status === 'cancelled' && purchase.status !== 'cancelled') {
      // Si se cancela, liberar boletos
      await prisma.$transaction(async (tx) => {
        await tx.purchase.update({
          where: { id },
          data: { status: 'cancelled' },
        });

        await tx.ticket.updateMany({
          where: {
            purchaseId: id,
          },
          data: {
            status: 'available',
            purchaseId: null,
          },
        });
      });
    } else if (data.status === 'pending' && purchase.status === 'paid') {
      // De pagado a pendiente: boletos vuelven a reservados
      await prisma.$transaction(async (tx) => {
        await tx.purchase.update({
          where: { id },
          data: { status: 'pending' },
        });

        await tx.ticket.updateMany({
          where: {
            purchaseId: id,
          },
          data: {
            status: 'reserved',
          },
        });
      });
    } else {
      // Solo actualizar estado sin cambiar boletos
      await prisma.purchase.update({
        where: { id },
        data: {
          status: data.status,
          paymentMethod: data.paymentMethod,
          paymentReference: data.paymentReference,
        },
      });
    }

    const updatedPurchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        user: true,
        raffle: true,
        tickets: {
          orderBy: { number: 'asc' },
        },
      },
    });

    res.json({
      success: true,
      data: updatedPurchase,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(error);
    }
    next(error);
  }
};






