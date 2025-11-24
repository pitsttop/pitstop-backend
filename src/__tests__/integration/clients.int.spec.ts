import request from 'supertest';

import {
  getCreateApp,
  setupIntegrationEnv,
  restoreIntegrationEnv,
  resetIntegrationMocks,
  createConsoleSpy,
  listClientsMock,
  createClientMock,
  findClientByIdMock,
  updateClientMock,
  deleteClientMock,
  findClientByUserIdMock,
  listVehiclesByClientMock,
  prismaClientFindUniqueMock,
  prismaOrderFindManyMock,
} from './test-utils';

describe('Integração - Rotas de Clientes', () => {
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

  it('permite que administradores listem clientes', async () => {
    const clients = [{ id: 'c1', name: 'Alice' }];
    listClientsMock.mockResolvedValueOnce(clients);

    const app = createApp();
    const response = await request(app)
      .get('/clientes')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(clients);
    expect(listClientsMock).toHaveBeenCalledWith(undefined);
  });

  it('honra query string ao listar clientes', async () => {
    const clients = [{ id: 'c2', name: 'Bob' }];
    listClientsMock.mockResolvedValueOnce(clients);

    const app = createApp();
    const response = await request(app)
      .get('/clientes?search=Bob')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(clients);
    expect(listClientsMock).toHaveBeenCalledWith('Bob');
  });

  it('bloqueia listagem de clientes para usuários cliente', async () => {
    const app = createApp();
    const response = await request(app)
      .get('/clientes')
      .set('Authorization', 'Bearer client-token');

    expect(response.status).toBe(403);
    expect(listClientsMock).not.toHaveBeenCalled();
  });

  it('cria cliente vinculado ao usuário autenticado', async () => {
    const payload = { name: 'Cliente Novo', phone: '123' };
    const created = { id: 'cli-1', ...payload };
    createClientMock.mockResolvedValueOnce(created);

    const app = createApp();
    const response = await request(app)
      .post('/clientes')
      .set('Authorization', 'Bearer client-token')
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(created);
    expect(createClientMock).toHaveBeenCalledWith(payload, 'client-user');
  });

  it('retorna 401 ao criar cliente sem token', async () => {
    const app = createApp();
    const response = await request(app).post('/clientes').send({ name: 'X' });

    expect(response.status).toBe(401);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it('retorna cliente por ID', async () => {
    const client = { id: 'cli-1', name: 'Ana' };
    findClientByIdMock.mockResolvedValueOnce(client);

    const app = createApp();
    const response = await request(app)
      .get('/clientes/cli-1')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(client);
    expect(findClientByIdMock).toHaveBeenCalledWith('cli-1');
  });

  it('retorna 404 ao buscar cliente inexistente', async () => {
    findClientByIdMock.mockResolvedValueOnce(null);

    const app = createApp();
    const response = await request(app)
      .get('/clientes/nao-existe')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Cliente não encontrado.' });
  });

  it('atualiza cliente com sucesso', async () => {
    const payload = { phone: '999' };
    const updated = { id: 'cli-1', name: 'Ana', phone: '999' };
    updateClientMock.mockResolvedValueOnce(updated);

    const app = createApp();
    const response = await request(app)
      .put('/clientes/cli-1')
      .set('Authorization', 'Bearer admin-token')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(updated);
    expect(updateClientMock).toHaveBeenCalledWith('cli-1', payload);
  });

  it('retorna 404 ao atualizar cliente inexistente', async () => {
    updateClientMock.mockRejectedValueOnce({ code: 'P2025' });

    const app = createApp();
    const response = await request(app)
      .put('/clientes/inexistente')
      .set('Authorization', 'Bearer admin-token')
      .send({ name: 'X' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Cliente não encontrado.' });
  });

  it('remove cliente com sucesso', async () => {
    deleteClientMock.mockResolvedValueOnce(undefined);

    const app = createApp();
    const response = await request(app)
      .delete('/clientes/cli-1')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(204);
    expect(deleteClientMock).toHaveBeenCalledWith('cli-1');
  });

  it('retorna 404 ao remover cliente inexistente', async () => {
    deleteClientMock.mockRejectedValueOnce({ code: 'P2025' });

    const app = createApp();
    const response = await request(app)
      .delete('/clientes/inexistente')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Cliente não encontrado.' });
  });

  it('lista veículos do próprio cliente autenticado', async () => {
    findClientByUserIdMock.mockResolvedValueOnce({ id: 'client-db' });
    const vehicles = [{ id: 'v1', plate: 'ABC1234' }];
    listVehiclesByClientMock.mockResolvedValueOnce(vehicles);

    const app = createApp();
    const response = await request(app)
      .get('/clientes/client-user/veiculos')
      .set('Authorization', 'Bearer client-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(vehicles);
    expect(findClientByUserIdMock).toHaveBeenCalledWith('client-user');
    expect(listVehiclesByClientMock).toHaveBeenCalledWith('client-db');
  });

  it('impede cliente de acessar veículos de outro usuário', async () => {
    const app = createApp();
    const response = await request(app)
      .get('/clientes/outro-usuario/veiculos')
      .set('Authorization', 'Bearer client-token');

    expect(response.status).toBe(403);
    expect(findClientByUserIdMock).not.toHaveBeenCalled();
  });

  it('lista ordens do cliente autenticado', async () => {
    prismaClientFindUniqueMock.mockResolvedValueOnce({ id: 'client-db' });
    const orders = [{ id: 'o1' }];
    prismaOrderFindManyMock.mockResolvedValueOnce(orders);

    const app = createApp();
    const response = await request(app)
      .get('/clientes/me/ordens')
      .set('Authorization', 'Bearer client-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(orders);
    expect(prismaClientFindUniqueMock).toHaveBeenCalledWith({
      where: { userId: 'client-user' },
      select: { id: true },
    });
    expect(prismaOrderFindManyMock).toHaveBeenCalledWith({
      where: { clientId: 'client-db' },
      orderBy: { startDate: 'desc' },
      include: {
        vehicle: { select: { model: true, plate: true } },
        servicesPerformed: { include: { service: { select: { name: true } } } },
      },
    });
  });

  it('retorna lista vazia quando o cliente não possui perfil vinculado', async () => {
    prismaClientFindUniqueMock.mockResolvedValueOnce(null);

    const app = createApp();
    const response = await request(app)
      .get('/clientes/me/ordens')
      .set('Authorization', 'Bearer client-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
    expect(prismaOrderFindManyMock).not.toHaveBeenCalled();
  });
});
