import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';

/**
 * GET /api/comprobante/:purchaseId
 * Endpoint público para obtener datos del comprobante digital.
 * Solo devuelve datos si la compra está pagada.
 */
export const getComprobante = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { purchaseId } = req.params;

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        user: { select: { name: true, phone: true, email: true, state: true } },
        raffle: { select: { id: true, title: true, drawDate: true, ticketPrice: true } },
        tickets: { select: { number: true }, orderBy: { number: 'asc' } },
      },
    });

    if (!purchase) {
      throw new AppError(404, 'Comprobante no encontrado');
    }

    if (purchase.status !== 'paid') {
      throw new AppError(404, 'Esta compra aún no ha sido confirmada');
    }

    res.json({
      success: true,
      data: {
        id: purchase.id,
        totalAmount: purchase.totalAmount,
        paymentMethod: purchase.paymentMethod,
        paymentReference: purchase.paymentReference,
        createdAt: purchase.createdAt,
        user: purchase.user,
        raffle: purchase.raffle,
        tickets: purchase.tickets,
      },
    });
  } catch (error) {
    next(error);
  }
};
