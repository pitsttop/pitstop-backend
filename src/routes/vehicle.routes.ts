import { Router, Request, Response } from 'express';
import { authorize } from '../middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import * as vehicleService from '../services/vehicle.services';

const router = Router();

// Todas as rotas de veículo serão protegidas e acessíveis apenas por Admins
router.use(authorize([UserRole.ADMIN]));

// Criar um novo veículo
router.post('/', async (req: Request, res: Response) => {
  try {
    const vehicle = await vehicleService.createVehicle(req.body);
    res.status(201).json(vehicle);
  } catch {
    res.status(500).json({ error: 'Não foi possível criar o veículo.' });
  }
});

// Listar todos os veículos
router.get('/', async (req: Request, res: Response) => {
  try {
    const vehicles = await vehicleService.listAllVehicles();
    res.json(vehicles);
  } catch {
    res.status(500).json({ error: 'Não foi possível listar os veículos.' });
  }
});

// Buscar um veículo por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const vehicle = await vehicleService.findVehicleById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Veículo não encontrado.' });
    }
    res.json(vehicle);
  } catch {
    res.status(500).json({ error: 'Não foi possível buscar o veículo.' });
  }
});

// Atualizar um veículo
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);
    res.json(vehicle);
  } catch (_error) {
    if ((_error as { code?: string }).code === 'P2025') {
      return res.status(404).json({ error: 'Veículo não encontrado.' });
    }
    res.status(500).json({ error: 'Não foi possível atualizar o veículo.' });
  }
});

// Deletar um veículo
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await vehicleService.deleteVehicle(req.params.id);
    res.status(204).send();
  } catch (_error) {
    if ((_error as { code?: string }).code === 'P2025') {
      return res.status(404).json({ error: 'Veículo não encontrado.' });
    }
    res.status(500).json({ error: 'Não foi possível deletar o veículo.' });
  }
});

export default router;
