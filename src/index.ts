import express from 'express';
import clientRoutes from './routes/client.routes';

import vehicleRoutes from './routes/vehicle.routes';
import orderRoutes from './routes/order.routes';
import partRoutes from './routes/part.routes';
import serviceRoutes from './routes/service.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app = express();
const port = 3001;

app.use(express.json());

app.use('/clientes', clientRoutes);
app.use('/veiculos', vehicleRoutes);
app.use('/ordens', orderRoutes);
app.use('/pecas', partRoutes);
app.use('/servicos', serviceRoutes);
app.use('/dashboard', dashboardRoutes);

app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
