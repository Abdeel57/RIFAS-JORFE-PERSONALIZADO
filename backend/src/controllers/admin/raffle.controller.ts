import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { AppError } from '../../utils/errors';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const createRaffleSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().min(1),
  prizeImage: z.string().min(1),
  galleryImages: z.array(z.string().min(1)).default([]),
  videoUrl: z.string().url().optional().or(z.literal('')),
  features: z.array(z.object({
    title: z.string(),
    desc: z.string(),
    icon: z.string(),
  })).default([]),
  ticketPrice: z.number().positive(),
  totalTickets: z.number().int().positive(),
  drawDate: z.string().datetime(),
  status: z.enum(['active', 'completed', 'draft']).optional(),
  isVirtual: z.boolean().default(false),
  opportunities: z.number().int().min(1).default(1),
  autoReleaseHours: z.number().int().min(0).default(0),
  luckyMachineNumbers: z.array(z.number().int().positive()).default([5, 10, 20, 50]),
  promoTitle: z.string().optional().nullable(),
  promoDescription: z.string().optional().nullable(),
  promoTiers: z.array(z.object({ qty: z.number().int().positive(), price: z.number().positive() })).optional().nullable(),
  showCountdown: z.boolean().optional().default(false),
});

const updateRaffleSchema = createRaffleSchema.partial();


// Función auxiliar para crear boletos en bloques (evita errores de parámetros en la BD y timeouts)
// Función auxiliar para crear boletos en bloques
async function ensureTicketsExist(raffleId: string, totalTickets: number, opportunities: number, tx: any) {
  const totalEmissions = totalTickets * opportunities;
  console.log(`🛠️ [TICKETS] Asegurando existencia de ${totalEmissions} boletos (${totalTickets} venta, ${totalEmissions - totalTickets} regalo) para rifa ${raffleId}...`);

  // 1. Obtener boletos existentes para no duplicar
  const existingTickets = await tx.ticket.findMany({
    where: { raffleId },
    select: { number: true }
  });

  const existingNumbers = new Set(existingTickets.map((t: any) => t.number));
  const ticketsToCreate = [];
  const GIFT_START = totalTickets + 1;

  for (let i = 1; i <= totalEmissions; i++) {
    if (!existingNumbers.has(i)) {
      ticketsToCreate.push({
        raffleId,
        number: i,
        status: 'available' as const,
        isGift: i >= GIFT_START,
      });
    }
  }

  if (ticketsToCreate.length === 0) {
    console.log(`✅ [TICKETS] Todos los boletos ya existen.`);
    return;
  }

  // 2. Insertar en bloques de 5000 para máxima estabilidad
  const CHUNK_SIZE = 5000;
  for (let i = 0; i < ticketsToCreate.length; i += CHUNK_SIZE) {
    const chunk = ticketsToCreate.slice(i, i + CHUNK_SIZE);
    await tx.ticket.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    console.log(`⏳ [TICKETS] Insertados ${i + chunk.length}/${ticketsToCreate.length}...`);
  }

  console.log(`✅ [TICKETS] Creación completada.`);
}

export const createRaffle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createRaffleSchema.parse(req.body);

    const raffle = await prisma.$transaction(async (tx) => {
      const { promoTiers, ...restData } = data;
      const newRaffle = await tx.raffle.create({
        data: {
          ...restData,
          status: data.status || 'active',
          drawDate: new Date(data.drawDate),
          showCountdown: data.showCountdown ?? false,
          autoReleaseHours: data.autoReleaseHours || 0,
          luckyMachineNumbers: data.luckyMachineNumbers || [5, 10, 20, 50],
          // Prisma requires Prisma.JsonNull instead of null for Json fields
          ...(promoTiers !== undefined ? { promoTiers: promoTiers === null ? Prisma.JsonNull : promoTiers } : {}),
        },
      });

      // Crear boletos solo si NO es virtual
      if (!data.isVirtual) {
        await ensureTicketsExist(newRaffle.id, data.totalTickets, data.opportunities || 1, tx);
      }

      return newRaffle;
    }, { timeout: 30000 }); // Aumentar timeout para rifas grandes

    const raffleWithDetails = await prisma.raffle.findUnique({
      where: { id: raffle.id },
      include: {
        _count: {
          select: { tickets: { where: { status: 'sold' } } },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: raffleWithDetails,
    });
  } catch (error) {
    if (error instanceof z.ZodError) return next(error);
    next(error);
  }
};

