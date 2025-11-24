import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

type CreateVehicleDTO = {
  plate: string;
  model: string;
  brand: string;
  year: number;
  color?: string;
  ownerId: string;
};

export const createVehicle = async (data: CreateVehicleDTO) => {
  return await prisma.vehicle.create({
    data: {
      plate: data.plate,
      model: data.model,
      brand: data.brand,
      year: data.year,
      color: data.color || null,
      ownerId: data.ownerId,
    },
  });
};

export const listAllVehicles = async () => {
  return await prisma.vehicle.findMany({
    include: { owner: true },
  });
};

export const findVehicleById = async (id: string) => {
  return await prisma.vehicle.findUnique({
    where: { id: id },
  });
};

export const listVehiclesByClient = async (clientId: string) => {
  return await prisma.vehicle.findMany({
    where: { ownerId: clientId },
  });
};

export const updateVehicle = async (
  id: string,
  vehicleData: Prisma.VehicleUpdateInput,
) => {
  return await prisma.vehicle.update({
    where: { id: id },
    data: vehicleData,
  });
};

export const deleteVehicle = async (id: string) => {
  return await prisma.vehicle.delete({
    where: { id: id },
  });
};
