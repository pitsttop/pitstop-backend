import { PrismaClient } from '@prisma/client';
import {
  createService,
  listServices,
  findServiceById,
  updateService,
  deleteService,
} from './service.services';
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    service: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrismaClient) };
});

const prisma = new PrismaClient();

describe('Service Service - Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar um novo serviço', async () => {
    const serviceData = { name: 'Troca de Óleo', price: 150 };
    (prisma.service.create as jest.Mock).mockResolvedValue(serviceData);

    const result = await createService(serviceData);

    expect(result).toEqual(serviceData);
    expect(prisma.service.create).toHaveBeenCalledWith({ data: serviceData });
  });

  it('deve retornar uma lista de serviços', async () => {
    const mockServices = [
      { id: '1', name: 'Troca de Óleo' },
      { id: '2', name: 'Alinhamento' },
    ];
    (prisma.service.findMany as jest.Mock).mockResolvedValue(mockServices);

    const result = await listServices();

    expect(result).toEqual(mockServices);
    expect(prisma.service.findMany).toHaveBeenCalledTimes(1);
  });

  it('deve retornar um serviço específico pelo ID', async () => {
    const mockService = { id: '1', name: 'Troca de Óleo' };
    (prisma.service.findUnique as jest.Mock).mockResolvedValue(mockService);

    const result = await findServiceById('1');

    expect(result).toEqual(mockService);
    expect(prisma.service.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
    });
  });

  it('deve atualizar um serviço', async () => {
    const updateData = { price: 180.0 };
    const updatedService = { id: '1', price: 180.0 };
    (prisma.service.update as jest.Mock).mockResolvedValue(updatedService);

    const result = await updateService('1', updateData);

    expect(result).toEqual(updatedService);
    expect(prisma.service.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: updateData,
    });
  });

  it('deve deletar um serviço', async () => {
    (prisma.service.delete as jest.Mock).mockResolvedValue({});

    await deleteService('1');

    expect(prisma.service.delete).toHaveBeenCalledWith({ where: { id: '1' } });
  });
});
