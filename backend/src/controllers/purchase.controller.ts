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

const uploadPaymentProofSchema = z.object({
  paymentProofUrl: z.string().min(1, 'Se requiere el comprobante de pago'),
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
      // Verificar si el email ya está en uso por otro usuario
      const existingEmailUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingEmailUser) {
        // Actualizar datos del usuario existente por email
        user = await prisma.user.update({
          where: { id: existingEmailUser.id },
          data: {
            name: userData.name,
            phone: userData.phone,
            state: userData.state,
          },
        });
      } else {
        user = await prisma.user.create({
          data: userData,
        });
      }
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

export const uploadPaymentProof = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validated = uploadPaymentProofSchema.parse(req.body);

    // Verificar que la compra existe y está pendiente
    const purchase = await prisma.purchase.findUnique({
      where: { id },
    });

    if (!purchase) {
      throw new AppError(404, 'Purchase not found');
    }

    if (purchase.status === 'paid') {
      throw new AppError(400, 'Purchase is already paid');
    }

    if (purchase.status === 'cancelled') {
      throw new AppError(400, 'Purchase has been cancelled');
    }

    // Validar que el comprobante sea una imagen base64 o URL válida
    const proofData = validated.paymentProofUrl;
    const isBase64 = proofData.startsWith('data:image/');
    const isUrl = proofData.startsWith('http://') || proofData.startsWith('https://');

    if (!isBase64 && !isUrl) {
      throw new AppError(400, 'Invalid payment proof format. Must be a base64 image or URL.');
    }

    // Guardar el comprobante
    // Note: paymentProofUrl field is new - Prisma client will be regenerated on deploy
    const updatedPurchase = await (prisma.purchase.update as any)({
      where: { id },
      data: {
        paymentProofUrl: proofData,
        paymentMethod: 'SPEI',
      },
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

    res.json({
      success: true,
      data: updatedPurchase,
      message: 'Comprobante de pago recibido. Tu orden será verificada pronto.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(error);
    }
    next(error);
  }
};
