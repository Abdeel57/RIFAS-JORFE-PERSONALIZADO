# Diagnóstico de Logs - Guía de Interpretación

## 🔍 Cómo Revisar los Logs

### Si estás ejecutando localmente (`npm run dev`)

Los logs aparecerán directamente en tu consola. Busca estos mensajes:

#### ✅ Logs Normales (Todo está bien):

```
🔍 Iniciando servidor Express...
PORT: 3001
NODE_ENV: development
🔧 Configurando CORS...
✅ CORS configurado correctamente
📦 Cargando configuración...
✅ Configuración cargada
📦 Cargando rutas...
✅ Todas las rutas cargadas correctamente
📁 Ruta del admin panel: C:\...\backend\dist\admin
🚀 Iniciando servidor en http://0.0.0.0:3001...
🚀 Server running on http://0.0.0.0:3001
✅ Servidor iniciado correctamente
```

#### ❌ Errores Comunes:

**1. Error: "Cannot find module"**
```
Error: Cannot find module '@prisma/client'
```
**Solución:** Ejecuta `npm run prisma:generate`

**2. Error: "DATABASE_URL is required"**
```
❌ Error en variables de entorno:
  - DATABASE_URL: Required
```
**Solución:** Verifica que el archivo `.env` tenga `DATABASE_URL`

**3. Error: "JWT_SECRET is required"**
```
❌ Error en variables de entorno:
  - JWT_SECRET: String must contain at least 32 character(s)
```
**Solución:** Verifica que `JWT_SECRET` tenga al menos 32 caracteres

**4. Error: "Cannot connect to database"**
```
Error: P1001: Can't reach database server
```
**Solución:** 
- Verifica que la `DATABASE_URL` sea correcta
- Verifica que el servicio DATABASE esté "Online" en Railway
- Verifica que no haya espacios extra en la URL

**5. Error: "Prisma Client not generated"**
```
@prisma/client did not initialize yet
```
**Solución:** Ejecuta `npm run prisma:generate`

**6. Error: "Port already in use"**
```
Error: listen EADDRINUSE: address already in use :::3001
```
**Solución:** 
- Cierra otros procesos que usen el puerto 3001
- O cambia el puerto en `.env`: `PORT=3002`

**7. Error al cargar rutas:**
```
⚠️  Error cargando rutas: ...
```
**Solución:** Revisa el error específico que aparece después

### Si estás viendo logs de Railway

En Railway → BACKEND → "Logs", busca:

#### ✅ Servidor Iniciando Correctamente:

```
=== STARTUP: begin ===
DATABASE_URL_SET=true
JWT_SECRET_SET=true
=== STARTUP: migrate deploy ===
=== STARTUP: migrate ok ===
=== STARTUP: launching node ===
🔍 Iniciando servidor Express...
🚀 Server running on http://0.0.0.0:XXXX
✅ Servidor iniciado correctamente
```

#### ❌ Problemas Comunes:

**1. Migraciones fallaron:**
```
=== STARTUP: migrate failed (continuing) ===
```
**Solución:** 
- Verifica `DATABASE_URL` en Railway
- Ejecuta migraciones manualmente si es necesario

**2. Servidor no inicia:**
```
💥 [PROCESS] uncaughtException: ...
```
**Solución:** Revisa el error específico que aparece

**3. No hay logs después de "launching node":**
**Solución:** El servidor se está crasheando. Revisa los errores anteriores

## 📋 Checklist de Diagnóstico

Cuando veas errores, verifica:

- [ ] ¿El archivo `.env` existe y tiene `DATABASE_URL`?
- [ ] ¿`JWT_SECRET` tiene al menos 32 caracteres?
- [ ] ¿Prisma Client está generado? (`npm run prisma:generate`)
- [ ] ¿Las migraciones se ejecutaron? (`npm run prisma:migrate`)
- [ ] ¿El puerto está disponible?
- [ ] ¿La base de datos está accesible?

## 🆘 Compartir Logs para Ayuda

Si necesitas ayuda, comparte:

1. **Los últimos 30-50 líneas de logs** (desde donde empezó el error)
2. **El mensaje de error específico** (línea que dice "Error:" o "❌")
3. **Qué comando ejecutaste** (`npm run dev`, `npm start`, etc.)
4. **Si es local o Railway**

## 🔧 Comandos Útiles para Debugging

```powershell
# Verificar que .env existe y tiene contenido
Get-Content .env

# Verificar variables de entorno cargadas
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL ? 'DATABASE_URL: OK' : 'DATABASE_URL: FALTA'); console.log(process.env.JWT_SECRET ? 'JWT_SECRET: OK' : 'JWT_SECRET: FALTA')"

# Verificar que Prisma Client existe
Test-Path node_modules\.prisma\client

# Verificar que el código compilado existe
Test-Path dist\index.js

# Intentar iniciar y ver errores
node dist/index.js
```

