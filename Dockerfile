# 1. Imagem base
FROM node:18-alpine

# 2. Diretório de trabalho
WORKDIR /app

# 3. Instalar dependências
COPY package*.json ./
RUN npm install

# 4. Copiar o código fonte
COPY . .

# 5. CRÍTICO: Gerar o cliente do Prisma para o Linux do container
RUN npx prisma generate

# 6. CRÍTICO: Construir o projeto (TypeScript -> JavaScript)
# Isso cria a pasta dist/
RUN npm run build

# 7. Expor a porta (Documentação)
EXPOSE 3001

# 8. Comando para iniciar em PRODUÇÃO
# Ele vai rodar o script "start" do seu package.json
CMD ["npm", "run", "start"]