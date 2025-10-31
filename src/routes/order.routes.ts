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
  } catch {
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
  } catch {
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
  } catch {
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
    } catch {
      res
        .status(500)
        .json({ error: 'Não foi possível atualizar o status da ordem.' });
    }
  },
);

router.post(
  '/:id/pecas',
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { partId, quantity } = req.body; // O frontend enviará o ID da peça e a quantidade

      const updatedOrder = await orderService.addPartToOrder(
        id,
        partId,
        quantity,
      );
      res.status(201).json(updatedOrder);
    } catch {
      res
        .status(500)
        .json({ error: 'Não foi possível adicionar a peça à ordem.' });
    }
  },
);

// Rota para remover uma peça de uma OS (ex: DELETE /ordens/ID_DA_ORDEM/pecas/ID_DO_PARTUSAGE)
// Nota: O ID aqui é o da "linha" da nota fiscal (PartUsage), não o da Peça em si.
router.delete(
  '/:orderId/pecas/:partUsageId',
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { partUsageId } = req.params;
      await orderService.removePartFromOrder(partUsageId);
      res.status(204).send();
    } catch {
      res
        .status(500)
        .json({ error: 'Não foi possível remover a peça da ordem.' });
    }
  },
);

export default router;
