import request from 'supertest';

import {
  getCreateApp,
  setupIntegrationEnv,
  restoreIntegrationEnv,
  resetIntegrationMocks,
  createConsoleSpy,
  listPartsMock,
  findPartByIdMock,
  createPartMock,
  updatePartMock,
  deletePartMock,
} from './test-utils';

describe('Integração - Rotas de Peças', () => {
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

  it('lista peças públicas', async () => {
    const parts = [
      { id: 'p1', name: 'Filtro de óleo', price: 100 },
      { id: 'p2', name: 'Pastilha de freio', price: 200 },
    ];
    listPartsMock.mockResolvedValueOnce(parts);

    const app = createApp();
    const response = await request(app).get('/pecas');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(parts);
    expect(listPartsMock).toHaveBeenCalledTimes(1);
  });

  it('retorna 404 quando a peça solicitada não existe', async () => {
    findPartByIdMock.mockResolvedValueOnce(null);

    const app = createApp();
    const response = await request(app).get('/pecas/desconhecida');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Peça não encontrada.' });
    expect(findPartByIdMock).toHaveBeenCalledWith('desconhecida');
  });

  it('cria peça quando o usuário é admin', async () => {
    const payload = { name: 'Filtro de ar', price: 150 };
    const created = { id: 'p3', ...payload };
    createPartMock.mockResolvedValueOnce(created);

    const app = createApp();
    const response = await request(app)
      .post('/pecas')
      .set('Authorization', 'Bearer admin-token')
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(created);
    expect(createPartMock).toHaveBeenCalledWith(payload);
  });

  it('bloqueia criação de peça para usuários não administradores', async () => {
    const app = createApp();
    const response = await request(app)
      .post('/pecas')
      .set('Authorization', 'Bearer client-token')
      .send({ name: 'Item', price: 50 });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: 'Acesso negado: permissão insuficiente.',
    });
    expect(createPartMock).not.toHaveBeenCalled();
  });

  it('atualiza peça com sucesso', async () => {
    const updated = { id: 'p1', name: 'Filtro atualizado' };
    updatePartMock.mockResolvedValueOnce(updated);

    const app = createApp();
    const response = await request(app)
      .put('/pecas/p1')
      .set('Authorization', 'Bearer admin-token')
      .send({ name: 'Filtro atualizado' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(updated);
    expect(updatePartMock).toHaveBeenCalledWith('p1', {
      name: 'Filtro atualizado',
    });
  });

  it('retorna 404 ao tentar atualizar peça inexistente', async () => {
    updatePartMock.mockRejectedValueOnce({ code: 'P2025' });

    const app = createApp();
    const response = await request(app)
      .put('/pecas/inexistente')
      .set('Authorization', 'Bearer admin-token')
      .send({ name: 'Filtro' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Peça não encontrada.' });
  });

  it('remove peça com sucesso', async () => {
    deletePartMock.mockResolvedValueOnce(undefined);

    const app = createApp();
    const response = await request(app)
      .delete('/pecas/p1')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(204);
    expect(deletePartMock).toHaveBeenCalledWith('p1');
  });

  it('retorna 400 ao remover peça em uso', async () => {
    deletePartMock.mockRejectedValueOnce({ code: 'P2003' });

    const app = createApp();
    const response = await request(app)
      .delete('/pecas/p2')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error:
        'Não é possível excluir esta peça pois ela é utilizada em Ordens de Serviço.',
    });
  });

  it('retorna 404 ao remover peça inexistente', async () => {
    deletePartMock.mockRejectedValueOnce({ code: 'P2025' });

    const app = createApp();
    const response = await request(app)
      .delete('/pecas/p3')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Peça não encontrada.' });
  });
});
