import request from 'supertest';

import {
  setupE2ESuite,
  teardownE2ESuite,
  cleanDatabase,
  createAdminToken,
  createClientToken,
  createClient as createClientFixture,
  createVehicle as createVehicleFixture,
  createPart as createPartFixture,
  createService as createServiceFixture,
} from './test-utils';

describe('E2E - Dashboard', () => {
  let createApp: () => import('express').Express;

  beforeAll(async () => {
    const context = await setupE2ESuite();
    createApp = context.createApp!;
  });

  afterAll(async () => {
    await teardownE2ESuite();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  it('retorna métricas para administradores com dados reais', async () => {
    const { prisma } = await setupE2ESuite();
    const client = await createClientFixture(prisma);
    const vehicle = await createVehicleFixture(prisma, client.id);
    const part = await createPartFixture(prisma, { price: 50 });
    const service = await createServiceFixture(prisma);

    const order = await prisma.order.create({
      data: {
        description: 'Serviço completo',
        clientId: client.id,
        vehicleId: vehicle.id,
        status: 'FINISHED',
        totalValue: 0,
      },
    });

    await prisma.partUsage.create({
      data: { orderId: order.id, partId: part.id, quantity: 1 },
    });

    await prisma.serviceUsage.create({
      data: { orderId: order.id, serviceId: service.id },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { totalValue: part.price + service.price },
    });

    const token = createAdminToken();
    const app = createApp();
    const response = await request(app)
      .get('/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      totalClients: 1,
      totalVehicles: 1,
      totalOrders: 1,
    });
  });

  it('bloqueia acesso para clientes', async () => {
    const token = createClientToken();
    const app = createApp();
    const response = await request(app)
      .get('/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Acesso negado: permissão insuficiente.' });
  });
});
