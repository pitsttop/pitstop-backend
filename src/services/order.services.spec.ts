import { PrismaClient, OrderStatus } from '@prisma/client';
import {
  createOrder,
  listOrders,
  findOrderById,
  updateOrderStatus,
} from './order.services';

// Mock do Prisma que preserva os Enums (OrderStatus)
jest.mock('@prisma/client', () => {
  const originalModule = jest.requireActual('@prisma/client');
  const mockPrismaClient = {
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  return {
    __esModule: true,
    ...originalModule, // Mantém os enums reais (OrderStatus)
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

const prisma = new PrismaClient();

describe('Order Service - Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Teste para createOrder
  it('deve criar uma nova ordem de serviço', async () => {
    const orderData = {
      description: 'Troca de óleo',
      clientId: 'c1',
      vehicleId: 'v1',
    };
    (prisma.order.create as jest.Mock).mockResolvedValue(orderData);

    const result = await createOrder(orderData);

    expect(result).toEqual(orderData);
    expect(prisma.order.create).toHaveBeenCalledWith({ data: orderData });
    expect(prisma.order.create).toHaveBeenCalledTimes(1);
  });

  // Teste para listOrders
  it('deve listar ordens de serviço com filtros', async () => {
    const filters = { status: OrderStatus.OPEN };
    const mockOrders = [{ id: 'o1', status: OrderStatus.OPEN }];
    (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

    const result = await listOrders(filters);

    expect(result).toEqual(mockOrders);
    expect(prisma.order.findMany).toHaveBeenCalledWith({
      where: filters,
      include: { client: true, vehicle: true },
    });
    expect(prisma.order.findMany).toHaveBeenCalledTimes(1);
  });

  // Teste para findOrderById
  it('deve encontrar uma ordem de serviço pelo ID', async () => {
    const mockOrder = { id: 'o1', description: 'Troca de óleo' };
    (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

    const result = await findOrderById('o1');

    expect(result).toEqual(mockOrder);
    expect(prisma.order.findUnique).toHaveBeenCalledWith({
      where: { id: 'o1' },
      include: {
        client: true,
        vehicle: true,
        partsUsed: { include: { part: true } },
        servicesPerformed: { include: { service: true } },
      },
    });
    expect(prisma.order.findUnique).toHaveBeenCalledTimes(1);
  });

  // Teste para updateOrderStatus
  it('deve atualizar o status de uma ordem de serviço', async () => {
    const updatedOrder = { id: 'o1', status: OrderStatus.FINISHED };
    (prisma.order.update as jest.Mock).mockResolvedValue(updatedOrder);

    const result = await updateOrderStatus('o1', OrderStatus.FINISHED);

    expect(result).toEqual(updatedOrder);
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'o1' },
      data: { status: OrderStatus.FINISHED },
    });
    expect(prisma.order.update).toHaveBeenCalledTimes(1);
  });
});
