import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, phone, email } = req.query;

    const where: any = {};
    if (phone) {
      where.phone = { contains: phone as string };
    }
    if (email) {
      where.email = { contains: email as string };
    }
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        _count: {
          select: {
            purchases: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        purchases: {
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
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};






