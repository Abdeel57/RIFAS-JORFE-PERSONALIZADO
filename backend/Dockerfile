FROM node:18-alpine

WORKDIR /app

# Evitar que puppeteer descargue Chrome en el build (no hay Chromium en esta imagen)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Instalar OpenSSL para Prisma
RUN apk add --no-cache openssl openssl-dev

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias (puppeteer no descargará Chrome gracias a PUPPETEER_SKIP_CHROMIUM_DOWNLOAD)
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
