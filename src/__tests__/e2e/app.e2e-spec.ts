import request from 'supertest';

import {
  setupE2ESuite,
  teardownE2ESuite,
  cleanDatabase,
  createAdminToken,
} from './test-utils';

describe('E2E - App & Auth', () => {
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

  it('responde em / com a mensagem da API', async () => {
    const app = createApp();

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toBe('API da Oficina rodando!');
  });

  it('retorna dados do usuário autenticado em /auth/me', async () => {
    const token = createAdminToken();
    const app = createApp();

    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ role: 'ADMIN' });
  });

  it('nega acesso quando não há token', async () => {
    const app = createApp();

    const response = await request(app).get('/auth/me');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Token não fornecido.' });
  });
});
