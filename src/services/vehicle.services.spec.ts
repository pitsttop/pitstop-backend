import { PrismaClient } from '@prisma/client';
import {
  createVehicle,
  listAllVehicles,
  findVehicleById,
  listVehiclesByClient,
  updateVehicle,
  deleteVehicle,
} from './vehicle.services';

jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    vehicle: {
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

describe('Vehicle Service - Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar um novo veículo', async () => {
    const vehicleData = {
      plate: 'TEST123',
      model: 'Model Test',
      brand: 'Brand Test',
      year: 2024,
      ownerId: 'client-1',
    };
    const createdVehicle = { ...vehicleData, color: null };
    (prisma.vehicle.create as jest.Mock).mockResolvedValue(createdVehicle);

    const result = await createVehicle(vehicleData);

    expect(result).toEqual(createdVehicle);
    expect(prisma.vehicle.create).toHaveBeenCalledWith({
      data: {
        plate: vehicleData.plate,
        model: vehicleData.model,
        brand: vehicleData.brand,
        year: vehicleData.year,
        color: null,
        ownerId: vehicleData.ownerId,
      },
    });
    expect(prisma.vehicle.create).toHaveBeenCalledTimes(1);
  });

  it('deve retornar uma lista de todos os veículos', async () => {
    const mockVehicles = [
      { id: '1', plate: 'AAA111' },
      { id: '2', plate: 'BBB222' },
    ];
    (prisma.vehicle.findMany as jest.Mock).mockResolvedValue(mockVehicles);

    const result = await listAllVehicles();

    expect(result).toEqual(mockVehicles);
    expect(prisma.vehicle.findMany).toHaveBeenCalledTimes(1);
  });

  it('deve retornar um veículo específico pelo ID', async () => {
    const mockVehicle = { id: '1', plate: 'AAA111' };
    (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue(mockVehicle);

    const result = await findVehicleById('1');

    expect(result).toEqual(mockVehicle);
    expect(prisma.vehicle.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(prisma.vehicle.findUnique).toHaveBeenCalledTimes(1);
  });

  it('deve retornar uma lista de veículos de um cliente específico', async () => {
    const mockVehicles = [{ id: '1', plate: 'AAA111', ownerId: 'client-1' }];
    (prisma.vehicle.findMany as jest.Mock).mockResolvedValue(mockVehicles);

    const result = await listVehiclesByClient('client-1');

    expect(result).toEqual(mockVehicles);
    expect(prisma.vehicle.findMany).toHaveBeenCalledWith({
      where: { ownerId: 'client-1' },
    });
    expect(prisma.vehicle.findMany).toHaveBeenCalledTimes(1);
  });

  it('deve atualizar um veículo', async () => {
    const updateData = { model: 'Model Updated' };
    const updatedVehicle = { id: '1', model: 'Model Updated' };
    (prisma.vehicle.update as jest.Mock).mockResolvedValue(updatedVehicle);

    const result = await updateVehicle('1', updateData);

    expect(result).toEqual(updatedVehicle);
    expect(prisma.vehicle.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: updateData,
    });
    expect(prisma.vehicle.update).toHaveBeenCalledTimes(1);
  });

  it('deve deletar um veículo', async () => {
    (prisma.vehicle.delete as jest.Mock).mockResolvedValue({});

    await deleteVehicle('1');

    expect(prisma.vehicle.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    expect(prisma.vehicle.delete).toHaveBeenCalledTimes(1);
  });
});
