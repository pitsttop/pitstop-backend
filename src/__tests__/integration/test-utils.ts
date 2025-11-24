import type { Express } from 'express';

export const listPartsMock = jest.fn();
export const findPartByIdMock = jest.fn();
export const createPartMock = jest.fn();
export const updatePartMock = jest.fn();
export const deletePartMock = jest.fn();

export const listClientsMock = jest.fn();
export const createClientMock = jest.fn();
export const findClientByIdMock = jest.fn();
export const updateClientMock = jest.fn();
export const deleteClientMock = jest.fn();
export const findClientByUserIdMock = jest.fn();

export const listAllVehiclesMock = jest.fn();
export const listVehiclesByClientMock = jest.fn();
export const createVehicleMock = jest.fn();
export const updateVehicleMock = jest.fn();
export const deleteVehicleMock = jest.fn();
export const findVehicleByIdMock = jest.fn();

export const listOrdersMock = jest.fn();
export const findOrderByIdMock = jest.fn();
export const createOrderMock = jest.fn();
export const updateOrderStatusMock = jest.fn();
export const listOrdersByClientMock = jest.fn();
export const addServiceToOrderMock = jest.fn();
export const removeServiceFromOrderMock = jest.fn();
export const addPartToOrderMock = jest.fn();
export const removePartFromOrderMock = jest.fn();

export const getDashboardMetricsMock = jest.fn();

export const verifyMock = jest.fn();

export const prismaServiceFindManyMock = jest.fn();
export const prismaServiceCreateMock = jest.fn();
export const prismaServiceUpdateMock = jest.fn();
export const prismaServiceDeleteMock = jest.fn();

export const prismaClientFindUniqueMock = jest.fn();
export const prismaClientFindFirstMock = jest.fn();
export const prismaOrderFindManyMock = jest.fn();
export const prismaOrderUpdateMock = jest.fn();
export const prismaOrderDeleteMock = jest.fn();

const prismaInstance = {
  service: {
    findMany: prismaServiceFindManyMock,
    create: prismaServiceCreateMock,
    update: prismaServiceUpdateMock,
    delete: prismaServiceDeleteMock,
  },
  client: {
    findUnique: prismaClientFindUniqueMock,
    findFirst: prismaClientFindFirstMock,
  },
  order: {
    findMany: prismaOrderFindManyMock,
    update: prismaOrderUpdateMock,
    delete: prismaOrderDeleteMock,
  },
};

export const PrismaClientMock = jest.fn(() => prismaInstance);

jest.mock('@prisma/client', () => ({
  PrismaClient: PrismaClientMock,
  UserRole: { ADMIN: 'ADMIN', CLIENT: 'CLIENT' },
  OrderStatus: {
    OPEN: 'OPEN',
    IN_PROGRESS: 'IN_PROGRESS',
    FINISHED: 'FINISHED',
    CANCELED: 'CANCELED',
  },
  Prisma: {},
}));

jest.mock('../../services/part.services', () => ({
  __esModule: true,
  listParts: listPartsMock,
  findPartById: findPartByIdMock,
  createPart: createPartMock,
  updatePart: updatePartMock,
  deletePart: deletePartMock,
}));

jest.mock('../../services/client.services', () => ({
  __esModule: true,
  listClients: listClientsMock,
  createClient: createClientMock,
  findClientById: findClientByIdMock,
  updateClient: updateClientMock,
  deleteClient: deleteClientMock,
  findClientByUserId: findClientByUserIdMock,
}));

jest.mock('../../services/vehicle.services', () => ({
  __esModule: true,
  listVehiclesByClient: listVehiclesByClientMock,
  createVehicle: createVehicleMock,
  updateVehicle: updateVehicleMock,
  deleteVehicle: deleteVehicleMock,
  findVehicleById: findVehicleByIdMock,
  listAllVehicles: listAllVehiclesMock,
}));

jest.mock('../../services/order.services', () => ({
  __esModule: true,
  listOrders: listOrdersMock,
  findOrderById: findOrderByIdMock,
  createOrder: createOrderMock,
  updateOrderStatus: updateOrderStatusMock,
  listOrdersByClient: listOrdersByClientMock,
  addServiceToOrder: addServiceToOrderMock,
  removeServiceFromOrder: removeServiceFromOrderMock,
  addPartToOrder: addPartToOrderMock,
  removePartFromOrder: removePartFromOrderMock,
}));

jest.mock('../../services/dashboard.services', () => ({
  __esModule: true,
  getDashboardMetrics: getDashboardMetricsMock,
}));

jest.mock('jsonwebtoken', () => ({
  verify: (...args: [string, string]) => verifyMock(...args),
}));

const ORIGINAL_ENV = { ...process.env } as NodeJS.ProcessEnv;

export const setupIntegrationEnv = () => {
  process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
  process.env.JWT_SECRET = 'integration-secret';
  process.env.FRONTEND_URL = 'http://frontend.example';
};

export const restoreIntegrationEnv = () => {
  process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
};

export const getCreateApp = async (): Promise<() => Express> => {
  // @ts-ignore ts-jest resolve módulos sem extensão durante os testes
  const appModule = await import('../../app');
  return appModule.createApp as () => Express;
};

export const createConsoleSpy = () =>
  jest.spyOn(console, 'log').mockImplementation(() => undefined);

const ALL_MOCKS = [
  listPartsMock,
  findPartByIdMock,
  createPartMock,
  updatePartMock,
  deletePartMock,
  listClientsMock,
  createClientMock,
  findClientByIdMock,
  updateClientMock,
  deleteClientMock,
  findClientByUserIdMock,
  listAllVehiclesMock,
  listVehiclesByClientMock,
  createVehicleMock,
  updateVehicleMock,
  deleteVehicleMock,
  findVehicleByIdMock,
  listOrdersMock,
  findOrderByIdMock,
  createOrderMock,
  updateOrderStatusMock,
  listOrdersByClientMock,
  addServiceToOrderMock,
  removeServiceFromOrderMock,
  addPartToOrderMock,
  removePartFromOrderMock,
  getDashboardMetricsMock,
  prismaServiceFindManyMock,
  prismaServiceCreateMock,
  prismaServiceUpdateMock,
  prismaServiceDeleteMock,
  prismaClientFindUniqueMock,
  prismaClientFindFirstMock,
  prismaOrderFindManyMock,
  prismaOrderUpdateMock,
  prismaOrderDeleteMock,
  PrismaClientMock,
  verifyMock,
];

export const resetIntegrationMocks = () => {
  ALL_MOCKS.forEach((mock) => mock.mockReset());

  verifyMock.mockImplementation((token: string) => {
    if (token === 'admin-token') {
      return { userId: 'admin-user', role: 'ADMIN' };
    }
    if (token === 'client-token') {
      return { userId: 'client-user', role: 'CLIENT' };
    }
    throw new Error('invalid token');
  });
};
