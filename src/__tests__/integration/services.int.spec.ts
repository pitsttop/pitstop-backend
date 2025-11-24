import request from 'supertest';

import {
  getCreateApp,
  setupIntegrationEnv,
  restoreIntegrationEnv,
  resetIntegrationMocks,
  createConsoleSpy,
  prismaServiceFindManyMock,
  prismaServiceCreateMock,
  prismaServiceUpdateMock,
  prismaServiceDeleteMock,
} from './test-utils';

describe('Integração - Rotas de Serviços', () => {
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

  it('lista serviços publicamente', async () => {
    const services = [
      { id: 's1', name: 'Revisão', price: 200 },
      { id: 's2', name: 'Alinhamento', price: 150 },
    ];
    prismaServiceFindManyMock.mockResolvedValueOnce(services);

    const app = createApp();
    const response = await request(app).get('/servicos');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(services);
    expect(prismaServiceFindManyMock).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
    });
  });

  it('cria serviço apenas para admin', async () => {
    const payload = {
      name: 'Balanceamento',
      description: 'Serviço',
      price: 180,
    };
    const created = { id: 's3', ...payload };
    prismaServiceCreateMock.mockResolvedValueOnce(created);

    const app = createApp();
    const response = await request(app)
      .post('/servicos')
      .set('Authorization', 'Bearer admin-token')
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(created);
    expect(prismaServiceCreateMock).toHaveBeenCalledWith({ data: payload });
  });

  it('bloqueia criação de serviço para cliente', async () => {
    const app = createApp();
    const response = await request(app)
      .post('/servicos')
      .set('Authorization', 'Bearer client-token')
      .send({ name: 'Item', price: 50 });

    expect(response.status).toBe(403);
    expect(prismaServiceCreateMock).not.toHaveBeenCalled();
  });

  it('atualiza serviço convertendo preço para número', async () => {
    const updated = { id: 's1', name: 'Revisão', price: 50 };
    prismaServiceUpdateMock.mockResolvedValueOnce(updated);

    const app = createApp();
    const response = await request(app)
      .put('/servicos/s1')
      .set('Authorization', 'Bearer admin-token')
      .send({ name: 'Revisão', price: '50' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(updated);
    expect(prismaServiceUpdateMock).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { name: 'Revisão', price: 50 },
    });
  });

  it('remove serviço com sucesso', async () => {
    prismaServiceDeleteMock.mockResolvedValueOnce(undefined);

    const app = createApp();
    const response = await request(app)
      .delete('/servicos/s1')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(204);
    expect(prismaServiceDeleteMock).toHaveBeenCalledWith({
      where: { id: 's1' },
    });
  });

  it('retorna 400 ao remover serviço em uso', async () => {
    prismaServiceDeleteMock.mockRejectedValueOnce({ code: 'P2003' });

    const app = createApp();
    const response = await request(app)
      .delete('/servicos/s2')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error:
        'Não é possível excluir este serviço pois ele já foi utilizado em Ordens de Serviço.',
    });
  });

  it('retorna 404 ao remover serviço inexistente', async () => {
    prismaServiceDeleteMock.mockRejectedValueOnce({ code: 'P2025' });

    const app = createApp();
    const response = await request(app)
      .delete('/servicos/s3')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Serviço não encontrado.' });
  });
});
