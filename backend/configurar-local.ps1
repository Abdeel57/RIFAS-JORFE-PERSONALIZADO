# Script de Configuración Local del Backend
# Ejecuta este script desde la carpeta backend/

Write-Host "🚀 Configurando Backend Localmente..." -ForegroundColor Cyan
Write-Host ""

# Paso 1: Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: No se encontró package.json" -ForegroundColor Red
    Write-Host "   Asegúrate de ejecutar este script desde la carpeta backend/" -ForegroundColor Yellow
    exit 1
}

# Paso 2: Instalar dependencias
Write-Host "📦 Instalando dependencias..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al instalar dependencias" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
Write-Host ""

# Paso 3: Verificar si existe .env
if (Test-Path ".env") {
    Write-Host "⚠️  El archivo .env ya existe" -ForegroundColor Yellow
    $sobrescribir = Read-Host "¿Deseas sobrescribirlo? (s/n)"
    if ($sobrescribir -ne "s" -and $sobrescribir -ne "S") {
        Write-Host "✅ Manteniendo .env existente" -ForegroundColor Green
    } else {
        Remove-Item ".env"
        $crearEnv = $true
    }
} else {
    $crearEnv = $true
}

# Paso 4: Crear archivo .env
if ($crearEnv) {
    Write-Host ""
    Write-Host "📝 Configurando archivo .env..." -ForegroundColor Cyan
    Write-Host ""
    
    # Solicitar DATABASE_URL
    Write-Host "Ingresa la DATABASE_URL:" -ForegroundColor Yellow
    Write-Host "  - Si usas Railway Database, cópiala de Railway → DATABASE → Variables" -ForegroundColor Gray
    Write-Host "  - Si usas base de datos local, usa: postgresql://usuario:password@localhost:5432/rifas_nao" -ForegroundColor Gray
    $databaseUrl = Read-Host "DATABASE_URL"
    
    # Generar JWT_SECRET
    Write-Host ""
    Write-Host "🔑 Generando JWT_SECRET..." -ForegroundColor Cyan
    $jwtSecret = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    Write-Host "✅ JWT_SECRET generado: $jwtSecret" -ForegroundColor Green
    Write-Host ""
    
    # Crear contenido del .env
    $envContent = @"
# Base de Datos
DATABASE_URL="$databaseUrl"

# JWT Secret (generado automáticamente)
JWT_SECRET="$jwtSecret"

# Entorno
NODE_ENV="development"
PORT=3001

# Frontend URL (opcional)
FRONTEND_URL="http://localhost:3000"

# Gemini API Key (opcional, solo si usas el chatbot)
# GEMINI_API_KEY="tu-api-key-de-gemini"
"@
    
    # Escribir archivo .env
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ Archivo .env creado" -ForegroundColor Green
    Write-Host ""
}

# Paso 5: Generar Prisma Client
Write-Host "🔧 Generando Prisma Client..." -ForegroundColor Cyan
npm run prisma:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al generar Prisma Client" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma Client generado" -ForegroundColor Green
Write-Host ""

# Paso 6: Ejecutar migraciones
Write-Host "🗄️  Ejecutando migraciones..." -ForegroundColor Cyan
npm run prisma:migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al ejecutar migraciones" -ForegroundColor Red
    Write-Host "   Verifica que la DATABASE_URL sea correcta" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Migraciones ejecutadas" -ForegroundColor Green
Write-Host ""

# Paso 7: Crear usuario administrador
Write-Host "👤 Creando usuario administrador..." -ForegroundColor Cyan
npx tsx src/scripts/seed.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Error al crear administrador (puede que ya exista)" -ForegroundColor Yellow
} else {
    Write-Host "✅ Administrador creado:" -ForegroundColor Green
    Write-Host "   Email: admin@rifasnao.com" -ForegroundColor Cyan
    Write-Host "   Password: admin123456" -ForegroundColor Cyan
}
Write-Host ""

# Paso 8: Verificar que el admin existe
Write-Host "🔍 Verificando administrador..." -ForegroundColor Cyan
npx tsx src/scripts/check-admin.ts
Write-Host ""

# Resumen
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Ejecuta: npm run dev" -ForegroundColor White
Write-Host "   2. Abre: http://localhost:3001/health" -ForegroundColor White
Write-Host "   3. Prueba el login en: http://localhost:3001/api/admin/auth/login" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Credenciales del admin:" -ForegroundColor Yellow
Write-Host "   Email: admin@rifasnao.com" -ForegroundColor White
Write-Host "   Password: admin123456" -ForegroundColor White
Write-Host ""
Write-Host "📝 Para desplegar a Railway:" -ForegroundColor Yellow
Write-Host "   1. Actualiza las variables de entorno en Railway con los mismos valores" -ForegroundColor White
Write-Host "   2. Haz commit y push: git add . ; git commit -m 'Config' ; git push" -ForegroundColor White
Write-Host "===============================================================" -ForegroundColor Cyan

