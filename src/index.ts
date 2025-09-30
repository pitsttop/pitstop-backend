import express from 'express';
import clientRoutes from './routes/client.routes'; 

const app = express();
const port = 3001;

app.use(express.json());


app.use('/clientes', clientRoutes);

app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});