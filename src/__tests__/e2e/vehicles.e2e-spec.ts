import request from 'supertest';

import {
  setupE2ESuite,
  teardownE2ESuite,
  cleanDatabase,
  createAdminToken,
  createClient as createClientFixture,
} from './test-utils';

describe('E2E - Veículos', () => {
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

  it('cria veículo associado a um cliente', async () => {
    const { prisma } = await setupE2ESuite();
    const client = await createClientFixture(prisma);

    const token = createAdminToken();
    const app = createApp();
    const response = await request(app)
      .post('/veiculos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        plate: 'E2E-1234',
        model: 'Civic',
        brand: 'Honda',
        year: 2022,
        color: 'Cinza',
        ownerId: client.id,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ plate: 'E2E-1234', ownerId: client.id });
  });

  it('lista veículos cadastrados', async () => {
    const { prisma } = await setupE2ESuite();
    const client = await createClientFixture(prisma);
    await prisma.vehicle.create({
      data: {
        plate: 'E2E-5678',
        model: 'Corolla',
        brand: 'Toyota',
        year: 2023,
        color: 'Branco',
        ownerId: client.id,
      },
    });

    const token = createAdminToken();
    const app = createApp();
    const response = await request(app)
      .get('/veiculos')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
  });
});
