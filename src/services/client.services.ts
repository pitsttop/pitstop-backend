import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// --- FUNÇÃO NOVA NECESSÁRIA PARA O AGENDAMENTO ---
// Busca o cliente pelo ID do usuário (Link do Auth)
export const findClientByUserId = async (userId: string) => {
  return await prisma.client.findFirst({
    where: { userId: userId },
  });
};

// --- FUNÇÃO ATUALIZADA (CORRIGE O ERRO) ---
// Agora recebe 'data' (dados do form) E 'userId' (do token)
export const createClient = async (data: any, userId: string) => {
  return await prisma.client.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address || null, // Adicionei caso venha
      
      // AQUI ESTÁ A CORREÇÃO DO ERRO:
      userId: userId, 
    },
  });
};

// --- Outras funções (Mantidas) ---

export const listClients = async (searchTerm?: string) => {
  const whereClause: Prisma.ClientWhereInput = searchTerm
    ? {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
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
  clientData: Prisma.ClientUpdateInput
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