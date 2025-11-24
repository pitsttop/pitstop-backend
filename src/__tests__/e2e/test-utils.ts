import { execSync } from 'child_process';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';
import type { Express } from 'express';

let prismaSingleton: PrismaClient | null = null;
let appFactory: (() => Express) | null = null;
let migrationsExecuted = false;

const ensureEnv = () => {
  process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'PITSTOP_E2E_FALLBACK_SECRET_123';
  }
};

const runMigrations = () => {
  if (migrationsExecuted) {
    return;
  }

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env,
  });

  migrationsExecuted = true;
};

export const setupE2ESuite = async () => {
  ensureEnv();
  runMigrations();

  if (!prismaSingleton) {
    prismaSingleton = new PrismaClient();
  }

  if (!appFactory) {
    // @ts-ignore ts-jest resolve módulos sem extensão durante os testes
    const appModule = await import('../../app');
    appFactory = appModule.createApp;
  }

  return {
    prisma: prismaSingleton,
    createApp: appFactory,
  };
};

export const cleanDatabase = async () => {
  if (!prismaSingleton) {
    throw new Error('Prisma client not initialised. Call setupE2ESuite first.');
  }

  const prisma = prismaSingleton;

  await prisma.$transaction([
    prisma.serviceUsage.deleteMany(),
    prisma.partUsage.deleteMany(),
    prisma.order.deleteMany(),
    prisma.vehicle.deleteMany(),
    prisma.service.deleteMany(),
    prisma.part.deleteMany(),
    prisma.client.deleteMany(),
  ]);
};

export const teardownE2ESuite = async () => {
  if (prismaSingleton) {
    await prismaSingleton.$disconnect();
    prismaSingleton = null;
  }
  appFactory = null;
  migrationsExecuted = false;
};

export const createAdminToken = () =>
  jwt.sign(
    { userId: `admin-${randomUUID()}`, role: UserRole.ADMIN },
    process.env.JWT_SECRET!,
    {
      expiresIn: '1h',
    },
  );

export const createClientToken = () =>
  jwt.sign(
    { userId: `client-${randomUUID()}`, role: UserRole.CLIENT },
    process.env.JWT_SECRET!,
    {
      expiresIn: '1h',
    },
  );

export const createService = (
  prisma: PrismaClient,
  overrides?: { id?: string },
) =>
  prisma.service.create({
    data: {
      id: overrides?.id,
      name: `Serviço ${randomUUID()}`,
      description: 'E2E service',
      price: 150,
    },
  });

export const createPart = (
  prisma: PrismaClient,
  overrides?: { id?: string; price?: number },
) =>
  prisma.part.create({
    data: {
      id: overrides?.id,
      name: `Peça ${randomUUID()}`,
      description: 'E2E part',
      price: overrides?.price ?? 100,
      stock: 10,
    },
  });

export const createClient = (
  prisma: PrismaClient,
  data?: { userId?: string; phone?: string; email?: string },
) =>
  prisma.client.create({
    data: {
      name: 'Cliente E2E',
      phone: data?.phone ?? `6199${Math.floor(Math.random() * 90000 + 10000)}`,
      email: data?.email ?? `cliente-${randomUUID()}@oficina.com`,
      address: 'Endereço E2E',
      userId: data?.userId ?? `user-${randomUUID()}`,
    },
  });

export const createVehicle = (
  prisma: PrismaClient,
  ownerId: string,
  overrides?: { plate?: string; id?: string },
) =>
  prisma.vehicle.create({
    data: {
      id: overrides?.id,
      plate:
        overrides?.plate ?? `E2E-${Math.floor(Math.random() * 9000 + 1000)}`,
      model: 'Model E2E',
      brand: 'Brand E2E',
      year: 2024,
      color: 'blue',
      ownerId,
    },
  });
