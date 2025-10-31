import { Router, Request, Response } from 'express';
import {
  listClients,
  createClient,
  findClientById,
  updateClient,
  deleteClient,
} from '../services/client.services';
import { authorize } from '../middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

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

router.post(
  '/',
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const novoClienteData = req.body;
      const cliente = await createClient(novoClienteData);
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
