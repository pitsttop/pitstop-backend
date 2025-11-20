import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Definimos exatamente o que esperamos receber
type CreateVehicleDTO = {
  plate: string;
  model: string;
  brand: string;
  year: number;
  color?: string;
  ownerId: string; // OBRIGATÓRIO: ID do Cliente (da tabela Client)
};

export const createVehicle = async (data: CreateVehicleDTO) => {
  // Mapeamos explicitamente para evitar erros de tipo
  return await prisma.vehicle.create({
    data: {
      plate: data.plate,
      model: data.model,
      brand: data.brand,
      year: data.year,
      color: data.color || null,
      // O Prisma conecta automaticamente se o campo userId/ownerId for uma String na tabela
      ownerId: data.ownerId, 
    },
  });
};

export const listAllVehicles = async () => {
  return await prisma.vehicle.findMany({
    include: { owner: true } // Traz os dados do dono junto (opcional)
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