
import { PrismaClient } from '@prisma/client';
import {
  createPart,
  listParts,
  findPartById,
  updatePart,
  deletePart,
} from './part.services';

jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    part: {
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

describe('Part Service - Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar uma nova peça', async () => {
    const partData = { name: 'Filtro de Ar', price: 50, stock: 10 };
    (prisma.part.create as jest.Mock).mockResolvedValue(partData);

    const result = await createPart(partData);

    expect(result).toEqual(partData);
    expect(prisma.part.create).toHaveBeenCalledWith({ data: partData });
  });

  it('deve retornar uma lista de peças', async () => {
    const mockParts = [
      { id: '1', name: 'Filtro de Ar' },
      { id: '2', name: 'Vela de Ignição' },
    ];
    (prisma.part.findMany as jest.Mock).mockResolvedValue(mockParts);

    const result = await listParts();

    expect(result).toEqual(mockParts);
    expect(prisma.part.findMany).toHaveBeenCalledTimes(1);
  });

  it('deve retornar uma peça específica pelo ID', async () => {
    const mockPart = { id: '1', name: 'Filtro de Ar' };
    (prisma.part.findUnique as jest.Mock).mockResolvedValue(mockPart);

    const result = await findPartById('1');

    expect(result).toEqual(mockPart);
    expect(prisma.part.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
  });

  it('deve atualizar uma peça', async () => {
    const updateData = { price: 55.5 };
    const updatedPart = { id: '1', price: 55.5 };
    (prisma.part.update as jest.Mock).mockResolvedValue(updatedPart);

    const result = await updatePart('1', updateData);

    expect(result).toEqual(updatedPart);
    expect(prisma.part.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: updateData,
    });
  });

  it('deve deletar uma peça', async () => {
    (prisma.part.delete as jest.Mock).mockResolvedValue({});

    await deletePart('1');

    expect(prisma.part.delete).toHaveBeenCalledWith({ where: { id: '1' } });
  });
});
