// src/services/user.services.spec.ts

// Importa os enums REAIS do Prisma antes de qualquer outra coisa
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { createUser, loginUser } from './user.services';

// Agora fazemos o mock do Prisma, garantindo que os enums reais sejam mantidos
jest.mock('@prisma/client', () => {
  const originalModule = jest.requireActual('@prisma/client');
  const mockPrismaClient = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  return {
    __esModule: true,
    ...originalModule, // Mantém os enums (UserRole, etc.)
    PrismaClient: jest.fn(() => mockPrismaClient), // Substitui apenas o PrismaClient
  };
});

// Mock das bibliotecas externas
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

const prisma = new PrismaClient();

describe('User Service - Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Teste para createUser
  it('deve chamar prisma.user.create com a senha criptografada', async () => {
    // 1. ARRANJO (Arrange)
    const newUserData = {
      name: 'Usuário Teste',
      email: 'user@teste.com',
      password: 'senha123',
    };
    const hashedPassword = 'hashed_password_string';
    const createdUser = {
      id: 'user-id-123',
      name: newUserData.name,
      email: newUserData.email,
      password: hashedPassword,
      role: UserRole.CLIENT,
      createdAt: new Date(),
    };

    (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
    (prisma.user.create as jest.Mock).mockResolvedValue(createdUser);

    // 2. AÇÃO (Act)
    const result = await createUser(newUserData);

    // 3. ASSERÇÃO (Assert)
    expect(result).toEqual(createdUser);
    expect(bcrypt.hash).toHaveBeenCalledWith(newUserData.password, 10);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: newUserData.name,
        email: newUserData.email,
        password: hashedPassword,
        role: UserRole.CLIENT,
      },
    });
  });

  // Teste para loginUser (cenário de sucesso)
  it('deve retornar um token JWT quando as credenciais estiverem corretas', async () => {
    // 1. ARRANJO (Arrange)
    const loginData = { email: 'user@teste.com', password: 'senha123' };
    const hashedPassword = 'hashed_password_string';
    const mockUser = {
      id: 'user-id-123',
      email: loginData.email,
      password: hashedPassword,
      role: UserRole.CLIENT,
    };
    const mockToken = 'jwt-token-string';

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true); // Finge que a senha está correta
    (jwt.sign as jest.Mock).mockReturnValue(mockToken);

    // 2. AÇÃO (Act)
    const result = await loginUser(loginData);

    // 3. ASSERÇÃO (Assert)
    expect(result).toEqual({ token: mockToken });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: loginData.email } });
    expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, hashedPassword);
    expect(jwt.sign).toHaveBeenCalledTimes(1);
  });
   it('deve lançar um erro se o usuário com o email não for encontrado', async () => {
    // 1. ARRANJO (Arrange)
    const loginData = { email: 'inexistente@email.com', password: 'senha123' };
    // Ensinamos o dublê a retornar 'null', como se não tivesse encontrado o usuário
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    // 2. AÇÃO E ASSERÇÃO (Act & Assert)
    // Usamos 'expect(...).rejects.toThrow(...)' para testar funções que devem lançar um erro
    await expect(loginUser(loginData)).rejects.toThrow('Credenciais inválidas');
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
  });

  // Teste de falha 2: Senha incorreta
  it('deve lançar um erro se a senha estiver incorreta', async () => {
    // 1. ARRANJO (Arrange)
    const loginData = { email: 'user@teste.com', password: 'senhaErrada' };
    const mockUser = {
      id: 'user-id-123',
      email: loginData.email,
      password: 'hashed_password_correta',
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    // Ensinamos o dublê da função 'compare' a retornar 'false'
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    // 2. AÇÃO E ASSERÇÃO (Act & Assert)
    await expect(loginUser(loginData)).rejects.toThrow('Credenciais inválidas');
    expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password);
  });

});