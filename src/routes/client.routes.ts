import { Router, Request, Response } from 'express';
import {
  listClients,
  createClient,
  findClientById,
  updateClient,
  deleteClient,
  findClientByUserId, // <--- IMPORTANTE: Importar essa função nova
} from '../services/client.services';
import { authorize } from '../middlewares/auth.middleware';
import { UserRole, PrismaClient } from '@prisma/client';
import * as vehicleService from '../services/vehicle.services';
import * as orderService from '../services/order.services';

const router = Router();
const prisma = new PrismaClient();
// Rota para listar todos os clientes (Apenas Admin)
router.get(
  '/',
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const searchTerm = req.query.search as string | undefined;
      const clientes = await listClients(searchTerm);
      res.json(clientes);
    } catch {
      res.status(500).json({ error: 'Não foi possível buscar os clientes.' });
    }
  },
);

// Rota para buscar um cliente específico pelo ID (do Cliente)
router.get(
  '/:id',
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const cliente = await findClientById(id);

      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado.' });
      }

      res.json(cliente);
    } catch (_error) {
      console.error('Erro ao buscar cliente por ID:', _error);
      res.status(500).json({ error: 'Não foi possível buscar o cliente.' });
    }
  },
);

// --- ROTA CORRIGIDA: Listar veículos (Usa o ID do Usuário na URL) ---
router.get(
  '/:id/veiculos',
  authorize([UserRole.ADMIN, UserRole.CLIENT]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params; // Aqui 'id' é o userId (do login)

      // Validação de segurança
      const authUser = (req as any).user as { userId: string; role: UserRole } | undefined;
      if (authUser && authUser.role === UserRole.CLIENT && authUser.userId !== id) {
        return res.status(403).json({ error: 'Acesso negado.' });
      }

      // 1. Traduz o ID do Usuário para o ID do Cliente
      const client = await findClientByUserId(id);

      if (!client) {
        return res.status(404).json({ error: 'Perfil de cliente não encontrado.' });
      }

      // 2. Busca os veículos usando o ID REAL do Cliente
      const vehicles = await vehicleService.listVehiclesByClient(client.id);
      res.json(vehicles);
    } catch (_error) {
      console.error('Erro ao buscar veículos:', _error);
      res.status(500).json({ error: 'Erro interno.' });
    }
  },
);

// --- ROTA CORRIGIDA: Listar ordens (Usa o ID do Usuário na URL) ---
router.get('/me/ordens', authorize([UserRole.CLIENT]), async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const userId = authUser?.userId ?? authUser?.id;

if (!userId) {
  return res.status(401).json({ error: 'Token sem identificador de usuário.' });
}

const clientRecord = await prisma.client.findUnique({
  where: { userId },
  select: { id: true },
});

    if (!clientRecord) {
      console.error(`Cliente não encontrado para userId: ${userId}`);
      return res.json([]);
    }

    const orders = await prisma.order.findMany({
      where: { clientId: clientRecord.id },
      orderBy: { startDate: 'desc' },
      include: {
        vehicle: { select: { model: true, plate: true } },
        servicesPerformed: {
          include: { service: { select: { name: true } } },
        },
      },
    });

    res.json(orders);
  } catch (error) {
    console.error('Erro ao buscar ordens do cliente:', error);
    res
      .status(500)
      .json({ error: 'Não foi possível buscar os serviços recentes.' });
  }
});

// --- ROTA CORRIGIDA: Criar Cliente (Recebe o userId do token) ---
// Mudei para permitir CLIENT também, pois é o próprio usuário se cadastrando
router.post(
  '/',
  authorize([UserRole.ADMIN, UserRole.CLIENT]), 
  async (req: Request, res: Response) => {
    try {
      const novoClienteData = req.body;
      
      // Pega o ID do usuário que está logado (do Token)
      const authUser = (req as any).user;

      if (!authUser || !authUser.userId) {
        return res.status(401).json({ error: 'Token inválido ou sem ID.' });
      }

      // Passa os dados E o userId para o serviço
      const cliente = await createClient(novoClienteData, authUser.userId);
      
      res.status(201).json(cliente);
    } catch (_error) {
      console.error('Erro ao criar cliente:', _error);
      res.status(500).json({ error: 'Não foi possível criar o cliente.' });
    }
  },
);

router.put(
  '/:id',
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const clientData = req.body;

      const clienteAtualizado = await updateClient(id, clientData);
      res.json(clienteAtualizado);
    } catch (_error) {
      if ((_error as { code?: string }).code === 'P2025') {
        return res.status(404).json({ error: 'Cliente não encontrado.' });
      }
      console.error('Erro ao atualizar cliente:', _error);
      res.status(500).json({ error: 'Não foi possível atualizar o cliente.' });
    }
  },
);

router.delete(
  '/:id',
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await deleteClient(id);
      res.status(204).send();
    } catch (_error) {
      if ((_error as { code?: string }).code === 'P2025') {
        return res.status(404).json({ error: 'Cliente não encontrado.' });
      }
      console.error('Erro ao deletar cliente:', _error);
      res.status(500).json({ error: 'Não foi possível deletar o cliente.' });
    }
  },
);

export default router;