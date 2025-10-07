# Estágio 1: Instalação das dependências
# Usamos uma imagem oficial do Node.js como base
FROM node:18-alpine AS deps

# Define o diretório de trabalho dentro do contentor
WORKDIR /app

# Copia os arquivos de definição de pacotes
COPY package.json package-lock.json ./

# Instala apenas as dependências de produção para manter a imagem final pequena
RUN npm install --omit=dev

# Estágio 2: Construção do código
# Começamos de novo a partir da imagem de dependências
FROM node:18-alpine AS builder

WORKDIR /app
# Copia as dependências já instaladas do estágio anterior
COPY --from=deps /app/node_modules ./node_modules
# Copia o resto do código-fonte do projeto
COPY . .

# Gera o Prisma Client (essencial)
RUN npx prisma generate

# Compila o nosso código TypeScript para JavaScript
RUN npm run build

# Estágio 3: Produção (a imagem final e leve)
# Começamos com uma imagem limpa do Node.js
FROM node:18-alpine AS production

WORKDIR /app

# Copia os node_modules de produção do primeiro estágio
COPY --from=deps /app/node_modules ./node_modules
# Copia o código JavaScript já compilado do segundo estágio
COPY --from=builder /app/dist ./dist
# Copia o schema do Prisma, necessário para o Prisma Client funcionar
COPY --from=builder /app/prisma ./prisma

# Comando para iniciar o servidor quando o contentor arrancar
CMD ["node", "dist/index.js"]