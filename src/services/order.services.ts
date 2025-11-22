import { PrismaClient, OrderStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Interface para definir os filtros de busca
interface OrderFilters {
  status?: OrderStatus;
  clientId?: string;
  vehicleId?: string;
}

export const listOrdersByClient = async (clientId: string) => {
  return await prisma.order.findMany({
    where: { 
      clientId: clientId 
    },
    include: {
      vehicle: true, // Dados do carro
      client: true,
      servicesPerformed: {
        include: { service: true } // Nome e preço do serviço
      },
      partsUsed: {
        include: { part: true } // Nome e preço da peça
      }
    },
    orderBy: {
      createdAt: 'desc' // Mais recentes primeiro
    }
  });
};

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
export const updateOrderStatus = async (
  id: string,
  props: { status: string | OrderStatus; endDate?: string; totalValue?: number | null }
) => {
  const status = props.status as OrderStatus;

  // Se ainda não temos o total calculado, ou se preferir garantir sempre,
  // buscamos a ordem completa e calculamos com base nas relações.
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
      (acc, item) => acc + ((item.part?.price ?? 0) * item.quantity),
      0,
    );

    computedTotal = totalServicos + totalPecas;
  }

  const updatePayload: Prisma.OrderUpdateInput = {
    status,
    ...(status === OrderStatus.FINISHED
      ? { endDate: props.endDate ? new Date(props.endDate) : new Date(), totalValue: computedTotal ?? 0 }
      : props.totalValue !== undefined ? { totalValue: props.totalValue } : {}),
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

// --- FUNÇÃO ADICIONADA: Adicionar Serviço à Ordem ---
export const addServiceToOrder = async (
  orderId: string,
  serviceId: string,
) => {
  // Cria uma nova entrada em ServiceUsage (que é a tabela de relacionamento)
  // O ServiceUsage tem uma chave composta (orderId_serviceId) se o seu schema for assim,
  // mas o Prisma por padrão usa 'create' e falhará se tentar duplicar um relacionamento @unique
  return await prisma.serviceUsage.create({
    data: {
      orderId: orderId,
      serviceId: serviceId,
    },
  });
};

// --- FUNÇÃO ADICIONADA: Remover Serviço da Ordem ---
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