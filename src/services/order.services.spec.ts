import { PrismaClient, OrderStatus } from '@prisma/client';
import {
  createOrder,
  listOrders,
  findOrderById,
  updateOrderStatus,
} from './order.services';

jest.mock('@prisma/client', () => {
  const originalModule = jest.requireActual('@prisma/client');
  const mockPrismaClient = {
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    client: {
      findUnique: jest.fn(),
    },
    vehicle: {
      findUnique: jest.fn(),
    },
  };
  return {
    __esModule: true,
    ...originalModule,
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

const prisma = new PrismaClient();

describe('Order Service - Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar uma nova ordem de serviço', async () => {
    const orderData = {
      description: 'Troca de óleo',
      clientId: 'c1',
      vehicleId: 'v1',
    };
    (prisma.client.findUnique as jest.Mock).mockResolvedValue({
      id: orderData.clientId,
    });
    (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue({
      id: orderData.vehicleId,
      ownerId: orderData.clientId,
    });

    (prisma.order.create as jest.Mock).mockResolvedValue(orderData);

    const result = await createOrder(orderData);

    expect(result).toEqual(orderData);
    expect(prisma.order.create).toHaveBeenCalledWith({
      data: {
        description: orderData.description,
        client: { connect: { id: orderData.clientId } },
        vehicle: { connect: { id: orderData.vehicleId } },
      },
      include: { client: true, vehicle: true },
    });
    expect(prisma.order.create).toHaveBeenCalledTimes(1);
  });

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

  it('deve atualizar o status quando a ordem não foi finalizada', async () => {
    const payload = { status: OrderStatus.IN_PROGRESS };
    const updatedOrder = { id: 'o1', status: OrderStatus.IN_PROGRESS };
    (prisma.order.update as jest.Mock).mockResolvedValue(updatedOrder);

    const result = await updateOrderStatus('o1', payload);

    expect(result).toEqual(updatedOrder);
    expect(prisma.order.findUnique).not.toHaveBeenCalled();
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'o1' },
      data: { status: OrderStatus.IN_PROGRESS },
      include: {
        servicesPerformed: { include: { service: true } },
        partsUsed: { include: { part: true } },
      },
    });
  });

  it('deve calcular total e registrar endDate ao finalizar a ordem', async () => {
    const payload = { status: OrderStatus.FINISHED, endDate: '2025-01-01' };
    const orderSnapshot = {
      id: 'o1',
      servicesPerformed: [{ service: { price: 100 } }],
      partsUsed: [{ quantity: 2, part: { price: 50 } }],
    };
    const updatedOrder = {
      id: 'o1',
      status: OrderStatus.FINISHED,
      totalValue: 200,
    };

    (prisma.order.findUnique as jest.Mock).mockResolvedValue(orderSnapshot);
    (prisma.order.update as jest.Mock).mockResolvedValue(updatedOrder);

    const result = await updateOrderStatus('o1', payload);

    expect(result).toEqual(updatedOrder);
    expect(prisma.order.findUnique).toHaveBeenCalledWith({
      where: { id: 'o1' },
      include: {
        servicesPerformed: { include: { service: true } },
        partsUsed: { include: { part: true } },
      },
    });
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'o1' },
      data: expect.objectContaining({
        status: OrderStatus.FINISHED,
        endDate: new Date('2025-01-01'),
        totalValue: 200,
      }),
      include: {
        servicesPerformed: { include: { service: true } },
        partsUsed: { include: { part: true } },
      },
    });
  });
});
