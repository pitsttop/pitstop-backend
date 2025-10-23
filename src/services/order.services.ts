import { PrismaClient, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Interface para definir os filtros de busca
interface OrderFilters {
  status?: OrderStatus;
  clientId?: string;
  vehicleId?: string;
}

// Cria uma nova Ordem de Serviço
export const createOrder = async (orderData: any) => {
  return await prisma.order.create({
    data: {
      description: orderData.description,
      clientId: orderData.clientId,
      vehicleId: orderData.vehicleId,
      // O status inicial será 'OPEN' por padrão, definido no schema
    },
  });
};

// Lista Ordens de Serviço com filtros opcionais
export const listOrders = async (filters: OrderFilters) => {
  return await prisma.order.findMany({
    where: filters,
    include: {
      // Inclui os dados do cliente e do veículo na resposta
      client: true,
      vehicle: true,
    },
  });
};

// Busca uma Ordem de Serviço específica por ID
export const findOrderById = async (id: string) => {
  return await prisma.order.findUnique({
    where: { id: id },
    include: {
      // Também inclui os detalhes das peças e serviços
      client: true,
      vehicle: true,
      partsUsed: { include: { part: true } },
      servicesPerformed: { include: { service: true } },
    },
  });
};

// Atualiza o status de uma Ordem de Serviço
export const updateOrderStatus = async (id: string, status: OrderStatus) => {
  return await prisma.order.update({
    where: { id: id },
    data: { status: status },
  });
};
