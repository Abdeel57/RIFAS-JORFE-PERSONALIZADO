import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { AppError } from '../../utils/errors';
import { z } from 'zod';

const updateTicketSchema = z.object({
  status: z.enum(['available', 'reserved', 'sold']),
});

export const getTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { raffleId, status, purchaseId, search } = req.query;

    const where: any = {};
    if (raffleId) where.raffleId = raffleId as string;
    if (status) where.status = status as string;
    if (purchaseId) where.purchaseId = purchaseId as string;

    // Si hay búsqueda por número exacto, priorizarla
    const searchNumber = search && !isNaN(Number(search)) ? Number(search) : null;
    if (searchNumber) {
      where.number = searchNumber;
    } else if (search) {
      // Búsqueda por nombre de usuario o teléfono (vía purchase)
      where.OR = [
        { purchase: { user: { name: { contains: search as string, mode: 'insensitive' } } } },
        { purchase: { user: { phone: { contains: search as string } } } },
      ];
    }

    // Si es una rifa virtual y NO se está filtrando por algo específico,
    // por defecto no devolvemos los "disponibles" porque no existen en la BD.
    // Pero si se busca un número específico, lo manejamos después.

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        raffle: {
          select: {
            id: true,
            title: true,
            isVirtual: true,
            totalTickets: true,
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
      take: 500, // Límite de seguridad
    });

    // Si se buscó un número específico en una rifa virtual y no se encontró, "sintetizar" uno disponible
    if (searchNumber && tickets.length === 0 && raffleId) {
      const raffle = await prisma.raffle.findUnique({
        where: { id: raffleId as string },
        select: { id: true, title: true, isVirtual: true, totalTickets: true },
      });

      if (raffle?.isVirtual && searchNumber >= 1 && searchNumber <= raffle.totalTickets) {
        tickets.push({
          id: `virtual-${raffle.id}-${searchNumber}`,
          raffleId: raffle.id,
          number: searchNumber,
          status: 'available',
          purchaseId: null,
          raffle: { id: raffle.id, title: raffle.title },
          purchase: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      }
    }

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

    let updatedTicket;

    if (id.startsWith('virtual-')) {
      const parts = id.split('-');
      // id format: virtual-{raffleId}-{number}
      // parts[1] is raffleId, parts[2...n] might be number if raffleId has hyphens.
      // Safer: parts is ['virtual', raffleId, number]
      const raffleId = parts[1];
      const number = Number(parts[parts.length - 1]);

      updatedTicket = await prisma.ticket.create({
        data: {
          raffleId,
          number,
          status,
        },
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
    } else {
      const ticket = await prisma.ticket.findUnique({
        where: { id },
      });

      if (!ticket) {
        throw new AppError(404, 'Boleto no encontrado');
      }

      updatedTicket = await prisma.ticket.update({
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
    }

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






