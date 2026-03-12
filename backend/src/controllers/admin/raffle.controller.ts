import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { AppError } from '../../utils/errors';
import { z } from 'zod';

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
  status: z.enum(['active', 'completed', 'draft']).default('active'),
  isVirtual: z.boolean().default(false),
});

const updateRaffleSchema = createRaffleSchema.partial();

export const createRaffle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createRaffleSchema.parse(req.body);

    const raffle = await prisma.raffle.create({
      data: {
        ...data,
        drawDate: new Date(data.drawDate),
      },
    });

    // Crear boletos solo si NO es virtual
    if (!data.isVirtual) {
      const tickets = Array.from({ length: data.totalTickets }, (_, i) => ({
        raffleId: raffle.id,
        number: i + 1,
        status: 'available' as const,
      }));

      await prisma.ticket.createMany({
        data: tickets,
      });
    }

    const raffleWithTickets = await prisma.raffle.findUnique({
      where: { id: raffle.id },
      include: {
        _count: {
          select: {
            tickets: {
              where: { status: 'sold' },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: raffleWithTickets,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(error);
    }
    next(error);
  }
};

export const updateRaffle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateRaffleSchema.parse(req.body);

    const existingRaffle = await prisma.raffle.findUnique({
      where: { id },
    });

    if (!existingRaffle) {
      throw new AppError(404, 'Raffle not found');
    }

    const updateData: any = { ...data };
    if (data.drawDate) {
      updateData.drawDate = new Date(data.drawDate);
    }

    // Si se cambia el total de boletos y NO es virtual, ajustar
    if (data.totalTickets && data.totalTickets !== existingRaffle.totalTickets && !existingRaffle.isVirtual) {
      const currentTicketCount = await prisma.ticket.count({
        where: { raffleId: id },
      });

      if (data.totalTickets > currentTicketCount) {
        // Agregar boletos
        const newTickets = Array.from(
          { length: data.totalTickets - currentTicketCount },
          (_, i) => ({
            raffleId: id,
            number: currentTicketCount + i + 1,
            status: 'available' as const,
          })
        );
        await prisma.ticket.createMany({
          data: newTickets,
        });
      } else if (data.totalTickets < currentTicketCount) {
        // Eliminar boletos disponibles que excedan el nuevo total
        await prisma.ticket.deleteMany({
          where: {
            raffleId: id,
            status: 'available',
            number: { gt: data.totalTickets },
          },
        });
      }
    }

    const raffle = await prisma.raffle.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            tickets: {
              where: { status: 'sold' },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: raffle,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(error);
    }
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
}; export const importTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: raffleId } = req.params;
    const { rows } = req.body; // Array<{ name, phone, ticketNumbers: number[], status: 'sold' | 'reserved', state?: string }>

    const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
    if (!raffle) throw new AppError(404, 'Raffle not found');

    const results = {
      success: 0,
      errors: [] as string[],
    };

    // Procesar en lote o secuencialmente. 
    // Para simplificar y evitar colisiones de usuarios, lo haremos en un bucle con transacciones por fila o una grande.
    // Usaremos una transacción por fila para que un error en una no detenga todo el proceso.

    for (const row of rows) {
      try {
        const { name, phone, ticketNumbers, status, state } = row;

        if (!name || !phone || !ticketNumbers || ticketNumbers.length === 0) {
          results.errors.push(`Fila inválida: Faltan datos obligatorios`);
          continue;
        }

        await prisma.$transaction(async (tx) => {
          // 1. Upsert User
          const user = await tx.user.upsert({
            where: { phone },
            update: { name, state: state || undefined },
            create: { name, phone, state: state || undefined },
          });

          // 2. Create Purchase
          const purchase = await tx.purchase.create({
            data: {
              userId: user.id,
              raffleId,
              status: status === 'sold' ? 'paid' : 'pending',
              totalAmount: ticketNumbers.length * raffle.ticketPrice,
              paymentMethod: 'Importación Manual',
              paymentReference: 'IMPORTD',
              verificationStatus: 'auto_verified',
            },
          });

          // 3. Process Tickets
          for (const num of ticketNumbers) {
            if (num < 1 || num > raffle.totalTickets) {
              throw new Error(`Número de boleto fuera de rango: ${num}`);
            }

            if (raffle.isVirtual) {
              // En modo virtual, el boleto podría no existir aún en BD
              await tx.ticket.upsert({
                where: { raffleId_number: { raffleId, number: num } },
                update: { status, purchaseId: purchase.id },
                create: { raffleId, number: num, status, purchaseId: purchase.id },
              });
            } else {
              // En modo tradicional, el boleto DEBE existir
              const existingTicket = await tx.ticket.findUnique({
                where: { raffleId_number: { raffleId, number: num } },
              });

              if (!existingTicket) {
                throw new Error(`Boleto #${num} no existe en la base de datos de esta rifa tradicional`);
              }

              if (existingTicket.status !== 'available') {
                throw new Error(`Boleto #${num} ya está ocupado (${existingTicket.status})`);
              }

              await tx.ticket.update({
                where: { id: existingTicket.id },
                data: { status, purchaseId: purchase.id },
              });
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

