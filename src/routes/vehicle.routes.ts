import { Router, Request, Response } from 'express';
import { authorize } from '../middlewares/auth.middleware';
import { UserRole, Prisma } from '@prisma/client';
import * as vehicleService from '../services/vehicle.services';

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
    const vehicles = await vehicleService.listAllVehicles();
    res.json(vehicles);
  } catch (error) {
    console.error('Erro ao listar veículos:', error);
    res.status(500).json({ error: 'Não foi possível listar os veículos.' });
  }
});

router.post(
  '/',
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { plate, model, brand, year, color, ownerId } = req.body;

      if (!ownerId) {
        return res
          .status(400)
          .json({ error: 'O campo ownerId (ID do Cliente) é obrigatório.' });
      }

      const vehicle = await vehicleService.createVehicle({
        plate,
        model,
        brand,
        year: Number(year),
        color,
        ownerId,
      });

      res.status(201).json(vehicle);
    } catch (error) {
      console.error('Erro ao criar veículo:', error);
      if (hasPrismaErrorCode(error, 'P2002')) {
        return res
          .status(409)
          .json({ error: 'Já existe um veículo com esta placa.' });
      }
      if (hasPrismaErrorCode(error, 'P2003')) {
        return res.status(400).json({
          error: 'O ownerId informado não existe (Cliente não encontrado).',
        });
      }
      res.status(500).json({ error: 'Não foi possível criar o veículo.' });
    }
  },
);

router.put(
  '/:id',
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const vehicle = await vehicleService.updateVehicle(
        req.params.id,
        req.body,
      );
      res.json(vehicle);
    } catch (error) {
      if (hasPrismaErrorCode(error, 'P2025')) {
        return res.status(404).json({ error: 'Veículo não encontrado.' });
      }
      res.status(500).json({ error: 'Não foi possível atualizar o veículo.' });
    }
  },
);

router.delete(
  '/:id',
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      await vehicleService.deleteVehicle(req.params.id);
      res.status(204).send();
    } catch (error) {
      if (hasPrismaErrorCode(error, 'P2025')) {
        return res.status(404).json({ error: 'Veículo não encontrado.' });
      }
      res.status(500).json({ error: 'Não foi possível deletar o veículo.' });
    }
  },
);

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const vehicle = await vehicleService.findVehicleById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Veículo não encontrado.' });
    }
    res.json(vehicle);
  } catch (error) {
    console.error('Erro ao buscar veículo:', error);
    res.status(500).json({ error: 'Não foi possível buscar o veículo.' });
  }
});

export default router;
