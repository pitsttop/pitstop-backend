import { Router, Request, Response } from 'express';
import { authorize } from '../middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import * as partService from '../services/part.services';

const router = Router();

// Apenas Admins podem gerenciar o catálogo de peças.

router.use(authorize([UserRole.ADMIN]));

// Rota para criar uma nova peça (POST /pecas)
router.post('/', async (req: Request, res: Response) => {
  try {
    const part = await partService.createPart(req.body);
    res.status(201).json(part);
  } catch (error) {
    console.error('Erro ao criar a peça:', error);
    res.status(500).json({ error: 'Não foi possível criar a peça.' });
  }
});

// Rota para listar todas as peças (GET /pecas)
router.get('/', async (req: Request, res: Response) => {
  try {
    const parts = await partService.listParts();
    res.json(parts);
  } catch (error) {
    console.error('Erro ao listar as peças:', error);
    res.status(500).json({ error: 'Não foi possível listar as peças.' });
  }
});

// Rota para buscar uma peça por ID (GET /pecas/:id)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const part = await partService.findPartById(req.params.id);
    if (!part) {
      return res.status(404).json({ error: 'Peça não encontrada.' });
    }
    res.json(part);
  } catch (error) {
    console.error('Erro ao buscar a peça:', error);
    res.status(500).json({ error: 'Não foi possível buscar a peça.' });
  }
});

// Rota para atualizar uma peça (PUT /pecas/:id)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const part = await partService.updatePart(req.params.id, req.body);
    res.json(part);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Peça não encontrada.' });
    }
    console.error('Erro ao atualizar a peça:', error);
    res.status(500).json({ error: 'Não foi possível atualizar a peça.' });
  }
});

// Rota para deletar uma peça (DELETE /pecas/:id)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await partService.deletePart(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Peça não encontrada.' });
    }
    console.error('Erro ao deletar a peça:', error);
    res.status(500).json({ error: 'Não foi possível deletar a peça.' });
  }
});

export default router;
