import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export type CreateClientInput = {
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
};

export const findClientByUserId = async (userId: string) => {
  return await prisma.client.findFirst({
    where: { userId: userId },
  });
};

export const createClient = async (data: CreateClientInput, userId: string) => {
  return await prisma.client.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      address: data.address ?? null,
      userId: userId,
    },
  });
};

export const listClients = async (searchTerm?: string) => {
  const whereClause: Prisma.ClientWhereInput = searchTerm
    ? {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm } },
        ],
      }
    : {};

  return await prisma.client.findMany({
    where: whereClause,
  });
};

export const findClientById = async (id: string) => {
  return await prisma.client.findUnique({
    where: { id: id },
  });
};

export const updateClient = async (
  id: string,
  clientData: Prisma.ClientUpdateInput,
) => {
  return await prisma.client.update({
    where: { id: id },
    data: clientData,
  });
};

export const deleteClient = async (id: string) => {
  return await prisma.client.delete({
    where: { id: id },
  });
};
