# Script para ejecutar migraciones y seed en Railway
# Ejecuta desde la carpeta backend: .\migrar-railway.ps1

Write-Host "=== Railway: Migraciones y Seed ===" -ForegroundColor Cyan
Write-Host ""

# Verificar que railway está instalado
$railway = Get-Command railway -ErrorAction SilentlyContinue
if (-not $railway) {
    Write-Host "ERROR: Railway CLI no está instalado." -ForegroundColor Red
    Write-Host "Instala con: npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

# Verificar que estamos en backend
if (-not (Test-Path "prisma")) {
    Write-Host "ERROR: Ejecuta este script desde la carpeta backend" -ForegroundColor Red
    Write-Host "  cd backend" -ForegroundColor Yellow
    Write-Host "  .\migrar-railway.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "1. Creando tablas (prisma migrate deploy)..." -ForegroundColor Green
railway run npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "Fallo en migraciones. ¿Ejecutaste 'railway link' antes?" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Creando admin (seed)..." -ForegroundColor Green
railway run npx tsx src/scripts/seed.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "Fallo en seed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Listo ===" -ForegroundColor Green
Write-Host "Credenciales: Usuario=Bismark, Contraseña=admin123" -ForegroundColor Cyan
