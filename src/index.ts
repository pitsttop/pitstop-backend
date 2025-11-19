import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import express from 'express';

// --- 1. IMPORTE O "SEGURANÇA" E OS "CARGOS" ---
import { authorize } from './middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

// Importação das suas rotas (como você já tinha)
import clientRoutes from './routes/client.routes';
import vehicleRoutes from './routes/vehicle.routes';
import orderRoutes from './routes/order.routes';
import partRoutes from './routes/part.routes';
import serviceRoutes from './routes/service.routes';
import dashboardRoutes from './routes/dashboard.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  }),
);

app.use(morgan('dev'));
app.use(express.json());

// --- 2. APLIQUE O "SEGURANÇA" NAS ROTAS ---

// A rota raiz (/) não é protegida
app.get('/', (req, res) => {
  res.send('API da Oficina rodando!');
});

// Rota simples para o frontend obter dados do usuário autenticado
app.get('/me', authorize([UserRole.ADMIN, UserRole.CLIENT]), (req, res) => {
  // req.user é definido pelo middleware de autorização
  const authUser = (req as any).user;
  if (!authUser)
    return res.status(401).json({ error: 'Usuário não autenticado.' });

  res.json(authUser);
});

// Rotas protegidas:
// O middleware 'authorize' é executado ANTES da rota ser acessada.

// Ex: Apenas ADMINS podem ver o dashboard
app.use('/dashboard', authorize([UserRole.ADMIN]), dashboardRoutes);

// Ex: Admins e Clientes podem ver clientes, veiculos e ordens
app.use(
  '/clientes',
  authorize([UserRole.ADMIN, UserRole.CLIENT]),
  clientRoutes,
);
app.use(
  '/veiculos',
  authorize([UserRole.ADMIN, UserRole.CLIENT]),
  vehicleRoutes,
);
app.use('/ordens', authorize([UserRole.ADMIN, UserRole.CLIENT]), orderRoutes);

// Ex: Apenas ADMINS podem gerenciar peças e serviços
app.use('/pecas', authorize([UserRole.ADMIN]), partRoutes);
app.use('/servicos', authorize([UserRole.ADMIN]), serviceRoutes);

app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
