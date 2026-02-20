# Dockerfile definitivo para Monorepo Rifas Nao
# Este archivo reemplaza a Nixpacks para dar control total sobre el build

FROM node:20-slim

# Instalar dependencias del sistema necesarias para Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates

WORKDIR /app

# 1. Preparar Backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install

# 2. Preparar Admin Panel
WORKDIR /app
COPY admin-panel/package*.json ./admin-panel/
WORKDIR /app/admin-panel
RUN npm install

# 3. Copiar código y compilar todo
WORKDIR /app
COPY backend ./backend/
COPY admin-panel ./admin-panel/

# Compilar Backend (Prisma + TS)
WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build

# Compilar Admin Panel (Vite)
# Esto genera los archivos en backend/dist/admin/
WORKDIR /app/admin-panel
RUN npm run build

# 4. Configuración Final
WORKDIR /app/backend
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Comando de inicio
CMD ["sh", "startup.sh"]
