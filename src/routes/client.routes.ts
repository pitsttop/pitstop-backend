import { Router, Request, Response } from 'express';
import { listClients, createClient, findClientById , updateClient, deleteClient} from '../services/client.services';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const clientes = await listClients();
    res.json(clientes);
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    res.status(500).json({ error: 'Não foi possível buscar os clientes.' });
  }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cliente = await findClientById(id);

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    res.json(cliente);
  } catch (error) {
    console.error("Erro ao buscar cliente por ID:", error);
    res.status(500).json({ error: 'Não foi possível buscar o cliente.' });
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const novoClienteData = req.body;
    const cliente = await createClient(novoClienteData);
    res.status(201).json(cliente);
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    res.status(500).json({ error: 'Não foi possível criar o cliente.' });
  }
});

router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const clientData = req.body;

    const clienteAtualizado = await updateClient(id, clientData);
    res.json(clienteAtualizado);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }
    console.error("Erro ao atualizar cliente:", error);
    res.status(500).json({ error: 'Não foi possível atualizar o cliente.' });
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteClient(id);
    res.status(204).send(); 
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }
    console.error("Erro ao deletar cliente:", error);
    res.status(500).json({ error: 'Não foi possível deletar o cliente.' });
  }
});

export default router;