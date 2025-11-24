import { PrismaClient, OrderStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface OrderFilters {
  status?: OrderStatus;
  clientId?: string;
  vehicleId?: string;
}

export const listOrdersByClient = async (clientId: string) => {
  return await prisma.order.findMany({
    where: {
      clientId: clientId,
    },
    include: {
      vehicle: true,
      client: true,
      servicesPerformed: {
        include: { service: true },
      },
      partsUsed: {
        include: { part: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const createOrder = async (orderData: {
  description: string;
  clientId: string;
  vehicleId: string;
}) => {
  const client = await prisma.client.findUnique({
    where: { id: orderData.clientId },
  });
  if (!client) {
    throw new Error('Cliente não encontrado');
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: {
      id: orderData.vehicleId,
      ownerId: orderData.clientId,
    },
  });
  if (!vehicle) {
    throw new Error('Veículo não encontrado ou não pertence ao cliente');
  }

  return await prisma.order.create({
    data: {
      description: orderData.description,
      client: {
        connect: { id: orderData.clientId },
      },
      vehicle: {
        connect: { id: orderData.vehicleId },
      },
    },
    include: {
      client: true,
      vehicle: true,
    },
  });
};

export const listOrders = async (filters: OrderFilters) => {
  return await prisma.order.findMany({
    where: filters,
    include: {
      client: true,
      vehicle: true,
    },
  });
};

export const findOrderById = async (id: string) => {
  return await prisma.order.findUnique({
    where: { id: id },
    include: {
      client: true,
      vehicle: true,
      partsUsed: { include: { part: true } },
      servicesPerformed: { include: { service: true } },
    },
  });
};

export const updateOrderStatus = async (
  id: string,
  props: {
    status: string | OrderStatus;
    endDate?: string;
    totalValue?: number | null;
  },
) => {
  const status = props.status as OrderStatus;

  let computedTotal = props.totalValue ?? null;
  if (status === OrderStatus.FINISHED) {
    const ordemCompleta = await prisma.order.findUnique({
      where: { id },
      include: {
        servicesPerformed: { include: { service: true } },
        partsUsed: { include: { part: true } },
      },
    });

    if (!ordemCompleta) {
      throw new Error('Ordem de serviço não encontrada.');
    }

    const totalServicos = (ordemCompleta.servicesPerformed || []).reduce(
      (acc, item) => acc + (item.service?.price ?? 0),
      0,
    );

    const totalPecas = (ordemCompleta.partsUsed || []).reduce(
      (acc, item) => acc + (item.part?.price ?? 0) * item.quantity,
      0,
    );

    computedTotal = totalServicos + totalPecas;
  }

  const updatePayload: Prisma.OrderUpdateInput = {
    status,
    ...(status === OrderStatus.FINISHED
      ? {
          endDate: props.endDate ? new Date(props.endDate) : new Date(),
          totalValue: computedTotal ?? 0,
        }
      : props.totalValue !== undefined
        ? { totalValue: props.totalValue }
        : {}),
  };

  return prisma.order.update({
    where: { id },
    data: updatePayload,
    include: {
      servicesPerformed: { include: { service: true } },
      partsUsed: { include: { part: true } },
    },
  });
};

export const addServiceToOrder = async (orderId: string, serviceId: string) => {
  return await prisma.serviceUsage.create({
    data: {
      orderId: orderId,
      serviceId: serviceId,
    },
  });
};

export const removeServiceFromOrder = async (serviceUsageId: string) => {
  return await prisma.serviceUsage.delete({
    where: {
      id: serviceUsageId,
    },
  });
};

export const addPartToOrder = async (
  orderId: string,
  partId: string,
  quantity: number,
) => {
  return await prisma.partUsage.upsert({
    where: {
      orderId_partId: {
        orderId: orderId,
        partId: partId,
      },
    },
    update: {
      quantity: {
        increment: quantity,
      },
    },
    create: {
      orderId: orderId,
      partId: partId,
      quantity: quantity,
    },
  });
};

export const removePartFromOrder = async (partUsageId: string) => {
  return await prisma.partUsage.delete({
    where: {
      id: partUsageId,
    },
  });
};
