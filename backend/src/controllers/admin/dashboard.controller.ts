import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalRaffles,
      activeRaffles,
      totalTickets,
      soldTickets,
      totalPurchases,
      pendingPurchases,
      paidPurchases,
      totalRevenue,
      totalUsers,
    ] = await Promise.all([
      prisma.raffle.count(),
      prisma.raffle.count({ where: { status: 'active' } }),
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: 'sold' } }),
      prisma.purchase.count(),
      prisma.purchase.count({ where: { status: 'pending' } }),
      prisma.purchase.count({ where: { status: 'paid' } }),
      prisma.purchase.aggregate({
        where: { status: 'paid' },
        _sum: { totalAmount: true },
      }),
      prisma.user.count(),
    ]);

    const recentPurchases = await prisma.purchase.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            phone: true,
            email: true,
          },
        },
        raffle: {
          select: {
            title: true,
          },
        },
        tickets: {
          select: {
            number: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalRaffles,
          activeRaffles,
          totalTickets,
          soldTickets,
          availableTickets: totalTickets - soldTickets,
          totalPurchases,
          pendingPurchases,
          paidPurchases,
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          totalUsers,
        },
        recentPurchases,
      },
    });
  } catch (error) {
    next(error);
  }
};






