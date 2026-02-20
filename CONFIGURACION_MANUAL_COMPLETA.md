# Configuración Manual Completa - Paso a Paso

## 🎯 Objetivo

Configurar todo localmente, probar que funcione, y luego desplegar a Railway automáticamente.

## 📋 Paso 1: Configurar Base de Datos

### Opción A: Usar la Base de Datos de Railway (Recomendado)

1. Ve a Railway → DATABASE → "Variables"
2. Copia la `DATABASE_URL` completa
3. La usaremos en el siguiente paso

### Opción B: Crear Base de Datos Local

Si prefieres usar una base de datos local, instala PostgreSQL y créala.

## 📋 Paso 2: Configurar el Backend Localmente

Sigue estos pasos en orden:

### 1. Ir al directorio del backend

```bash
cd backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear archivo .env

Crea un archivo llamado `.env` en la carpeta `backend/` con este contenido:

```env
# Base de Datos (usa la DATABASE_URL de Railway o una local)
DATABASE_URL="postgresql://usuario:password@host:puerto/database?schema=public"

# JWT Secret (genera uno nuevo o usa el de Railway)
JWT_SECRET="tu-clave-secreta-de-al-menos-32-caracteres-aqui-12345678901234567890"

# Entorno
NODE_ENV="development"
PORT=3001

# Frontend (opcional)
FRONTEND_URL="http://localhost:3000"

# Gemini API Key (opcional, solo si usas el chatbot)
GEMINI_API_KEY="tu-api-key-de-gemini"
```

**⚠️ IMPORTANTE:** 
- Reemplaza `DATABASE_URL` con la de Railway o tu base de datos local
- Genera un `JWT_SECRET` nuevo o usa el mismo de Railway

### 4. Generar Prisma Client

```bash
npm run prisma:generate
```

### 5. Ejecutar Migraciones

```bash
npm run prisma:migrate
```

Esto creará todas las tablas en la base de datos.

### 6. Crear Usuario Administrador

```bash
npx tsx src/scripts/seed.ts
```

Deberías ver:
```
✅ Admin creado:
   Email: admin@rifasnao.com
   Password: admin123456
```

### 7. Verificar que el Admin Existe

```bash
npx tsx src/scripts/check-admin.ts
```

### 8. Ejecutar el Servidor

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3001`

## 📋 Paso 3: Probar que Todo Funcione Localmente

### 1. Probar Health Check

Abre en tu navegador:
```
http://localhost:3001/health
```

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "...",
  "message": "Backend is running"
}
```

### 2. Probar Login del Admin

Usa Postman, Thunder Client, o cURL:

```bash
curl -X POST http://localhost:3001/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@rifasnao.com\",\"password\":\"admin123456\"}"
```

Deberías recibir un token JWT.

### 3. Probar API de Rifas

```
http://localhost:3001/api/raffles
```

Debería responder con un array (puede estar vacío).

## 📋 Paso 4: Actualizar Variables de Entorno en Railway

Una vez que todo funcione localmente:

1. Ve a Railway → BACKEND → "Variables"
2. Actualiza o agrega estas variables:

```
DATABASE_URL=<la misma que usaste localmente>
JWT_SECRET=<el mismo que usaste localmente>
NODE_ENV=production
FRONTEND_URL=https://naorifas.netlify.app
```

**⚠️ IMPORTANTE:** Usa los mismos valores que funcionaron localmente.

## 📋 Paso 5: Hacer Commit y Push

Una vez que todo funcione localmente:

```bash
# Desde la raíz del proyecto
git add .
git commit -m "Configuración completa del backend"
git push origin main
```

Railway detectará los cambios y redesplegará automáticamente.

## 📋 Paso 6: Verificar en Railway

Después del deploy (5-10 minutos):

1. Ve a Railway → BACKEND → "Logs"
2. Busca: `🚀 Server running` y `✅ Servidor iniciado correctamente`
3. Intenta acceder a: `https://tu-backend.up.railway.app/health`

## 🐛 Solución de Problemas

### Error: "Cannot connect to database"

**Solución:**
1. Verifica que la `DATABASE_URL` sea correcta
2. Si usas Railway Database, verifica que el servicio esté "Online"
3. Verifica que no haya espacios extra en la URL

### Error: "Prisma Client not generated"

**Solución:**
```bash
npm run prisma:generate
```

### Error: "Migration failed"

**Solución:**
1. Verifica que la base de datos exista
2. Verifica que la `DATABASE_URL` sea correcta
3. Intenta resetear (⚠️ esto borrará datos):
   ```bash
   npx prisma migrate reset
   npx prisma migrate deploy
   ```

### El servidor no inicia localmente

**Solución:**
1. Verifica que el puerto 3001 no esté en uso
2. Verifica que todas las dependencias estén instaladas
3. Revisa los errores en la consola

## ✅ Checklist Final

- [ ] Dependencias instaladas (`npm install`)
- [ ] Archivo `.env` creado con valores correctos
- [ ] Prisma Client generado (`npm run prisma:generate`)
- [ ] Migraciones ejecutadas (`npm run prisma:migrate`)
- [ ] Usuario admin creado (`npx tsx src/scripts/seed.ts`)
- [ ] Servidor corriendo localmente (`npm run dev`)
- [ ] Health check funciona (`http://localhost:3001/health`)
- [ ] Login funciona (puedes obtener token)
- [ ] Variables de entorno actualizadas en Railway
- [ ] Commit y push realizado
- [ ] Railway redesplegado correctamente

## 🎉 ¡Listo!

Si todos los pasos están completos, tu backend debería funcionar tanto localmente como en Railway.

