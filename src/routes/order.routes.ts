// src/routes/order.routes.ts
import { Router, Request, Response } from 'express';
import { authorize } from '../middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import * as orderService from '../services/order.services';

const router = Router();

// Protege todas as rotas de Ordens de Serviço (acessível por Admin e Cliente)
router.use(authorize([UserRole.ADMIN, UserRole.CLIENT]));

// Criar uma nova Ordem de Serviço
router.post('/', async (req: Request, res: Response) => {
  try {
    const order = await orderService.createOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Não foi possível criar a ordem de serviço.' });
  }
});

// Listar Ordens de Serviço (com filtros)
router.get('/', async (req: Request, res: Response) => {
  try {
    const orders = await orderService.listOrders(req.query);
    res.json(orders);
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Não foi possível listar as ordens de serviço.' });
  }
});

// Buscar uma Ordem de Serviço por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await orderService.findOrderById(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ error: 'Ordem de serviço não encontrada.' });
    }
    res.json(order);
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Não foi possível buscar a ordem de serviço.' });
  }
});

// Atualizar o status de uma Ordem de Serviço
router.patch(
  '/:id/status',
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const order = await orderService.updateOrderStatus(req.params.id, status);
      res.json(order);
    } catch (error) {
      res
        .status(500)
        .json({ error: 'Não foi possível atualizar o status da ordem.' });
    }
  },
);

export default router;
