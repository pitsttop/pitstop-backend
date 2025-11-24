import request from 'supertest';

import {
  getCreateApp,
  setupIntegrationEnv,
  restoreIntegrationEnv,
  resetIntegrationMocks,
  createConsoleSpy,
  listOrdersMock,
  findOrderByIdMock,
  createOrderMock,
  updateOrderStatusMock,
  addServiceToOrderMock,
  addPartToOrderMock,
  removePartFromOrderMock,
  prismaOrderUpdateMock,
  prismaOrderDeleteMock,
} from './test-utils';

describe('Integração - Rotas de Ordens', () => {
  let createApp: () => import('express').Express;
  let consoleLogSpy: jest.SpyInstance;

  beforeAll(async () => {
    setupIntegrationEnv();
    consoleLogSpy = createConsoleSpy();
    createApp = await getCreateApp();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    restoreIntegrationEnv();
  });

  beforeEach(() => {
    resetIntegrationMocks();
  });

  it('retorna 401 quando acessa ordens sem token', async () => {
    const app = createApp();
    const response = await request(app).get('/ordens');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Token não fornecido.' });
    expect(listOrdersMock).not.toHaveBeenCalled();
  });

  it('cria ordem quando autenticado', async () => {
    const order = { id: 'o1' };
    createOrderMock.mockResolvedValueOnce(order);

    const app = createApp();
    const response = await request(app)
      .post('/ordens')
      .set('Authorization', 'Bearer admin-token')
      .send({ description: 'Troca de óleo' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(order);
    expect(createOrderMock).toHaveBeenCalledWith({ description: 'Troca de óleo' });
  });

  it('retorna 400 quando criação de ordem falha', async () => {
    createOrderMock.mockRejectedValueOnce(new Error('Cliente não encontrado'));

    const app = createApp();
    const response = await request(app)
      .post('/ordens')
      .set('Authorization', 'Bearer admin-token')
      .send({ description: 'Falha' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Cliente não encontrado' });
  });

  it('lista ordens quando usuário é admin', async () => {
    const orders = [{ id: 'o1' }];
    listOrdersMock.mockResolvedValueOnce(orders);

    const app = createApp();
    const response = await request(app)
      .get('/ordens?status=OPEN')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(orders);
    expect(listOrdersMock).toHaveBeenCalledWith({ status: 'OPEN' });
  });

  it('bloqueia listagem total para cliente', async () => {
    const app = createApp();
    const response = await request(app)
      .get('/ordens')
      .set('Authorization', 'Bearer client-token');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Acesso negado. A listagem total é restrita.' });
    expect(listOrdersMock).not.toHaveBeenCalled();
  });

  it('retorna ordem por ID', async () => {
    const order = { id: 'o1' };
    findOrderByIdMock.mockResolvedValueOnce(order);

    const app = createApp();
    const response = await request(app)
      .get('/ordens/o1')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(order);
    expect(findOrderByIdMock).toHaveBeenCalledWith('o1');
  });

  it('retorna 404 ao buscar ordem inexistente', async () => {
    findOrderByIdMock.mockResolvedValueOnce(null);

    const app = createApp();
    const response = await request(app)
      .get('/ordens/inexistente')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Ordem de serviço não encontrada.' });
  });

  it('atualiza status da ordem', async () => {
    const updated = { id: 'o1', status: 'FINISHED' };
    updateOrderStatusMock.mockResolvedValueOnce(updated);

    const app = createApp();
    const response = await request(app)
      .patch('/ordens/o1/status')
      .set('Authorization', 'Bearer admin-token')
      .send({ status: 'FINISHED' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(updated);
    expect(updateOrderStatusMock).toHaveBeenCalledWith('o1', {
      status: 'FINISHED',
      totalValue: undefined,
      endDate: undefined,
    });
  });

  it('retorna 404 ao atualizar status de ordem inexistente', async () => {
    updateOrderStatusMock.mockRejectedValueOnce({ code: 'P2025' });

    const app = createApp();
    const response = await request(app)
      .patch('/ordens/o1/status')
      .set('Authorization', 'Bearer admin-token')
      .send({ status: 'FINISHED' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Ordem de serviço não encontrada.' });
  });

  it('adiciona peça à ordem', async () => {
    const created = { id: 'usage-1' };
    addPartToOrderMock.mockResolvedValueOnce(created);

    const app = createApp();
    const response = await request(app)
      .post('/ordens/o1/pecas')
      .set('Authorization', 'Bearer admin-token')
      .send({ partId: 'p1', quantity: 2 });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(created);
    expect(addPartToOrderMock).toHaveBeenCalledWith('o1', 'p1', 2);
  });

  it('adiciona serviço à ordem', async () => {
    const created = { id: 'svc-1' };
    addServiceToOrderMock.mockResolvedValueOnce(created);

    const app = createApp();
    const response = await request(app)
      .post('/ordens/o1/servicos')
      .set('Authorization', 'Bearer admin-token')
      .send({ serviceId: 's1' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(created);
    expect(addServiceToOrderMock).toHaveBeenCalledWith('o1', 's1');
  });

  it('atualiza ordem via Prisma', async () => {
    const updated = { id: 'o1', description: 'Atualizada' };
    prismaOrderUpdateMock.mockResolvedValueOnce(updated);

    const app = createApp();
    const response = await request(app)
      .put('/ordens/o1')
      .set('Authorization', 'Bearer admin-token')
      .send({
        clientId: 'cli-1',
        vehicleId: 'veh-1',
        description: 'Atualizada',
        status: 'OPEN',
        startDate: '2025-01-01',
        endDate: '2025-01-10',
        totalValue: 500,
        observations: 'Obs',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(updated);
    expect(prismaOrderUpdateMock).toHaveBeenCalledWith({
      where: { id: 'o1' },
      data: expect.objectContaining({
        clientId: 'cli-1',
        vehicleId: 'veh-1',
        description: 'Atualizada',
        status: 'OPEN',
        observations: 'Obs',
        totalValue: 500,
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      }),
    });
  });

  it('remove ordem via Prisma', async () => {
    prismaOrderDeleteMock.mockResolvedValueOnce(undefined);

    const app = createApp();
    const response = await request(app)
      .delete('/ordens/o1')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(204);
    expect(prismaOrderDeleteMock).toHaveBeenCalledWith({ where: { id: 'o1' } });
  });

  it('retorna 404 ao remover ordem inexistente', async () => {
    prismaOrderDeleteMock.mockRejectedValueOnce({ code: 'P2025' });

    const app = createApp();
    const response = await request(app)
      .delete('/ordens/inexistente')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Ordem de serviço não encontrada.' });
  });

  it('remove peça vinculada à ordem', async () => {
    removePartFromOrderMock.mockResolvedValueOnce(undefined);

    const app = createApp();
    const response = await request(app)
      .delete('/ordens/o1/pecas/usage-1')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(204);
    expect(removePartFromOrderMock).toHaveBeenCalledWith('usage-1');
  });
});
