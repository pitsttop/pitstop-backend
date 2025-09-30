import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Rota GET /clientes para listar todos os clientes
router.get('/', async (req: Request, res: Response) => {
  try {
    const clientes = await prisma.client.findMany();
    res.json(clientes);
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    res.status(500).json({ error: 'Não foi possível buscar os clientes.' });
  }
});

// Rota POST /clientes para criar um novo cliente
router.post('/', async (req: Request, res: Response) => {
  try {
    const novoClienteData = req.body;
    const cliente = await prisma.client.create({
      data: novoClienteData,
    });
    res.status(201).json(cliente);
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    res.status(500).json({ error: 'Não foi possível criar o cliente.' });
  }
});

export default router; 