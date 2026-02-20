# Pasos Simples para Configurar el Backend

## 🎯 Objetivo

Configurar el backend localmente para que funcione, y luego desplegar a Railway.

## 📋 Paso 1: Obtener DATABASE_URL de Railway

1. Ve a Railway → DATABASE → "Variables"
2. Busca `DATABASE_URL`
3. **Copia el valor completo** (algo como: `postgresql://postgres:password@host:port/railway`)
4. Guárdalo, lo necesitarás en el siguiente paso

## 📋 Paso 2: Crear archivo .env

1. Abre el archivo `backend/.env` en tu editor (si no existe, créalo)
2. Pega este contenido y reemplaza los valores:

```env
DATABASE_URL="PEGA_AQUI_LA_DATABASE_URL_DE_RAILWAY"
JWT_SECRET="b4068b28f0cc85e50c962ba40edc59e436b4bc0cd4fb15d786bb33ead442a03c"
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

**⚠️ IMPORTANTE:** 
- Reemplaza `PEGA_AQUI_LA_DATABASE_URL_DE_RAILWAY` con la URL que copiaste en el Paso 1
- El JWT_SECRET ya está generado, puedes usarlo o generar uno nuevo

## 📋 Paso 3: Ejecutar Comandos

Abre PowerShell en la carpeta `backend/` y ejecuta estos comandos **uno por uno**:

```powershell
# 1. Generar Prisma Client
npm run prisma:generate

# 2. Ejecutar migraciones
npm run prisma:migrate

# 3. Crear usuario administrador
npx tsx src/scripts/seed.ts

# 4. Verificar que se creó
npx tsx src/scripts/check-admin.ts

# 5. Ejecutar servidor
npm run dev
```

## 📋 Paso 4: Probar que Funcione

1. **Abre en tu navegador:**
   ```
   http://localhost:3001/health
   ```
   Deberías ver: `{"status":"ok",...}`

2. **Prueba el login:**
   - Abre Postman, Thunder Client, o usa cURL
   - POST a: `http://localhost:3001/api/admin/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "admin@rifasnao.com",
       "password": "admin123456"
     }
     ```
   - Deberías recibir un token

## 📋 Paso 5: Actualizar Variables en Railway

Una vez que funcione localmente:

1. Ve a Railway → BACKEND → "Variables"
2. Actualiza o agrega:
   - `DATABASE_URL` = (la misma que usaste en .env)
   - `JWT_SECRET` = (el mismo que usaste en .env)
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = `https://naorifas.netlify.app`

## 📋 Paso 6: Hacer Commit y Push

```powershell
# Desde la raíz del proyecto
git add .
git commit -m "Configuración completa del backend"
git push origin main
```

Railway detectará los cambios y redesplegará automáticamente.

## ✅ Checklist

- [ ] DATABASE_URL copiada de Railway
- [ ] Archivo .env creado con valores correctos
- [ ] `npm run prisma:generate` ejecutado sin errores
- [ ] `npm run prisma:migrate` ejecutado sin errores
- [ ] `npx tsx src/scripts/seed.ts` ejecutado (admin creado)
- [ ] `npm run dev` ejecutado y servidor corriendo
- [ ] `/health` funciona en el navegador
- [ ] Login funciona (puedes obtener token)
- [ ] Variables actualizadas en Railway
- [ ] Commit y push realizado

## 🆘 Si algo falla

**Error: "Cannot connect to database"**
- Verifica que la DATABASE_URL sea correcta
- Verifica que no tenga espacios extra
- Verifica que el servicio DATABASE esté "Online" en Railway

**Error: "Prisma Client not generated"**
- Ejecuta: `npm run prisma:generate`

**Error: "Migration failed"**
- Verifica que la DATABASE_URL sea correcta
- Verifica que el servicio DATABASE esté "Online"

**El servidor no inicia**
- Verifica que el puerto 3001 no esté en uso
- Revisa los errores en la consola

## 🎉 ¡Listo!

Si todos los pasos están completos, tu backend debería funcionar tanto localmente como en Railway.

