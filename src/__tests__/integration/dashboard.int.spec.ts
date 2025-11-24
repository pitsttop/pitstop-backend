import request from 'supertest';

import {
  getCreateApp,
  setupIntegrationEnv,
  restoreIntegrationEnv,
  resetIntegrationMocks,
  createConsoleSpy,
  getDashboardMetricsMock,
} from './test-utils';

describe('Integração - Rotas de Dashboard', () => {
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

  it('retorna métricas para administradores', async () => {
    const metrics = { totalClients: 10 };
    getDashboardMetricsMock.mockResolvedValueOnce(metrics);

    const app = createApp();
    const response = await request(app)
      .get('/dashboard')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(metrics);
    expect(getDashboardMetricsMock).toHaveBeenCalledTimes(1);
  });

  it('bloqueia acesso ao dashboard para clientes', async () => {
    const app = createApp();
    const response = await request(app)
      .get('/dashboard')
      .set('Authorization', 'Bearer client-token');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Acesso negado: permissão insuficiente.' });
    expect(getDashboardMetricsMock).not.toHaveBeenCalled();
  });
});
