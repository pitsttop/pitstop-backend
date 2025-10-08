import { PrismaClient } from '@prisma/client';
import {
  listClients,
  createClient,
  findClientById,
  updateClient,
  deleteClient,
} from './client.services';

jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    client: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrismaClient) };
});

const prisma = new PrismaClient();

describe('Client Service - Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Teste 1: para a função listClients
  it('deve chamar prisma.client.findMany e retornar uma lista de clientes', async () => {
    const mockClients = [
      { id: '1', name: 'Cliente Teste 1', phone: '123' },
      { id: '2', name: 'Cliente Teste 2', phone: '456' },
    ];
    (prisma.client.findMany as jest.Mock).mockResolvedValue(mockClients);

    const clients = await listClients();

    expect(clients).toEqual(mockClients);
    expect(prisma.client.findMany).toHaveBeenCalledTimes(1);
  });

  // Teste 2: para a função createClient
  it('deve chamar prisma.client.create com os dados corretos e retornar o novo cliente', async () => {
    const newClientData = {
      name: 'Cliente Novo',
      phone: '987654321',
      email: 'novo@email.com',
    };
    const createdClient = {
      id: 'mock-id-123',
      ...newClientData,
      address: null,
      createdAt: new Date(),
    };
    (prisma.client.create as jest.Mock).mockResolvedValue(createdClient);

    const result = await createClient(newClientData);

    expect(result).toEqual(createdClient);
    expect(prisma.client.create).toHaveBeenCalledTimes(1);
    expect(prisma.client.create).toHaveBeenCalledWith({
      data: {
        name: newClientData.name,
        phone: newClientData.phone,
        email: newClientData.email,
      },
    });
  });
  // Teste 3: para a função findClientById
  it('deve chamar prisma.client.findUnique e retornar um cliente quando o ID existir', async () => {
    const mockClient = {
      id: 'valid-id',
      name: 'Cliente Encontrado',
      phone: '123',
    };
    (prisma.client.findUnique as jest.Mock).mockResolvedValue(mockClient);

    const result = await findClientById('valid-id');

    expect(result).toEqual(mockClient);
    expect(prisma.client.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.client.findUnique).toHaveBeenCalledWith({
      where: { id: 'valid-id' },
    });
  });

  it('deve retornar null quando o cliente com o ID não existir', async () => {
    (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await findClientById('invalid-id');

    expect(result).toBeNull();
    expect(prisma.client.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.client.findUnique).toHaveBeenCalledWith({
      where: { id: 'invalid-id' },
    });
  });
  // Teste 4: para a função updateClient
  it('deve chamar prisma.client.update com os dados corretos e retornar o cliente atualizado', async () => {
    const clientId = 'client-id-to-update';
    const updateData = { name: 'Nome Atualizado' };
    const updatedClient = {
      id: clientId,
      name: 'Nome Atualizado',
      phone: '123456789',
      email: 'teste@email.com',
      address: null,
      createdAt: new Date(),
    };
    (prisma.client.update as jest.Mock).mockResolvedValue(updatedClient);

    const result = await updateClient(clientId, updateData);

    expect(result).toEqual(updatedClient);
    expect(prisma.client.update).toHaveBeenCalledTimes(1);
    expect(prisma.client.update).toHaveBeenCalledWith({
      where: { id: clientId },
      data: updateData,
    });
  });

  // Teste 6: para a função deleteClient
  it('deve chamar prisma.client.delete com o ID correto', async () => {
    const clientId = 'client-id-to-delete';
    (prisma.client.delete as jest.Mock).mockResolvedValue({});

    await deleteClient(clientId);

    expect(prisma.client.delete).toHaveBeenCalledTimes(1);
    expect(prisma.client.delete).toHaveBeenCalledWith({
      where: { id: clientId },
    });
  });
});
