import request from 'supertest';

import {
  setupE2ESuite,
  teardownE2ESuite,
  cleanDatabase,
  createAdminToken,
  createClient as createClientFixture,
  createVehicle as createVehicleFixture,
  createPart as createPartFixture,
  createService as createServiceFixture,
} from './test-utils';

describe('E2E - Ordens', () => {
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

  it('cria ordem e permite consulta por ID', async () => {
    const { prisma } = await setupE2ESuite();
    const client = await createClientFixture(prisma);
    const vehicle = await createVehicleFixture(prisma, client.id);

    const token = createAdminToken();
    const app = createApp();

    const createResponse = await request(app)
      .post('/ordens')
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'Revisão completa',
        clientId: client.id,
        vehicleId: vehicle.id,
      });

    expect(createResponse.status).toBe(201);

    const orderId = createResponse.body.id;

    const fetchResponse = await request(app)
      .get(`/ordens/${orderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(fetchResponse.status).toBe(200);
    expect(fetchResponse.body).toMatchObject({ description: 'Revisão completa', clientId: client.id });
  });

  it('adiciona peça e serviço em uma ordem existente', async () => {
    const { prisma } = await setupE2ESuite();
    const client = await createClientFixture(prisma);
    const vehicle = await createVehicleFixture(prisma, client.id);
    const part = await createPartFixture(prisma);
    const service = await createServiceFixture(prisma);

    const order = await prisma.order.create({
      data: {
        description: 'Alinhamento e troca de peças',
        clientId: client.id,
        vehicleId: vehicle.id,
      },
    });

    const token = createAdminToken();
    const app = createApp();

    const addPartResponse = await request(app)
      .post(`/ordens/${order.id}/pecas`)
      .set('Authorization', `Bearer ${token}`)
      .send({ partId: part.id, quantity: 2 });

    expect(addPartResponse.status).toBe(201);
    expect(addPartResponse.body).toMatchObject({ orderId: order.id, partId: part.id });

    const addServiceResponse = await request(app)
      .post(`/ordens/${order.id}/servicos`)
      .set('Authorization', `Bearer ${token}`)
      .send({ serviceId: service.id });

    expect(addServiceResponse.status).toBe(201);
    expect(addServiceResponse.body).toMatchObject({ orderId: order.id, serviceId: service.id });
  });
});
