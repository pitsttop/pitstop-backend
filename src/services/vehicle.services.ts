import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createVehicle = async (vehicleData: any) => {
  return await prisma.vehicle.create({
    data: vehicleData,
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

export const updateVehicle = async (id: string, vehicleData: any) => {
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
