import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import express, { Request, Response } from 'express';

import { authorize } from './middlewares/auth.middleware';
import { UserRole, PrismaClient } from '@prisma/client';

import clientRoutes from './routes/client.routes';
import vehicleRoutes from './routes/vehicle.routes';
import orderRoutes from './routes/order.routes';
import partRoutes from './routes/part.routes';
import serviceRoutes from './routes/service.routes';
import dashboardRoutes from './routes/dashboard.routes';

// Instanciamos o cliente do banco de dados
const prisma = new PrismaClient();

dotenv.config();
console.log("🔐 SEGREDO QUE O BACKEND VÊ:", process.env.JWT_SECRET);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(morgan('dev'));
app.use(express.json());

// --- ROTAS PÚBLICAS ---

app.get('/', (req, res) => {
  res.send('API da Oficina rodando!');
});

// 2. MUDANÇA CRUCIAL:
// Movi essas rotas para cá e TIREI o 'authorize' daqui.
// Agora a Landing Page consegue ler os preços (GET), mas só Admin consegue criar (POST).
app.use('/pecas', partRoutes);
app.use('/servicos', serviceRoutes);


// --- ROTAS DE AUTH ---

const handleMeRoute = (req: Request, res: Response) => {
  const authUser = (req as any).user;
  if (!authUser) return res.status(401).json({ error: 'Usuário não autenticado.' });
  return res.json(authUser);
};

app.get('/auth/me', authorize([UserRole.ADMIN, UserRole.CLIENT]), handleMeRoute);
app.get('/users/me', authorize([UserRole.ADMIN, UserRole.CLIENT]), handleMeRoute);
app.get('/clientes/me', authorize([UserRole.ADMIN, UserRole.CLIENT]), handleMeRoute);
app.get('/me', authorize([UserRole.ADMIN, UserRole.CLIENT]), handleMeRoute);




// --- ROTAS PROTEGIDAS (Admin) ---

app.use('/dashboard', authorize([UserRole.ADMIN]), dashboardRoutes);
app.use('/clientes', authorize([UserRole.ADMIN, UserRole.CLIENT]), clientRoutes);
app.use('/veiculos', authorize([UserRole.ADMIN, UserRole.CLIENT]), vehicleRoutes);
app.use('/ordens', authorize([UserRole.ADMIN, UserRole.CLIENT]), orderRoutes);
// Removi /pecas e /servicos daqui de baixo porque já carregamos lá em cima.

app.listen(port as number, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando em http://0.0.0.0:${port}`);
});