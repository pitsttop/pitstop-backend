import { Router, Request, Response } from 'express';
import { authorize } from '../middlewares/auth.middleware';
import { UserRole, Prisma } from '@prisma/client';
import * as orderService from '../services/order.services';
import { PrismaClient } from '@prisma/client'; 

// Instanciamos o cliente do banco de dados
const prisma = new PrismaClient();
const router = Router();

// Protege todas as rotas de Ordens de Serviço (acessível por Admin e Cliente)
router.use(authorize([UserRole.ADMIN, UserRole.CLIENT]));

// Criar uma nova Ordem de Serviço
router.post('/', async (req: Request, res: Response) => {
  try {
    const order = await orderService.createOrder(req.body); 
    res.status(201).json(order);
  } catch (error) {
    console.error('Erro ao criar ordem de serviço:', error);
    res.status(400).json({ error: (error as Error).message || 'Não foi possível criar a ordem de serviço.' });
  }
});

// Listar Ordens de Serviço (com filtros)
router.get('/', async (req: Request, res: Response) => {
  try {
    // A rota /ordens só deve ser acessada por ADMINs para listar todas as ordens
    const authUser = (req as any).user;
    if (authUser.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Acesso negado. A listagem total é restrita.' });
    }
    const orders = await orderService.listOrders(req.query);
    res.json(orders);
  } catch (error) {
    console.error('Erro ao listar ordens:', error);
    res.status(500).json({ error: 'Não foi possível listar as ordens de serviço.' });
  }
});


// Buscar uma Ordem de Serviço por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await orderService.findOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Ordem de serviço não encontrada.' });
    }
    res.json(order);
  } catch (error) {
    console.error('Erro ao buscar ordem por ID:', error);
    res.status(500).json({ error: 'Não foi possível buscar a ordem de serviço.' });
  }
});

// --- ROTA DE ATUALIZAÇÃO DE STATUS (PATCH) ---
router.patch(
  '/:id/status',
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { status, totalValue, endDate } = req.body;

      const order = await orderService.updateOrderStatus(req.params.id, {
        status,
        totalValue: totalValue !== undefined ? Number(totalValue) : undefined,
        endDate,
      });

      res.json(order);
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025') {
        return res.status(404).json({ error: 'Ordem de serviço não encontrada.' });
      }
      console.error('Erro ao atualizar status:', error);
      res.status(500).json({ error: 'Não foi possível atualizar o status da ordem.' });
    }
  },
);

// --- ROTA: Adicionar PEÇA à Ordem ---
router.post(
  '/:id/pecas',
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params; // ID da Ordem
      const { partId, quantity } = req.body; 

      const updatedOrder = await orderService.addPartToOrder(
        id,
        partId,
        quantity,
      );
      res.status(201).json(updatedOrder);
    } catch (error) {
      console.error('Erro ao adicionar peça à ordem:', error);
      res.status(500).json({ error: 'Não foi possível adicionar a peça à ordem.' });
    }
  },
);

// --- ROTA: Adicionar SERVIÇO à Ordem ---
router.post(
  '/:id/servicos',
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params; // ID da Ordem
      const { serviceId } = req.body; 

      const updatedOrder = await orderService.addServiceToOrder(
        id,
        serviceId,
      );
      res.status(201).json(updatedOrder);
    } catch (error) {
      console.error('Erro ao adicionar serviço à ordem:', error);
      res.status(500).json({ error: 'Não foi possível adicionar o serviço à ordem.' });
    }
  },
);

router.put('/:id', authorize([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { clientId, vehicleId, description, startDate, endDate, totalValue, observations, status } = req.body;

    const ordem = await prisma.order.update({
      where: { id },
      data: {
        clientId,
        vehicleId,
        description,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        totalValue: totalValue ? Number(totalValue) : 0,
        observations
      }
    });
    res.json(ordem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar ordem.' });
  }
});
router.delete('/:id', authorize([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Deleta a ordem no banco
    await prisma.order.delete({
      where: { id },
    });

    // Retorna 204 (No Content) indicando sucesso sem corpo de resposta
    res.status(204).send();
  } catch (error) {
    // Verifica se o erro é "Registro não encontrado" do Prisma (código P2025)
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Ordem de serviço não encontrada.' });
    }

    console.error('Erro ao excluir ordem:', error);
    // DICA: Se der erro de "Foreign Key constraint", significa que você precisa deletar
    // os itens (peças/serviços) associados antes, ou configurar o "Cascade Delete" no Prisma.
    res.status(500).json({ error: 'Não foi possível excluir a ordem de serviço.' });
  }
});

router.delete(
  '/:orderId/pecas/:partUsageId',
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { partUsageId } = req.params;
      await orderService.removePartFromOrder(partUsageId);
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao remover peça:', error);
      res.status(500).json({ error: 'Não foi possível remover a peça da ordem.' });
    }
  },
);

export default router;