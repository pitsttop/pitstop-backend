import { createApp } from './app';

const port = process.env.PORT || 3001;
const app = createApp();

app.listen(port as number, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando em http://0.0.0.0:${port}`);
});