FROM node:18-bookworm-slim

# Evitar descarga de Chrome durante npm install (puppeteer)
# DEBE declararse antes de cualquier RUN npm install
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Chromium (Puppeteer) + OpenSSL (Prisma) + fuentes mínimas
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    openssl \
    ca-certificates \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# ── Build Admin Panel ──────────────────────────────────────────────────────────
WORKDIR /app/admin-panel

COPY admin-panel/package*.json ./
RUN npm install

COPY admin-panel/ ./
# vite.config.ts tiene outDir: '../backend/dist/admin'
# → salida en /app/backend/dist/admin/
RUN npm run build

# ── Build Backend ──────────────────────────────────────────────────────────────
WORKDIR /app/backend

COPY backend/package*.json ./
COPY backend/prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY backend/ ./
RUN npm run build

RUN chmod +x startup.sh

CMD ["sh", "./startup.sh"]
