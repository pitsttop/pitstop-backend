import request from 'supertest';

import {
  getCreateApp,
  setupIntegrationEnv,
  restoreIntegrationEnv,
  resetIntegrationMocks,
  createConsoleSpy,
  verifyMock,
} from './test-utils';

describe('Integração - Health & Auth', () => {
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

  it('responde com a mensagem de status na rota raiz', async () => {
    const app = createApp();

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toBe('API da Oficina rodando!');
  });

  it('retorna dados do usuário autenticado em /auth/me', async () => {
    const app = createApp();
    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer client-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ userId: 'client-user', role: 'CLIENT' });
  });

  it('retorna 401 quando a rota /auth/me é acessada sem token', async () => {
    const app = createApp();
    const response = await request(app).get('/auth/me');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Token não fornecido.' });
    expect(verifyMock).not.toHaveBeenCalled();
  });
});
