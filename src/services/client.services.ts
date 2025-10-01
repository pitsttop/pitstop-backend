import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Função para listar todos os clientes
export const listClients = async () => {
  const clients = await prisma.client.findMany();
  return clients;
};

// Função para criar um novo cliente
export const createClient = async (clientData: any) => {
  const client = await prisma.client.create({
    data: clientData,
  });
  return client;
};

// Função para buscar um cliente por ID
export const findClientById = async (id: string) => {
  const client = await prisma.client.findUnique({
    where: { id: id },
  });
  return client;
};

// Função para atualizar os dados de um cliente
export const updateClient = async (id: string, clientData: any) => {
  return await prisma.client.update({
    where: { id: id },
    data: clientData,
  });
};

// Função para deletar um cliente
export const deleteClient = async (id: string) => {
  return await prisma.client.delete({
    where: { id: id },
  });
};