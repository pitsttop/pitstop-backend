import { Router, Request, Response } from 'express';
import { authorize } from '../middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// 1. LISTAR SERVIÇOS: Liberado para Admin e Clientes
// (Assim o agendamento consegue puxar a lista)
router.get('/', authorize([UserRole.ADMIN, UserRole.CLIENT]), async (req: Request, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar serviços.' });
  }
});

// 2. CRIAR SERVIÇO: Apenas Admin
router.post('/', authorize([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const { name, description, price } = req.body;
    const service = await prisma.service.create({
      data: { name, description, price: Number(price) }
    });
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar serviço.' });
  }
});

// 3. ATUALIZAR: Apenas Admin
router.put('/:id', authorize([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    if (data.price) data.price = Number(data.price);
    
    const service = await prisma.service.update({
      where: { id },
      data
    });
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar serviço.' });
  }
});

// 4. DELETAR: Apenas Admin
router.delete('/:id', authorize([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    await prisma.service.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar serviço.' });
  }
});

export default router;