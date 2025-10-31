import { Router, Request, Response } from 'express';
import { createUser, loginUser } from '../services/user.services';
import { createClient } from '../services/client.services';

const router = Router();

router.post('/signup', async (req: Request, res: Response) => {
  try {
    // 1. Cria o registro de autenticação (User)
    const user = await createUser(req.body);

    // 2. Cria o registro de negócio (Client)
    const client = await createClient(req.body);

    res.status(201).json({
      message: 'Usuário e Cliente criados com sucesso!',
      user,
      client,
    });
  } catch (_error) {
    console.error('Erro no signup:', _error);
    res.status(500).json({ error: 'Não foi possível realizar o cadastro.' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { token } = await loginUser(req.body);
    res.json({ token });
  } catch (_error) {
    const message = (_error as Error)?.message ?? 'Credenciais inválidas';
    res.status(401).json({ error: message });
  }
});

export default router;
