# Solución: Variables de Entorno No Se Cargan

## 🔴 Problema Detectado

El archivo `.env` existe pero las variables `DATABASE_URL` y `JWT_SECRET` no se están cargando.

## 🔍 Causas Posibles

1. **El archivo .env está vacío**
2. **El archivo .env tiene formato incorrecto**
3. **Las variables tienen espacios o comillas incorrectas**
4. **El archivo .env está en la ubicación incorrecta**

## ✅ Solución Paso a Paso

### Paso 1: Verificar Ubicación del Archivo

El archivo `.env` debe estar en:
```
backend/.env
```

NO en:
- `backend/src/.env`
- `backend/dist/.env`
- Raíz del proyecto

### Paso 2: Verificar Formato del Archivo .env

El archivo `.env` debe tener este formato exacto:

```env
DATABASE_URL="postgresql://usuario:password@host:puerto/database?schema=public"
JWT_SECRET="tu-clave-secreta-de-al-menos-32-caracteres-aqui"
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

**⚠️ IMPORTANTE:**
- Cada variable en una línea separada
- Sin espacios antes o después del `=`
- Las comillas son opcionales pero recomendadas
- Sin líneas vacías al inicio
- Sin comentarios con `#` que rompan el formato

### Paso 3: Crear/Corregir el Archivo .env

1. **Abre el archivo `backend/.env` en tu editor**
2. **Asegúrate de que tenga este contenido (reemplaza los valores):**

```env
DATABASE_URL="postgresql://usuario:password@host:puerto/database?schema=public"
JWT_SECRET="b4068b28f0cc85e50c962ba40edc59e436b4bc0cd4fb15d786bb33ead442a03c"
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

3. **Guarda el archivo**

### Paso 4: Obtener DATABASE_URL de Railway

1. Ve a Railway → DATABASE → "Variables"
2. Busca `DATABASE_URL`
3. Copia el valor completo
4. Pégalo en tu archivo `.env` reemplazando `DATABASE_URL_DE_RAILWAY`

### Paso 5: Verificar que se Carguen

Ejecuta este comando para verificar:

```powershell
node -e "require('dotenv').config(); console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'OK' : 'FALTA'); console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'OK' : 'FALTA');"
```

Deberías ver:
```
DATABASE_URL: OK
JWT_SECRET: OK
```

## 🐛 Problemas Comunes

### El archivo .env tiene espacios extra

**Incorrecto:**
```env
DATABASE_URL = "valor"
 JWT_SECRET="valor"
```

**Correcto:**
```env
DATABASE_URL="valor"
JWT_SECRET="valor"
```

### El archivo .env tiene caracteres especiales incorrectos

Asegúrate de usar comillas dobles `"` y no comillas curvas `"` o `"`

### El archivo .env está en la ubicación incorrecta

Verifica que esté en `backend/.env` y no en otra carpeta.

## ✅ Después de Corregir

Una vez que el archivo `.env` esté correcto:

1. **Ejecuta migraciones:**
   ```powershell
   npm run prisma:migrate
   ```

2. **Crea el administrador:**
   ```powershell
   npx tsx src/scripts/seed.ts
   ```

3. **Ejecuta el servidor:**
   ```powershell
   npm run dev
   ```

## 🆘 Si Aún No Funciona

Comparte:
1. **Las primeras 5 líneas del archivo .env** (oculta valores sensibles)
2. **El resultado del comando de verificación**
3. **Cualquier error que veas al ejecutar `npm run dev`**


