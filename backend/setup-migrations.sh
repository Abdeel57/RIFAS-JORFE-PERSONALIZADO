#!/bin/bash

# Script para configurar y ejecutar migraciones desde local
# Conectándose a la base de datos de Railway

echo "🗄️  Configuración de Migraciones Locales"
echo ""

# Paso 1: Verificar si existe .env
if [ -f ".env" ]; then
    echo "✅ Archivo .env encontrado"
else
    echo "⚠️  Archivo .env no encontrado"
    echo ""
    echo "Por favor, crea un archivo .env con la siguiente estructura:"
    echo ""
    echo "DATABASE_URL=postgresql://postgres:password@host:port/railway"
    echo ""
    echo "Para obtener la DATABASE_URL:"
    echo "1. Ve a Railway → Tu Servicio PostgreSQL"
    echo "2. Click en 'Variables'"
    echo "3. Copia el valor de DATABASE_URL o POSTGRES_URL"
    echo ""
    read -p "¿Ya tienes la DATABASE_URL? (s/n): " continue
    if [ "$continue" != "s" ]; then
        echo "Por favor, configura el archivo .env primero"
        exit 1
    fi
fi

# Paso 2: Instalar dependencias
echo ""
echo "📦 Instalando dependencias..."
npm install

# Paso 3: Generar Prisma Client
echo ""
echo "🔧 Generando Prisma Client..."
npx prisma generate

# Paso 4: Crear migración inicial
echo ""
echo "📝 Creando migración inicial..."
echo "Si ya existe una migración, este paso se saltará"
npx prisma migrate dev --name init

# Paso 5: Ejecutar migraciones
echo ""
echo "🚀 Ejecutando migraciones..."
npx prisma migrate deploy

# Paso 6: Ejecutar seed
echo ""
echo "🌱 Ejecutando seed (crear administrador)..."
npx tsx src/scripts/seed.ts

echo ""
echo "✅ ¡Migraciones completadas exitosamente!"
echo ""
echo "Credenciales del administrador:"
echo "Email: admin@rifasnao.com"
echo "Password: admin123456"





