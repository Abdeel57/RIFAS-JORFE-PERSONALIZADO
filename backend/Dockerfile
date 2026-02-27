FROM node:18-alpine

WORKDIR /app

# Instalar OpenSSL para Prisma + Chromium y dependencias para Puppeteer (Banxico CEP)
RUN apk add --no-cache \
    openssl openssl-dev \
    chromium \
    nss freetype harfbuzz ca-certificates ttf-freefont \
    fontconfig

# Usar Chromium del sistema en lugar del que descarga Puppeteer (evita libglib en contenedor)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

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

