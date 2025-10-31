import { Router, Request, Response } from 'express';
import { authorize } from '../middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import * as serviceService from '../services/service.services';

const router = Router();

// Apenas Admins podem gerenciar o catálogo de serviços.

router.use(authorize([UserRole.ADMIN]));

// Rota para criar um novo serviço (POST /servicos)
router.post('/', async (req: Request, res: Response) => {
  try {
    const service = await serviceService.createService(req.body);
    res.status(201).json(service);
  } catch (_error) {
    console.error('Erro ao criar o serviço:', _error);
    res.status(500).json({ error: 'Não foi possível criar o serviço.' });
  }
});

// Rota para listar todos os serviços (GET /servicos)
router.get('/', async (req: Request, res: Response) => {
  try {
    const services = await serviceService.listServices();
    res.json(services);
  } catch (_error) {
    console.error('Erro ao listar os serviços:', _error);
    res.status(500).json({ error: 'Não foi possível listar os serviços.' });
  }
});

// Rota para buscar um serviço por ID (GET /servicos/:id)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const service = await serviceService.findServiceById(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado.' });
    }
    res.json(service);
  } catch (_error) {
    console.error('Erro ao buscar o serviço:', _error);
    res.status(500).json({ error: 'Não foi possível buscar o serviço.' });
  }
});

// Rota para atualizar um serviço (PUT /servicos/:id)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const service = await serviceService.updateService(req.params.id, req.body);
    res.json(service);
  } catch (_error) {
    if ((_error as { code?: string }).code === 'P2025') {
      return res.status(404).json({ error: 'Serviço não encontrado.' });
    }
    console.error('Erro ao atualizar o serviço:', _error);
    res.status(500).json({ error: 'Não foi possível atualizar o serviço.' });
  }
});

// Rota para deletar um serviço (DELETE /servicos/:id)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await serviceService.deleteService(req.params.id);
    res.status(204).send();
  } catch (_error) {
    if ((_error as { code?: string }).code === 'P2025') {
      return res.status(404).json({ error: 'Serviço não encontrado.' });
    }
    console.error('Erro ao deletar o serviço:', _error);
    res.status(500).json({ error: 'Não foi possível deletar o serviço.' });
  }
});

export default router;
