import { PrismaClient, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Interface para definir os filtros de busca
interface OrderFilters {
  status?: OrderStatus;
  clientId?: string;
  vehicleId?: string;
}

// Cria uma nova Ordem de Serviço
export const createOrder = async (orderData: {
  description: string;
  clientId: string;
  vehicleId: string;
}) => {
  // 1. Validar se o cliente existe
  const client = await prisma.client.findUnique({
    where: { id: orderData.clientId },
  });
  if (!client) {
    throw new Error('Cliente não encontrado');
  }

  // 2. Validar se o veículo existe e pertence ao cliente
  const vehicle = await prisma.vehicle.findUnique({
    where: { 
      id: orderData.vehicleId,
      ownerId: orderData.clientId // Garantir que o veículo pertence ao cliente
    },
  });
  if (!vehicle) {
    throw new Error('Veículo não encontrado ou não pertence ao cliente');
  }

  // 3. Criar a ordem usando o formato correto do Prisma para relacionamentos
  return await prisma.order.create({
    data: {
      description: orderData.description,
      client: {
        connect: { id: orderData.clientId }
      },
      vehicle: {
        connect: { id: orderData.vehicleId }
      },
      // O status inicial será 'OPEN' por padrão, definido no schema
    },
    include: {
      client: true,
      vehicle: true
    }
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

export const addPartToOrder = async (
  orderId: string,
  partId: string,
  quantity: number,
) => {
  // Usamos 'upsert' para criar a associação ou atualizar a quantidade se a peça já existir na ordem
  return await prisma.partUsage.upsert({
    where: {
      orderId_partId: {
        // A chave única que definimos no schema.prisma
        orderId: orderId,
        partId: partId,
      },
    },
    update: {
      quantity: {
        increment: quantity, // Se já existe, soma a nova quantidade
      },
    },
    create: {
      orderId: orderId,
      partId: partId,
      quantity: quantity,
    },
  });
};

// Remove uma peça de uma Ordem de Serviço
export const removePartFromOrder = async (partUsageId: string) => {
  return await prisma.partUsage.delete({
    where: {
      id: partUsageId,
    },
  });
};
