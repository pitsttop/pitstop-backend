import { Router, Request, Response } from 'express';
import { authorize } from '../middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import * as partService from '../services/part.services';

const router = Router();


router.get('/', async (req: Request, res: Response) => {
  try {
    const parts = await partService.listParts();
    res.json(parts);
  } catch (_error) {
    console.error('Erro ao listar as peças:', _error);
    res.status(500).json({ error: 'Não foi possível listar as peças.' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const part = await partService.findPartById(req.params.id);
    if (!part) {
      return res.status(404).json({ error: 'Peça não encontrada.' });
    }
    res.json(part);
  } catch (_error) {
    console.error('Erro ao buscar a peça:', _error);
    res.status(500).json({ error: 'Não foi possível buscar a peça.' });
  }
});


router.post(
  '/',
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const part = await partService.createPart(req.body);
      res.status(201).json(part);
    } catch (_error) {
      console.error('Erro ao criar a peça:', _error);
      res.status(500).json({ error: 'Não foi possível criar a peça.' });
    }
  },
);

router.put(
  '/:id',
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const part = await partService.updatePart(req.params.id, req.body);
      res.json(part);
    } catch (_error) {
      if ((_error as { code?: string }).code === 'P2025') {
        return res.status(404).json({ error: 'Peça não encontrada.' });
      }
      console.error('Erro ao atualizar a peça:', _error);
      res.status(500).json({ error: 'Não foi possível atualizar a peça.' });
    }
  },
);

router.delete(
  '/:id',
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      await partService.deletePart(req.params.id);
      res.status(204).send();
    } catch (_error) {
      
      if ((_error as { code?: string }).code === 'P2003') {
        return res.status(400).json({
          error:
            'Não é possível excluir esta peça pois ela é utilizada em Ordens de Serviço.',
        });
      }

      
      if ((_error as { code?: string }).code === 'P2025') {
        return res.status(404).json({ error: 'Peça não encontrada.' });
      }

      
      console.error('Erro ao deletar a peça:', _error);
      res.status(500).json({ error: 'Não foi possível deletar a peça.' });
    }
  },
);

export default router;
