/* eslint-disable @typescript-eslint/no-explicit-any */

const useMock = jest.fn();
const getMock = jest.fn();
const listenMock = jest.fn(
	(port: unknown, host: unknown, callback?: () => void) => {
		if (callback) {
			callback();
		}
		return undefined;
	},
);
const expressJsonMock = jest.fn(() => 'json-middleware');

const mockApp = {
	use: useMock,
	get: getMock,
	listen: listenMock,
};

const expressMock = jest.fn(() => mockApp) as jest.Mock & {
	json: jest.Mock;
};
expressMock.json = expressJsonMock;

jest.mock('express', () => ({
	__esModule: true,
	default: expressMock,
}));

const corsMock = jest.fn(() => 'cors-middleware');
jest.mock('cors', () => ({
	__esModule: true,
	default: corsMock,
}));

const morganMock = jest.fn(() => 'morgan-middleware');
jest.mock('morgan', () => ({
	__esModule: true,
	default: morganMock,
}));

const dotenvConfigMock = jest.fn();
jest.mock('dotenv', () => ({
	__esModule: true,
	default: {
		config: dotenvConfigMock,
	},
}));

const clientRoutesMock = { route: 'client' };
const vehicleRoutesMock = { route: 'vehicle' };
const orderRoutesMock = { route: 'order' };
const partRoutesMock = { route: 'part' };
const serviceRoutesMock = { route: 'service' };
const dashboardRoutesMock = { route: 'dashboard' };

jest.mock('./routes/client.routes', () => ({
	__esModule: true,
	default: clientRoutesMock,
}));

jest.mock('./routes/vehicle.routes', () => ({
	__esModule: true,
	default: vehicleRoutesMock,
}));

jest.mock('./routes/order.routes', () => ({
	__esModule: true,
	default: orderRoutesMock,
}));

jest.mock('./routes/part.routes', () => ({
	__esModule: true,
	default: partRoutesMock,
}));

jest.mock('./routes/service.routes', () => ({
	__esModule: true,
	default: serviceRoutesMock,
}));

jest.mock('./routes/dashboard.routes', () => ({
	__esModule: true,
	default: dashboardRoutesMock,
}));

const authorizeMock = jest.fn((roles: unknown[]) => {
	const middleware = jest.fn();
	(middleware as any).roles = roles;
	return middleware;
});

jest.mock('./middlewares/auth.middleware', () => ({
	authorize: authorizeMock,
}));

const mockUserRole = {
	ADMIN: 'ADMIN',
	CLIENT: 'CLIENT',
} as const;

jest.mock('@prisma/client', () => ({
	UserRole: mockUserRole,
}));

const ORIGINAL_ENV = { ...process.env } as NodeJS.ProcessEnv;

