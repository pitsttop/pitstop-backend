import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import express, { Request, Response } from 'express';

import { authorize } from './middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

import clientRoutes from './routes/client.routes';
import vehicleRoutes from './routes/vehicle.routes';
import orderRoutes from './routes/order.routes';
import partRoutes from './routes/part.routes';
import serviceRoutes from './routes/service.routes';
import dashboardRoutes from './routes/dashboard.routes';

dotenv.config();
console.log('🔐 SEGREDO QUE O BACKEND VÊ:', process.env.JWT_SECRET);

type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    role: UserRole;
  };
};

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: [
        'http://localhost:3000',      
        'http://localhost:5173',      
        'https://pitstop-frontend.vercel.app', 
        'https://pitstop-frontend-dh5to3w0m-joao-lucas-araujo-siqueiras-projects.vercel.app'
      ],
      credentials: true, 
    }),
  );
  app.use(morgan('dev'));
  app.use(express.json());

  app.get('/', (_req: Request, res: Response) => {
    res.send('API da Oficina rodando!');
  });

  app.use('/pecas', partRoutes);
  app.use('/servicos', serviceRoutes);

  const handleMeRoute = (req: Request, res: Response) => {
    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser)
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    return res.json(authUser);
  };

  app.get(
    '/auth/me',
    authorize([UserRole.ADMIN, UserRole.CLIENT]),
    handleMeRoute,
  );
  app.get(
    '/users/me',
    authorize([UserRole.ADMIN, UserRole.CLIENT]),
    handleMeRoute,
  );
  app.get(
    '/clientes/me',
    authorize([UserRole.ADMIN, UserRole.CLIENT]),
    handleMeRoute,
  );
  app.get('/me', authorize([UserRole.ADMIN, UserRole.CLIENT]), handleMeRoute);

  app.use('/dashboard', authorize([UserRole.ADMIN]), dashboardRoutes);
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

  return app;
};
