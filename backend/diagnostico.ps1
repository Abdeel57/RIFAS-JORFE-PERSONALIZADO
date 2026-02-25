# Script de Diagnóstico del Backend
# Ejecuta este script para verificar la configuración

Write-Host "🔍 Diagnóstico del Backend" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar que estamos en el directorio correcto
Write-Host "1. Verificando directorio..." -ForegroundColor Yellow
if (-not (Test-Path "package.json")) {
    Write-Host "   ❌ No se encontró package.json" -ForegroundColor Red
    Write-Host "   💡 Ejecuta este script desde la carpeta backend/" -ForegroundColor Yellow
    exit 1
}
Write-Host "   ✅ Estamos en el directorio correcto" -ForegroundColor Green
Write-Host ""

# 2. Verificar archivo .env
Write-Host "2. Verificando archivo .env..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "   ❌ No se encontró archivo .env" -ForegroundColor Red
    Write-Host "   💡 Crea el archivo .env con DATABASE_URL y JWT_SECRET" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Archivo .env existe" -ForegroundColor Green
    
    # Verificar contenido (sin mostrar valores sensibles)
    $envContent = Get-Content .env
    $hasDatabaseUrl = $envContent | Select-String -Pattern "DATABASE_URL"
    $hasJwtSecret = $envContent | Select-String -Pattern "JWT_SECRET"
    
    if ($hasDatabaseUrl) {
        Write-Host "   ✅ DATABASE_URL encontrado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ DATABASE_URL no encontrado en .env" -ForegroundColor Red
    }
    
    if ($hasJwtSecret) {
        Write-Host "   ✅ JWT_SECRET encontrado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ JWT_SECRET no encontrado en .env" -ForegroundColor Red
    }
}
Write-Host ""

# 3. Verificar dependencias
Write-Host "3. Verificando dependencias..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "   ❌ node_modules no existe" -ForegroundColor Red
    Write-Host "   💡 Ejecuta: npm install" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ node_modules existe" -ForegroundColor Green
}
Write-Host ""

# 4. Verificar Prisma Client
Write-Host "4. Verificando Prisma Client..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules\.prisma\client")) {
    Write-Host "   ❌ Prisma Client no generado" -ForegroundColor Red
    Write-Host "   💡 Ejecuta: npm run prisma:generate" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Prisma Client generado" -ForegroundColor Green
}
Write-Host ""

# 5. Verificar código compilado
Write-Host "5. Verificando código compilado..." -ForegroundColor Yellow
if (-not (Test-Path "dist\index.js")) {
    Write-Host "   ❌ Código no compilado" -ForegroundColor Red
    Write-Host "   💡 Ejecuta: npm run build" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Código compilado existe" -ForegroundColor Green
}
Write-Host ""

# 6. Intentar cargar variables de entorno
Write-Host "6. Verificando variables de entorno..." -ForegroundColor Yellow
try {
    node -e "require('dotenv').config(); console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'OK (' + process.env.DATABASE_URL.substring(0, 20) + '...)' : 'FALTA'); console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'OK (' + process.env.JWT_SECRET.length + ' caracteres)' : 'FALTA'); console.log('PORT:', process.env.PORT || '3001');"
} catch {
    Write-Host "   ⚠️  No se pudo verificar variables de entorno" -ForegroundColor Yellow
}
Write-Host ""

# 7. Verificar puerto
Write-Host "7. Verificando puerto 3001..." -ForegroundColor Yellow
$portInUse = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "   ⚠️  Puerto 3001 está en uso" -ForegroundColor Yellow
    Write-Host "   💡 Cierra otros procesos o cambia el puerto en .env" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Puerto 3001 disponible" -ForegroundColor Green
}
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Diagnóstico completado" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   Si hay errores ❌, corrígelos primero" -ForegroundColor White
Write-Host "   Luego ejecuta: npm run dev" -ForegroundColor White
Write-Host ""


