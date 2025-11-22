import { Router, Request, Response } from 'express';
import { authorize } from '../middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import * as vehicleService from '../services/vehicle.services';

const router = Router();

// 1. Rota para listar todos os veículos (PÚBLICA para a calculadora na Landing Page)
router.get('/', async (req: Request, res: Response) => {
  try {
    const vehicles = await vehicleService.listAllVehicles();
    res.json(vehicles);
  } catch (_error) {
    res.status(500).json({ error: 'Não foi possível listar os veículos.' });
  }
});

// --- Rotas Protegidas (Modificação) ---

// 2. Rota para criar um novo veículo (POST /veiculos)
router.post('/', authorize([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const { plate, model, brand, year, color, ownerId } = req.body;

    if (!ownerId) {
      return res.status(400).json({ error: 'O campo ownerId (ID do Cliente) é obrigatório.' });
    }

    const vehicle = await vehicleService.createVehicle({
      plate,
      model,
      brand,
      year: Number(year),
      color,
      ownerId
    });

    res.status(201).json(vehicle);

  } catch (error: any) {
    console.error("Erro ao criar veículo:", error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Já existe um veículo com esta placa.' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'O ownerId informado não existe (Cliente não encontrado).' });
    }
    res.status(500).json({ error: 'Não foi possível criar o veículo.' });
  }
});

// 3. Atualizar um veículo (PUT /veiculos/:id)
router.put('/:id', authorize([UserRole.ADMIN]), async (req: Request, res: Response) => {
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

// 4. Deletar um veículo (DELETE /veiculos/:id)
router.delete('/:id', authorize([UserRole.ADMIN]), async (req: Request, res: Response) => {
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

// 5. Buscar um veículo por ID (GET /veiculos/:id) - PÚBLICA (Para detalhes)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const vehicle = await vehicleService.findVehicleById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Veículo não encontrado.' });
    }
    res.json(vehicle);
  } catch (_error) {
    res.status(500).json({ error: 'Não foi possível buscar o veículo.' });
  }
});


export default router;