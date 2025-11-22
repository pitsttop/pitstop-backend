import { Router, Request, Response } from 'express';
import { authorize } from '../middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import * as partService from '../services/part.services';

const router = Router();

// --- MUDANÇA: Removemos o bloqueio global ---
// Antes: router.use(authorize([UserRole.ADMIN]));
// Agora as rotas GET são públicas para a Landing Page acessar.

// Rota para listar todas as peças (GET /pecas) - PÚBLICA
router.get('/', async (req: Request, res: Response) => {
  try {
    const parts = await partService.listParts();
    res.json(parts);
  } catch (_error) {
    console.error('Erro ao listar as peças:', _error);
    res.status(500).json({ error: 'Não foi possível listar as peças.' });
  }
});

// Rota para buscar uma peça por ID (GET /pecas/:id) - PÚBLICA
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

// --- ROTAS PROTEGIDAS (Apenas Admin) ---

// Rota para criar uma nova peça (POST /pecas)
router.post('/', authorize([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const part = await partService.createPart(req.body);
    res.status(201).json(part);
  } catch (_error) {
    console.error('Erro ao criar a peça:', _error);
    res.status(500).json({ error: 'Não foi possível criar a peça.' });
  }
});

// Rota para atualizar uma peça (PUT /pecas/:id)
router.put('/:id', authorize([UserRole.ADMIN]), async (req: Request, res: Response) => {
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
});

// Rota para deletar uma peça (DELETE /pecas/:id)
router.delete('/:id', authorize([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    await partService.deletePart(req.params.id);
    res.status(204).send();
  } catch (_error) {
    // 1. TRATAMENTO P2003: Item em uso (Foreign Key Constraint)
    if ((_error as { code?: string }).code === 'P2003') {
        return res.status(400).json({
            error: 'Não é possível excluir esta peça pois ela é utilizada em Ordens de Serviço.'
        });
    }

    // 2. P2025 (Record Not Found) - Já estava correto
    if ((_error as { code?: string }).code === 'P2025') {
      return res.status(404).json({ error: 'Peça não encontrada.' });
    }
    
    // 3. Erro Genérico (Qualquer outro erro inesperado)
    console.error('Erro ao deletar a peça:', _error);
    res.status(500).json({ error: 'Não foi possível deletar a peça.' });
  }
});

export default router;