import { Router, Request, Response } from 'express';
import {
  listClients,
  createClient,
  findClientById,
  updateClient,
  deleteClient,
  findClientByUserId,
} from '../services/client.services';
import type { CreateClientInput } from '../services/client.services';
import { authorize } from '../middlewares/auth.middleware';
import { UserRole, PrismaClient } from '@prisma/client';
import * as vehicleService from '../services/vehicle.services';

const router = Router();
const prisma = new PrismaClient();

type AuthenticatedUser = {
  userId?: string;
  role: UserRole;
};

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

const getAuthenticatedUser = (req: Request): AuthenticatedUser | undefined => {
  return (req as AuthenticatedRequest).user;
};
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

router.get(
  '/:id/veiculos',
  authorize([UserRole.ADMIN, UserRole.CLIENT]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const authUser = getAuthenticatedUser(req);
      if (
        authUser &&
        authUser.role === UserRole.CLIENT &&
        authUser.userId !== id
      ) {
        return res.status(403).json({ error: 'Acesso negado.' });
      }

      const client = await findClientByUserId(id);

      if (!client) {
        return res
          .status(404)
          .json({ error: 'Perfil de cliente não encontrado.' });
      }

      const vehicles = await vehicleService.listVehiclesByClient(client.id);
      res.json(vehicles);
    } catch (_error) {
      console.error('Erro ao buscar veículos:', _error);
      res.status(500).json({ error: 'Erro interno.' });
    }
  },
);

router.get(
  '/me/ordens',
  authorize([UserRole.CLIENT]),
  async (req: Request, res: Response) => {
    try {
      const authUser = getAuthenticatedUser(req);
      const userId = authUser?.userId;

      if (!userId) {
        return res
          .status(401)
          .json({ error: 'Token sem identificador de usuário.' });
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
  },
);

router.post(
  '/',
  authorize([UserRole.ADMIN, UserRole.CLIENT]),
  async (req: Request, res: Response) => {
    try {
      const novoClienteData = req.body as CreateClientInput;

      const authUser = getAuthenticatedUser(req);

      if (!authUser?.userId) {
        return res.status(401).json({ error: 'Token inválido ou sem ID.' });
      }

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
