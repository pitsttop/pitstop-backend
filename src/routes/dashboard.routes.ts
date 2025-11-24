import { Router, Request, Response } from 'express';
import { authorize } from '../middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import * as dashboardService from '../services/dashboard.services';

const router = Router();

router.get(
  '/',
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const metrics = await dashboardService.getDashboardMetrics();
      res.json(metrics);
    } catch (err) {
      console.error('Erro ao obter métricas do dashboard:', err);
      res
        .status(500)
        .json({ error: 'Não foi possível obter métricas do dashboard.' });
    }
  },
);

export default router;
