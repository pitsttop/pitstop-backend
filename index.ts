import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const port = 3001;
const prisma = new PrismaClient();

app.use(express.json());

app.get('/clientes', async (req: Request, res: Response) => {
  try {
    const clientes = await prisma.client.findMany();
    res.json(clientes);
  } catch (error) {
    
    console.error("Erro ao buscar clientes:", error); 

    res.status(500).json({ error: 'Não foi possível buscar os clientes.' });
  }
});

app.post('/clientes', async (req: Request, res: Response) => {
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

app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});