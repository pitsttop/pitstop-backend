import { PrismaClient, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardMetrics = async () => {
  // Totais simples
  const [totalClients, totalVehicles, totalOrders, partsCount, servicesCount] =
    await Promise.all([
      prisma.client.count(),
      prisma.vehicle.count(),
      prisma.order.count(),
      prisma.part.count(),
      prisma.service.count(),
    ]);

  // Receita total (somente ordens finalizadas)
  const revenueAgg = await prisma.order.aggregate({
    _sum: { totalValue: true },
    where: { status: OrderStatus.FINISHED },
  });
  const totalRevenue = revenueAgg._sum.totalValue ?? 0;

  // Contagem por status
  const [openCount, inProgressCount, finishedCount, canceledCount] =
    await Promise.all([
      prisma.order.count({ where: { status: OrderStatus.OPEN } }),
      prisma.order.count({ where: { status: OrderStatus.IN_PROGRESS } }),
      prisma.order.count({ where: { status: OrderStatus.FINISHED } }),
      prisma.order.count({ where: { status: OrderStatus.CANCELED } }),
    ]);

  const completionRate = totalOrders === 0 ? 0 : (finishedCount / totalOrders) * 100;

  return {
    totalClients,
    totalVehicles,
    totalOrders,
    totalRevenue,
    partsCount,
    servicesCount,
    ordersByStatus: {
      OPEN: openCount,
      IN_PROGRESS: inProgressCount,
      FINISHED: finishedCount,
      CANCELED: canceledCount,
    },
    completionRate: Number(completionRate.toFixed(2)),
  };
};

export default { getDashboardMetrics };
