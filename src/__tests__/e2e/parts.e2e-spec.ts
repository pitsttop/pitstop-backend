import request from 'supertest';

import {
  setupE2ESuite,
  teardownE2ESuite,
  cleanDatabase,
  createAdminToken,
  createPart as createPartFixture,
} from './test-utils';

describe('E2E - Peças', () => {
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

  it('lista peças cadastradas', async () => {
    const { prisma } = await setupE2ESuite();
    await createPartFixture(prisma);

    const app = createApp();
    const response = await request(app).get('/pecas');

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
  });

  it('cria nova peça quando usuário é admin', async () => {
    const token = createAdminToken();
    const app = createApp();

    const response = await request(app)
      .post('/pecas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Filtro de óleo E2E',
        description: 'Compatível com motores 1.0',
        price: 79.9,
        stock: 4,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ name: 'Filtro de óleo E2E', stock: 4 });

    const { prisma } = await setupE2ESuite();
    const created = await prisma.part.findUnique({ where: { id: response.body.id } });
    expect(created).not.toBeNull();
  });
});
