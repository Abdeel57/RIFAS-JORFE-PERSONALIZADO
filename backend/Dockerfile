FROM node:18-alpine

WORKDIR /app

# Instalar OpenSSL para Prisma
RUN apk add --no-cache openssl openssl-dev

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm install

# Generar Prisma Client
RUN npm run prisma:generate

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Script de arranque instrumentado
RUN chmod +x startup.sh

# Ejecutar arranque instrumentado (migración + servidor)
CMD ["sh", "./startup.sh"]