export const updateRaffle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateRaffleSchema.parse(req.body);

    const existingRaffle = await prisma.raffle.findUnique({ where: { id } });
    if (!existingRaffle) throw new AppError(404, 'Raffle not found');

    const result = await prisma.$transaction(async (tx) => {
      const { promoTiers: newPromoTiers, ...restUpdateData } = data;
      const updateData: any = { ...restUpdateData };
      if (data.drawDate) updateData.drawDate = new Date(data.drawDate);
      // Sanitize Json field: Prisma requires Prisma.JsonNull instead of null
      if (newPromoTiers !== undefined) {
        updateData.promoTiers = newPromoTiers === null ? Prisma.JsonNull : newPromoTiers;
      }

      const updatedRaffle = await tx.raffle.update({
        where: { id },
        data: updateData,
      });

      // Determinar si ahora es tradicional y si necesitamos generar boletos
      const isNowVirtual = data.isVirtual !== undefined ? data.isVirtual : existingRaffle.isVirtual;
      const totalTickets = data.totalTickets !== undefined ? data.totalTickets : existingRaffle.totalTickets;

      if (!isNowVirtual) {
        const opportunities = data.opportunities !== undefined ? data.opportunities : existingRaffle.opportunities;
        await ensureTicketsExist(id, totalTickets, opportunities, tx);

        // Si se redujo el numero de boletos o ahora hay menos emisiones
        const totalEmissions = totalTickets * opportunities;
        const existingTotal = existingRaffle.totalTickets * (existingRaffle as any).opportunities;

        if (totalEmissions < existingTotal) {
          await tx.ticket.deleteMany({
            where: {
              raffleId: id,
              status: 'available',
              number: { gt: totalEmissions },
            },
          });
        }
      }

      return updatedRaffle;
    }, { timeout: 30000 });

    const raffleWithDetails = await prisma.raffle.findUnique({
      where: { id: result.id },
      include: {
        _count: {
          select: { tickets: { where: { status: 'sold' } } },
        },
      },
    });

    res.json({
      success: true,
      data: raffleWithDetails,
    });
  } catch (error) {
    if (error instanceof z.ZodError) return next(error);
    next(error);
  }
};


export const deleteRaffle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const raffle = await prisma.raffle.findUnique({
      where: { id },
    });

    if (!raffle) {
      throw new AppError(404, 'Raffle not found');
    }

    // onDelete: Cascade in schema handles cleanup of related tickets and purchases
    await prisma.raffle.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Raffle deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getAllRaffles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const raffles = await prisma.raffle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            tickets: {
              where: { status: 'sold' },
            },
            purchases: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: raffles,
    });
  } catch (error) {
    next(error);
  }
}; function normalizePhoneImport(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export const importTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: raffleId } = req.params;
    const { rows } = req.body; // Array<{ name, phone, ticketNumbers: number[], status: 'sold' | 'reserved', state?: string }>

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new AppError(400, 'Se requiere un array de filas con name, phone y ticketNumbers');
    }

    const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
    if (!raffle) throw new AppError(404, 'Rifa no encontrada');

    const results = {
      success: 0,
      errors: [] as string[],
    };

    for (const row of rows) {
      try {
        const { name, phone: rawPhone, ticketNumbers, status: ticketStatus, state } = row;
        const phone = normalizePhoneImport(rawPhone);

        // Validaciones básicas
        if (!name || !phone || phone.length < 10 || !ticketNumbers || !Array.isArray(ticketNumbers) || ticketNumbers.length === 0) {
          results.errors.push(`Fila inválida: Faltan datos obligatorios para ${name || 'usuario desconocido'}`);
          continue;
        }

        // Mapear estado de ticket a estado de compra
        // status en row puede ser 'sold' o 'reserved'
        const purchaseStatus = ticketStatus === 'reserved' ? 'pending' : 'paid';
        const finalTicketStatus = ticketStatus === 'reserved' ? 'reserved' : 'sold';

        await prisma.$transaction(async (tx) => {
          // 1. Upsert User (Normalizar nombre)
          const userName = String(name).trim();
          const user = await tx.user.upsert({
            where: { phone },
            update: { name: userName, state: state || undefined },
            create: { name: userName, phone, state: state || undefined },
          });

          // 2. Create Purchase
          const purchase = await tx.purchase.create({
            data: {
              userId: user.id,
              raffleId,
              status: purchaseStatus as any,
              totalAmount: ticketNumbers.length * raffle.ticketPrice,
              paymentMethod: 'Importación Manual',
              paymentReference: 'IMPORTD',
              verificationStatus: 'auto_verified',
            },
          });

          // 3. Process Tickets
          for (const num of ticketNumbers) {
            const ticketNum = Number(num);
            if (isNaN(ticketNum) || ticketNum < 1 || ticketNum > raffle.totalTickets) {
              throw new Error(`Número de boleto fuera de rango: ${num}`);
            }

            if (raffle.isVirtual) {
              // En modo virtual, el boleto podría no existir aún en BD
              await tx.ticket.upsert({
                where: { raffleId_number: { raffleId, number: ticketNum } },
                update: { status: finalTicketStatus, purchaseId: purchase.id },
                create: { raffleId, number: ticketNum, status: finalTicketStatus, purchaseId: purchase.id },
              });
            } else {
              // En modo tradicional, el boleto DEBE existir (creado al crear la rifa)
              const existingTicket = await tx.ticket.findUnique({
                where: { raffleId_number: { raffleId, number: ticketNum } },
              });

              if (!existingTicket) {
                // Si por alguna razón no existe, lo creamos para no fallar la importación
                await tx.ticket.create({
                  data: { raffleId, number: ticketNum, status: finalTicketStatus, purchaseId: purchase.id },
                });
              } else {
                if (existingTicket.status !== 'available') {
                  throw new Error(`Boleto #${ticketNum} ya está ocupado (${existingTicket.status})`);
                }

                await tx.ticket.update({
                  where: { id: existingTicket.id },
                  data: { status: finalTicketStatus, purchaseId: purchase.id },
                });
              }
            }
          }
        });

        results.success++;
      } catch (err: any) {
        results.errors.push(`Error en fila ${row.phone || row.name}: ${err.message}`);
      }
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