describe('createApp', () => {
	let consoleLogSpy: jest.SpyInstance;

	const loadAppModule = () => {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		return require('./app') as { createApp: () => any };
	};

	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();
		process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
		process.env.PORT = '4000';
		process.env.FRONTEND_URL = 'http://frontend.example';
		process.env.JWT_SECRET = 'jwt-test-secret';
		consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
		process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
	});

	it('carrega as variáveis de ambiente e registra o segredo do JWT', () => {
		loadAppModule();

		expect(dotenvConfigMock).toHaveBeenCalledTimes(1);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			'🔐 SEGREDO QUE O BACKEND VÊ:',
			'jwt-test-secret',
		);
	});

	it('configura middlewares globais com CORS, morgan e JSON', () => {
		const { createApp } = loadAppModule();
		createApp();

		expect(corsMock).toHaveBeenCalledWith({ origin: 'http://frontend.example' });
		expect(useMock).toHaveBeenNthCalledWith(1, 'cors-middleware');

		expect(morganMock).toHaveBeenCalledWith('dev');
		expect(useMock).toHaveBeenNthCalledWith(2, 'morgan-middleware');

		expect(expressJsonMock).toHaveBeenCalledTimes(1);
		expect(useMock).toHaveBeenNthCalledWith(3, 'json-middleware');
	});

	it('usa URL padrão do frontend quando FRONTEND_URL não está definida', () => {
		delete process.env.FRONTEND_URL;

		const { createApp } = loadAppModule();
		createApp();

		expect(corsMock).toHaveBeenCalledWith({ origin: 'http://localhost:3000' });
	});

	it('registra rota raiz com resposta de saúde', () => {
		const { createApp } = loadAppModule();
		createApp();

		const rootCall = getMock.mock.calls.find((call) => call[0] === '/');
		expect(rootCall).toBeDefined();

		const rootHandler = rootCall?.[1] as (req: unknown, res: any) => void;
		const sendMock = jest.fn();
		rootHandler({}, { send: sendMock });

		expect(sendMock).toHaveBeenCalledWith('API da Oficina rodando!');
	});

	it('mesma função atende todas as rotas /me e valida autenticação', () => {
		const { createApp } = loadAppModule();
		createApp();

		const endpoints = ['/auth/me', '/users/me', '/clientes/me', '/me'];
		const handlers = endpoints.map((path) => {
			const call = getMock.mock.calls.find((entry) => entry[0] === path);
			expect(call).toBeDefined();
			return call?.[2];
		});

		const handleMeRoute = handlers[0] as (req: any, res: any) => any;
		handlers.forEach((handler) => expect(handler).toBe(handleMeRoute));

		const unauthJsonMock = jest.fn();
		const unauthResponse = {
			status: jest.fn().mockReturnValue({ json: unauthJsonMock }),
		};

		handleMeRoute({}, unauthResponse);

		expect(unauthResponse.status).toHaveBeenCalledWith(401);
		expect(unauthJsonMock).toHaveBeenCalledWith({ error: 'Usuário não autenticado.' });

		const authenticatedUser = { id: 'user-1' };
		const authResponse = { json: jest.fn() };

		handleMeRoute({ user: authenticatedUser }, authResponse);

		expect(authResponse.json).toHaveBeenCalledWith(authenticatedUser);
	});

	it('protege rotas /me com autorização de ADMIN ou CLIENT', () => {
		const { createApp } = loadAppModule();
		createApp();

		const expectedRoles = [mockUserRole.ADMIN, mockUserRole.CLIENT];

		expect(authorizeMock).toHaveBeenNthCalledWith(1, expectedRoles);
		expect(authorizeMock).toHaveBeenNthCalledWith(2, expectedRoles);
		expect(authorizeMock).toHaveBeenNthCalledWith(3, expectedRoles);
		expect(authorizeMock).toHaveBeenNthCalledWith(4, expectedRoles);

		const firstAuthorizeResult = authorizeMock.mock.results[0]?.value;
		const secondAuthorizeResult = authorizeMock.mock.results[1]?.value;
		const thirdAuthorizeResult = authorizeMock.mock.results[2]?.value;
		const fourthAuthorizeResult = authorizeMock.mock.results[3]?.value;

		expect(getMock.mock.calls.find((call) => call[0] === '/auth/me')?.[1]).toBe(
			firstAuthorizeResult,
		);
		expect(getMock.mock.calls.find((call) => call[0] === '/users/me')?.[1]).toBe(
			secondAuthorizeResult,
		);
		expect(getMock.mock.calls.find((call) => call[0] === '/clientes/me')?.[1]).toBe(
			thirdAuthorizeResult,
		);
		expect(getMock.mock.calls.find((call) => call[0] === '/me')?.[1]).toBe(
			fourthAuthorizeResult,
		);
	});

	it('protege rotas administrativas com authorize e registra seus módulos', () => {
		const { createApp } = loadAppModule();
		createApp();

		expect(authorizeMock).toHaveBeenNthCalledWith(5, [mockUserRole.ADMIN]);
		expect(authorizeMock).toHaveBeenNthCalledWith(6, [mockUserRole.ADMIN, mockUserRole.CLIENT]);
		expect(authorizeMock).toHaveBeenNthCalledWith(7, [mockUserRole.ADMIN, mockUserRole.CLIENT]);
		expect(authorizeMock).toHaveBeenNthCalledWith(8, [mockUserRole.ADMIN, mockUserRole.CLIENT]);

		const dashboardCall = useMock.mock.calls.find((call) => call[0] === '/dashboard');
		const clientesCall = useMock.mock.calls.find((call) => call[0] === '/clientes');
		const veiculosCall = useMock.mock.calls.find((call) => call[0] === '/veiculos');
		const ordensCall = useMock.mock.calls.find((call) => call[0] === '/ordens');

		expect(dashboardCall).toEqual([
			'/dashboard',
			authorizeMock.mock.results[4]?.value,
			dashboardRoutesMock,
		]);

		expect(clientesCall).toEqual([
			'/clientes',
			authorizeMock.mock.results[5]?.value,
			clientRoutesMock,
		]);

		expect(veiculosCall).toEqual([
			'/veiculos',
			authorizeMock.mock.results[6]?.value,
			vehicleRoutesMock,
		]);

		expect(ordensCall).toEqual([
			'/ordens',
			authorizeMock.mock.results[7]?.value,
			orderRoutesMock,
		]);

		const pecasCall = useMock.mock.calls.find((call) => call[0] === '/pecas');
		const servicosCall = useMock.mock.calls.find((call) => call[0] === '/servicos');

		expect(pecasCall).toEqual(['/pecas', partRoutesMock]);
		expect(servicosCall).toEqual(['/servicos', serviceRoutesMock]);
	});
});

describe('index entrypoint', () => {
	let consoleLogSpy: jest.SpyInstance;

	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();
		process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
		process.env.PORT = '4100';
		consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
		process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
	});

	it('cria a aplicação e inicia o servidor com a porta configurada', () => {
		const createAppStub = jest.fn(() => mockApp);
		jest.doMock('./app', () => ({ createApp: createAppStub }));

		// eslint-disable-next-line @typescript-eslint/no-var-requires
		require('./index');

		expect(createAppStub).toHaveBeenCalledTimes(1);
		expect(listenMock).toHaveBeenCalledWith('4100', '0.0.0.0', expect.any(Function));
		expect(consoleLogSpy).toHaveBeenLastCalledWith(
			'🚀 Servidor rodando em http://0.0.0.0:4100',
		);
	});

	it('usa a porta padrão 3001 quando PORT não está definida', () => {
		delete process.env.PORT;

		const createAppStub = jest.fn(() => mockApp);
		jest.doMock('./app', () => ({ createApp: createAppStub }));

		// eslint-disable-next-line @typescript-eslint/no-var-requires
		require('./index');

		expect(createAppStub).toHaveBeenCalledTimes(1);
		expect(listenMock).toHaveBeenCalledWith(3001, '0.0.0.0', expect.any(Function));
		expect(consoleLogSpy).toHaveBeenLastCalledWith(
			'🚀 Servidor rodando em http://0.0.0.0:3001',
		);
	});
});

