import request from 'supertest';

import {
  getCreateApp,
  setupIntegrationEnv,
  restoreIntegrationEnv,
  resetIntegrationMocks,
  createConsoleSpy,
  listAllVehiclesMock,
  createVehicleMock,
  updateVehicleMock,
  deleteVehicleMock,
  findVehicleByIdMock,
} from './test-utils';

describe('Integração - Rotas de Veículos', () => {
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

  it('lista veículos para usuários autenticados', async () => {
    const vehicles = [{ id: 'v1', plate: 'ABC1234' }];
    listAllVehiclesMock.mockResolvedValueOnce(vehicles);

    const app = createApp();
    const response = await request(app)
      .get('/veiculos')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(vehicles);
    expect(listAllVehiclesMock).toHaveBeenCalledTimes(1);
  });

  it('cria veículo quando admin informa ownerId', async () => {
    const created = { id: 'v1' };
    createVehicleMock.mockResolvedValueOnce(created);

    const app = createApp();
    const response = await request(app)
      .post('/veiculos')
      .set('Authorization', 'Bearer admin-token')
      .send({ plate: 'ABC1234', model: 'Celta', brand: 'GM', year: '2024', ownerId: 'cli-1' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(created);
    expect(createVehicleMock).toHaveBeenCalledWith({
      plate: 'ABC1234',
      model: 'Celta',
      brand: 'GM',
      year: 2024,
      color: undefined,
      ownerId: 'cli-1',
    });
  });

  it('retorna 400 ao criar veículo sem ownerId', async () => {
    const app = createApp();
    const response = await request(app)
      .post('/veiculos')
      .set('Authorization', 'Bearer admin-token')
      .send({ plate: 'XYZ', model: 'Carro' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'O campo ownerId (ID do Cliente) é obrigatório.' });
    expect(createVehicleMock).not.toHaveBeenCalled();
  });

  it('retorna 409 ao criar veículo com placa duplicada', async () => {
    createVehicleMock.mockRejectedValueOnce({ code: 'P2002' });

    const app = createApp();
    const response = await request(app)
      .post('/veiculos')
      .set('Authorization', 'Bearer admin-token')
      .send({ plate: 'ABC1234', model: 'Celta', brand: 'GM', year: 2024, ownerId: 'cli-1' });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'Já existe um veículo com esta placa.' });
  });

  it('retorna 400 quando ownerId não existe', async () => {
    createVehicleMock.mockRejectedValueOnce({ code: 'P2003' });

    const app = createApp();
    const response = await request(app)
      .post('/veiculos')
      .set('Authorization', 'Bearer admin-token')
      .send({ plate: 'ABC1234', model: 'Celta', brand: 'GM', year: 2024, ownerId: 'cli-x' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'O ownerId informado não existe (Cliente não encontrado).' });
  });

  it('atualiza veículo com sucesso', async () => {
    const updated = { id: 'v1', model: 'Novo' };
    updateVehicleMock.mockResolvedValueOnce(updated);

    const app = createApp();
    const response = await request(app)
      .put('/veiculos/v1')
      .set('Authorization', 'Bearer admin-token')
      .send({ model: 'Novo' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(updated);
    expect(updateVehicleMock).toHaveBeenCalledWith('v1', { model: 'Novo' });
  });

  it('retorna 404 ao atualizar veículo inexistente', async () => {
    updateVehicleMock.mockRejectedValueOnce({ code: 'P2025' });

    const app = createApp();
    const response = await request(app)
      .put('/veiculos/sem-id')
      .set('Authorization', 'Bearer admin-token')
      .send({ model: 'Novo' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Veículo não encontrado.' });
  });

  it('remove veículo com sucesso', async () => {
    deleteVehicleMock.mockResolvedValueOnce(undefined);

    const app = createApp();
    const response = await request(app)
      .delete('/veiculos/v1')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(204);
    expect(deleteVehicleMock).toHaveBeenCalledWith('v1');
  });

  it('retorna 404 ao remover veículo inexistente', async () => {
    deleteVehicleMock.mockRejectedValueOnce({ code: 'P2025' });

    const app = createApp();
    const response = await request(app)
      .delete('/veiculos/nao-existe')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Veículo não encontrado.' });
  });

  it('retorna veículo por ID', async () => {
    const vehicle = { id: 'v1', plate: 'ABC1234' };
    findVehicleByIdMock.mockResolvedValueOnce(vehicle);

    const app = createApp();
    const response = await request(app)
      .get('/veiculos/v1')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(vehicle);
    expect(findVehicleByIdMock).toHaveBeenCalledWith('v1');
  });

  it('retorna 404 ao buscar veículo inexistente', async () => {
    findVehicleByIdMock.mockResolvedValueOnce(null);

    const app = createApp();
    const response = await request(app)
      .get('/veiculos/nao-existe')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Veículo não encontrado.' });
  });
});
