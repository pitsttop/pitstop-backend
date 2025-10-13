import express from 'express';
import clientRoutes from './routes/client.routes';
import authRoutes from './routes/auth.routes';
import vehicleRoutes from './routes/vehicle.routes';

const app = express();
const port = 3001;

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/clientes', clientRoutes);
app.use('/veiculos', vehicleRoutes);

app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
