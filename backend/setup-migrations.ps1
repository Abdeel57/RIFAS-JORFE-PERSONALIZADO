# Script para configurar y ejecutar migraciones desde local
# Conectándose a la base de datos de Railway

Write-Host "🗄️  Configuración de Migraciones Locales" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Verificar si existe .env
if (Test-Path ".env") {
    Write-Host "✅ Archivo .env encontrado" -ForegroundColor Green
} else {
    Write-Host "⚠️  Archivo .env no encontrado" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Por favor, crea un archivo .env con la siguiente estructura:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "DATABASE_URL=postgresql://postgres:password@host:port/railway" -ForegroundColor White
    Write-Host ""
    Write-Host "Para obtener la DATABASE_URL:" -ForegroundColor Yellow
    Write-Host "1. Ve a Railway → Tu Servicio PostgreSQL" -ForegroundColor White
    Write-Host "2. Click en 'Variables'" -ForegroundColor White
    Write-Host "3. Copia el valor de DATABASE_URL o POSTGRES_URL" -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "¿Ya tienes la DATABASE_URL? (s/n)"
    if ($continue -ne "s") {
        Write-Host "Por favor, configura el archivo .env primero" -ForegroundColor Red
        exit
    }
}

# Paso 2: Instalar dependencias
Write-Host ""
Write-Host "📦 Instalando dependencias..." -ForegroundColor Cyan
npm install

# Paso 3: Generar Prisma Client
Write-Host ""
Write-Host "🔧 Generando Prisma Client..." -ForegroundColor Cyan
npx prisma generate

# Paso 4: Crear migración inicial
Write-Host ""
Write-Host "📝 Creando migración inicial..." -ForegroundColor Cyan
Write-Host "Si ya existe una migración, este paso se saltará" -ForegroundColor Yellow
npx prisma migrate dev --name init

# Paso 5: Ejecutar migraciones
Write-Host ""
Write-Host "🚀 Ejecutando migraciones..." -ForegroundColor Cyan
npx prisma migrate deploy

# Paso 6: Ejecutar seed
Write-Host ""
Write-Host "🌱 Ejecutando seed (crear administrador)..." -ForegroundColor Cyan
npx tsx src/scripts/seed.ts

Write-Host ""
Write-Host "✅ ¡Migraciones completadas exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "Credenciales del administrador:" -ForegroundColor Cyan
Write-Host "Email: admin@rifasnao.com" -ForegroundColor White
Write-Host "Password: admin123456" -ForegroundColor White




