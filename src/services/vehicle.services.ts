
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

type CreateVehicleDTO = {
  plate: string;
  model: string;
  brand?: string;
  year?: number;
  color?: string | null;
  ownerId: string;
};

export const createVehicle = async (vehicleData: CreateVehicleDTO) => {
  // Pass-through the DTO to Prisma. Cast to satisfy the generated Prisma types in TS.
  return await prisma.vehicle.create({
    data: vehicleData as unknown as Prisma.VehicleCreateInput,
  });
};

export const listAllVehicles = async () => {
  return await prisma.vehicle.findMany();
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
