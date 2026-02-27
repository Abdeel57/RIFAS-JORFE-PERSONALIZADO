FROM node:18-alpine

WORKDIR /app

# Asegurar repo community (chromium) según versión de Alpine del base image
RUN V=$(grep VERSION_ID /etc/os-release | cut -d= -f2 | tr -d '"' | cut -d. -f1,2) && \
    grep -q "community" /etc/apk/repositories || echo "http://dl-cdn.alpinelinux.org/alpine/v${V}/community" >> /etc/apk/repositories && \
    apk update

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

