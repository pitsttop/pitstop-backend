import { Router, Request, Response } from 'express';
import { authorize } from '../middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import * as vehicleService from '../services/vehicle.services';

const router = Router();

// Rota protegida para ADMIN
router.use(authorize([UserRole.ADMIN]));

// Criar um novo veículo
router.post('/', async (req: Request, res: Response) => {
  try {
    // O Admin precisa enviar o ID do dono no corpo da requisição
    const { plate, model, brand, year, color, ownerId } = req.body;

    // 1. Validação Simples
    if (!ownerId) {
      return res.status(400).json({ error: 'O campo ownerId (ID do Cliente) é obrigatório.' });
    }

    // 2. Chama o serviço passando os dados limpos
    const vehicle = await vehicleService.createVehicle({
      plate,
      model,
      brand,
      year: Number(year), // Garante que ano é número
      color,
      ownerId
    });

    res.status(201).json(vehicle);

  } catch (error: any) {
    console.error("Erro ao criar veículo:", error); // <--- ISSO VAI MOSTRAR O ERRO NO TERMINAL

    // Tratamento de erros comuns do Prisma
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Já existe um veículo com esta placa.' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'O ownerId informado não existe (Cliente não encontrado).' });
    }

    res.status(500).json({ error: 'Não foi possível criar o veículo.' });
  }
});

// ... (O resto das rotas GET, PUT, DELETE pode manter igual) ...
router.get('/', async (req: Request, res: Response) => {
  try {
    const vehicles = await vehicleService.listAllVehicles();
    res.json(vehicles);
  } catch {
    res.status(500).json({ error: 'Não foi possível listar os veículos.' });
  }
});
// ... etc
export default router;