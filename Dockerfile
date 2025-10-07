# Usamos uma imagem oficial do Node.js como base
FROM node:18-alpine

# Define o diretório de trabalho dentro do contentor
WORKDIR /app

# Copia os arquivos de definição de pacotes
# Isto é feito primeiro para aproveitar o cache do Docker nas dependências
COPY package.json package-lock.json ./

# Instala TODAS as dependências (dev e prod), pois precisamos das ferramentas de desenvolvimento
RUN npm install

# Copia o resto do código-fonte do projeto
# O comando 'command' no docker-compose irá iniciar o servidor em modo de desenvolvimento
COPY . .