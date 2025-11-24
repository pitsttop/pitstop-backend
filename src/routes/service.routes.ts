import { Router, Request, Response } from 'express';
import { authorize } from '../middlewares/auth.middleware';
import { UserRole, Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

const hasPrismaErrorCode = (error: unknown, ...codes: string[]) => {
  const KnownError = Prisma.PrismaClientKnownRequestError;
  if (
    typeof KnownError === 'function' &&
    error instanceof KnownError &&
    codes.includes(error.code)
  ) {
    return true;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  ) {
    return codes.includes((error as { code: string }).code);
  }

  return false;
};

router.get('/', async (req: Request, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(services);
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    res.status(500).json({ error: 'Erro ao buscar serviços.' });
  }
});

router.post(
  '/',
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { name, description, price } = req.body;
      const service = await prisma.service.create({
        data: { name, description, price: Number(price) },
      });
      res.status(201).json(service);
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      res.status(500).json({ error: 'Erro ao criar serviço.' });
    }
  },
);

router.put(
  '/:id',
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      if (data.price) data.price = Number(data.price);

      const service = await prisma.service.update({
        where: { id },
        data,
      });
      res.json(service);
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
      res.status(500).json({ error: 'Erro ao atualizar serviço.' });
    }
  },
);

router.delete(
  '/:id',
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      await prisma.service.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (error) {
      if (hasPrismaErrorCode(error, 'P2003')) {
        return res.status(400).json({
          error:
            'Não é possível excluir este serviço pois ele já foi utilizado em Ordens de Serviço.',
        });
      }

      if (hasPrismaErrorCode(error, 'P2025')) {
        return res.status(404).json({ error: 'Serviço não encontrado.' });
      }

      console.error('Erro ao deletar serviço:', error);
      res.status(500).json({ error: 'Erro interno ao deletar serviço.' });
    }
  },
);
export default router;
