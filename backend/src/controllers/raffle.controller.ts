import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';

export const getRaffles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    
    const where: any = {};
    if (status === 'active') {
      where.status = 'active';
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
};

export const getRaffleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const raffle = await prisma.raffle.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });

    if (!raffle) {
      throw new AppError(404, 'Raffle not found');
    }

    res.json({
      success: true,
      data: raffle,
    });
  } catch (error) {
    next(error);
  }
};

export const getRaffleTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const where: any = { raffleId: id };
    if (status) {
      where.status = status;
    }

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { number: 'asc' },
      select: {
        id: true,
        number: true,
        status: true,
      },
    });

    res.json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};





