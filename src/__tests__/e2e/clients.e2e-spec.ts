import request from 'supertest';

import {
  setupE2ESuite,
  teardownE2ESuite,
  cleanDatabase,
  createAdminToken,
  createClientToken,
  createClient as createClientFixture,
} from './test-utils';

describe('E2E - Clientes', () => {
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

  it('permite criação de cliente com token do próprio usuário', async () => {
    const token = createClientToken();
    const payload = {
      name: 'Fulano e2e',
      phone: '61999999999',
      email: 'fulano-e2e@oficina.com',
      address: 'Endereço Teste',
    };

    const app = createApp();
    const response = await request(app)
      .post('/clientes')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: 'Fulano e2e',
      phone: '61999999999',
    });
  });

  it('lista clientes para administradores', async () => {
    const { prisma } = await setupE2ESuite();
    await createClientFixture(prisma);

    const token = createAdminToken();
    const app = createApp();
    const response = await request(app)
      .get('/clientes')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
  });
});
