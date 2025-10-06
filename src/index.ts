import express from 'express';
import clientRoutes from './routes/client.routes';
import authRoutes from './routes/auth.routes';

const app = express();
const port = 3001;

app.use(express.json());

// A "Fiação" - Todas as rotas vêm aqui
app.use('/auth', authRoutes);
app.use('/clientes', clientRoutes);

// Ligar o servidor é a ÚLTIMA coisa a se fazer
app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});