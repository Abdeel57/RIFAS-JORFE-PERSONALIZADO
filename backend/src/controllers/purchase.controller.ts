import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { z } from 'zod';
import { schedulePaymentVerification } from '../services/verificationQueue';

const createPurchaseSchema = z.object({
  raffleId: z.string().min(1),
  ticketNumbers: z.array(z.number().int().positive()).min(1),
  user: z.object({
    name: z.string().min(1),
    phone: z.string().length(10),
    state: z.string().min(1),
  }),
});

const uploadPaymentProofSchema = z.object({
  paymentProofUrl: z.string().min(1, 'Se requiere el comprobante de pago'),
});

// Normalizar teléfono a 10 dígitos (México: quitar espacios, código país, etc.)
function normalizePhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

export const createPurchase = async (req: Request, res: Response, next: NextFunction) => {
  console.log('📦 [CREATE_PURCHASE] Request received', { bodyKeys: req.body ? Object.keys(req.body) : [] });
  try {
    const body = req.body || {};
    if (body.user && typeof body.user.phone === 'string') {
      body.user = { ...body.user, phone: normalizePhone(body.user.phone) };
    }
    const validated = createPurchaseSchema.parse(body);
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

    // Verificar que los boletos están disponibles
    const tickets = await prisma.ticket.findMany({
      where: {
        raffleId,
        number: { in: ticketNumbers },
      },
    });

    // En modo virtual, solo los boletos vendidos/apartados están en la BD.
    // En modo normal, TODOS los boletos deben existir en la BD.
    if (!(raffle as any).isVirtual && tickets.length !== ticketNumbers.length) {
      throw new AppError(400, 'Algunos boletos no existen');
    }

    if ((raffle as any).isVirtual) {
      // Validar rango
      for (const n of ticketNumbers) {
        if (n < 1 || n > raffle.totalTickets) {
          throw new AppError(400, `Boleto #${n} fuera de rango (1-${raffle.totalTickets})`);
        }
      }
    }

    const unavailableTickets = tickets.filter(t => t.status !== 'available');
    if (unavailableTickets.length > 0) {
      throw new AppError(400, `Los boletos ${unavailableTickets.map(t => t.number).join(', ')} ya no están disponibles`);
    }

    // Crear o obtener usuario (identificado por teléfono)
    let user = await prisma.user.findUnique({
      where: { phone: userData.phone },
    });

    if (!user) {
      // Crear nuevo usuario sin email
      user = await prisma.user.create({
        data: {
          name: userData.name,
          phone: userData.phone,
          state: userData.state,
        },
      });
    } else {
      // Actualizar nombre y estado del usuario existente
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: userData.name,
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

      if ((raffle as any).isVirtual) {
        // En modo virtual, crear los que no existen y actualizar los que sí
        const existingNumbers = tickets.map((t) => t.number);
        const numbersToCreate = ticketNumbers.filter((n) => !existingNumbers.includes(n));
        const numbersToUpdate = ticketNumbers.filter((n) => existingNumbers.includes(n));

        if (numbersToCreate.length > 0) {
          await tx.ticket.createMany({
            data: numbersToCreate.map((n) => ({
              raffleId,
              number: n,
              status: 'reserved',
              purchaseId: purchase.id,
              isGift: false,
            })),
          });
        }

        if (numbersToUpdate.length > 0) {
          await tx.ticket.updateMany({
            where: {
              raffleId,
              number: { in: numbersToUpdate },
            },
            data: {
              status: 'reserved',
              purchaseId: purchase.id,
              isGift: false,
            },
          });
        }
      } else {
        // Modo normal: solo actualizar
        await tx.ticket.updateMany({
          where: {
            raffleId,
            number: { in: ticketNumbers },
          },
          data: {
            status: 'reserved',
            purchaseId: purchase.id,
            isGift: false,
          },
        });
      }

      // ASIGNAR BOLETOS DE REGALO
      const opportunities = (raffle as any).opportunities || 1;
      if (opportunities > 1) {
        const giftCount = ticketNumbers.length * (opportunities - 1);

        // Buscar boletos marcados como regalo que estén disponibles
        // En modo virtual, podríamos tener que crearlos.
        // Pero para simplificar y asegurar consistencia con el pool separado:

        if ((raffle as any).isVirtual) {
          // Generar números al azar en el rango de regalos (totalTickets + 1 en adelante)
          const giftNumbers: number[] = [];
          const usedGiftNumbers = new Set<number>();

          // Obtener regalos ya ocupados para esta rifa
          const existingGifts = await tx.ticket.findMany({
            where: { raffleId, isGift: true },
            select: { number: true }
          });
          existingGifts.forEach((g: any) => usedGiftNumbers.add(g.number));

          const totalEmissions = raffle.totalTickets * opportunities;
          const GIFT_START = raffle.totalTickets + 1;

          while (giftNumbers.length < giftCount) {
            const randomNum = Math.floor(Math.random() * (totalEmissions - GIFT_START + 1)) + GIFT_START;
            if (!usedGiftNumbers.has(randomNum)) {
              giftNumbers.push(randomNum);
              usedGiftNumbers.add(randomNum);
            }
            // Si por alguna razón matemática extrema nos quedamos sin números, rompemos para evitar loop infinito
            if (usedGiftNumbers.size >= (totalEmissions - GIFT_START + 1) && giftNumbers.length < giftCount) break;
          }

          if (giftNumbers.length > 0) {
            await tx.ticket.createMany({
              data: giftNumbers.map(n => ({
                raffleId,
                number: n,
                status: 'reserved',
                purchaseId: purchase.id,
                isGift: true
              }))
            });
          }
        } else {
          // Modo tradicional: buscar en la BD boletos con isGift: true y status: available
          const availableGifts = await tx.ticket.findMany({
            where: {
              raffleId,
              isGift: true,
              status: 'available'
            },
            take: giftCount,
            orderBy: { id: 'asc' } // O usar un orden aleatorio si la BD lo soporta bien
          });

          if (availableGifts.length > 0) {
            await tx.ticket.updateMany({
              where: {
                id: { in: availableGifts.map((g: any) => g.id) }
              },
              data: {
                status: 'reserved',
                purchaseId: purchase.id
              }
            });
          }
        }
      }

      return purchase;
    });

    // Obtener la compra completa
    const purchaseWithDetails = await prisma.purchase.findUnique({
      where: { id: purchase.id },
      include: {
        user: true,
        raffle: true,
        tickets: {
          select: { id: true, number: true, status: true, isGift: true },
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
    console.log(`📷 [COMPROBANTE] POST payment-proof recibido para orden ${id.slice(-8)}`);
    const validated = uploadPaymentProofSchema.parse(req.body);

    // Verificar que la compra existe
    const purchase = await prisma.purchase.findUnique({ where: { id } });

    if (!purchase) throw new AppError(404, 'Purchase not found');
    if (purchase.status === 'paid') throw new AppError(400, 'Purchase is already paid');
    if (purchase.status === 'cancelled') throw new AppError(400, 'Purchase has been cancelled');

    // Validar formato de imagen
    const proofData = validated.paymentProofUrl;
    const isBase64 = proofData.startsWith('data:image/');
    const isUrl = proofData.startsWith('http://') || proofData.startsWith('https://');
    console.log(`📷 [COMPROBANTE] Formato: ${isBase64 ? 'base64 (verificación automática)' : isUrl ? 'URL (revisión manual)' : 'inválido'}`);

    if (!isBase64 && !isUrl) {
      throw new AppError(400, 'Invalid payment proof format. Must be a base64 image or URL.');
    }

    // Guardar el comprobante y marcar como "en verificación"
    const updatedPurchase = await (prisma.purchase.update as any)({
      where: { id },
      data: {
        paymentProofUrl: proofData,
        paymentMethod: 'SPEI',
        verificationStatus: 'pending_verification',
        verificationNote: 'Comprobante recibido. Verificación automática programada en 2 minutos.',
      },
      include: {
        user: true,
        raffle: true,
        tickets: {
          select: { id: true, number: true, status: true, isGift: true },
        },
      },
    });

    // Verificación automática (solo si está habilitada en configuración): no bloquea la orden
    if (isBase64) {
      try {
        const settings = await prisma.systemSettings.findUnique({ where: { id: 'default' } });

        if (settings?.autoVerificationEnabled !== false) {
          schedulePaymentVerification(id, proofData);
          console.log(`✅ [COMPROBANTE] Orden ${id.slice(-8)}: verificación automática programada para ejecutarse en unos segundos.`);
        } else {

          await (prisma.purchase.update as any)({
            where: { id },
            data: {
              verificationStatus: 'pending_manual',
              verificationNote: 'Verificación automática deshabilitada. Revisar manualmente.',
            },
          });
        }
      } catch (err: any) {
        console.warn('⚠️ No se pudo programar verificación automática (la orden se guardó correctamente):', err?.message);
      }
    } else {
      await (prisma.purchase.update as any)({
        where: { id },
        data: {
          verificationStatus: 'pending_manual',
          verificationNote: 'Comprobante como URL — requiere revisión manual del administrador.',
        },
      });
    }

    res.json({
      success: true,
      data: updatedPurchase,
      message: 'Comprobante recibido. Un administrador revisará tu pago y te confirmará por WhatsApp.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(error);
    }
    next(error);
  }
};

export const getPurchase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        user: true,
        raffle: true,
        tickets: {
          select: { id: true, number: true, status: true, isGift: true },
          orderBy: { number: 'asc' }
        },
      },
    });

    if (!purchase) {
      throw new AppError(404, 'Compra no encontrada');
    }

    res.json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    next(error);
  }
};
