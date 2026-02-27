# Resolver migración fallida en Railway

Si el backend falla con **P3009** (migración fallida), hay que marcar la migración como "rolled back" para que Prisma pueda volver a intentarla. Como Railway no ofrece terminal, se hace desde tu PC con la **DATABASE_URL** de Railway.

## Paso 1: Copiar DATABASE_URL desde Railway

1. Entra en **Railway** → tu proyecto → **BACKEND** (o el servicio de PostgreSQL).
2. Ve a **Variables** (o **Connect** en la base de datos).
3. Copia el valor de **DATABASE_URL** (PostgreSQL connection string).

## Paso 2: Ejecutar el script desde tu PC

1. En Railway → **Variables** → copia el valor completo de **DATABASE_URL** (clic en el valor para copiar).
2. Abre **PowerShell** o **CMD** en tu PC.
3. En la terminal, ve a la carpeta **backend** de tu proyecto (ej. `cd ruta\al\proyecto\backend`) y ejecuta (pega tu URL donde dice PEGA_AQUI_TU_DATABASE_URL):

**PowerShell (recomendado):**
```powershell
cd backend
$env:DATABASE_URL="PEGA_AQUI_TU_DATABASE_URL"
npm run resolve-migration
```

**CMD:**
```cmd
cd backend
set DATABASE_URL=PEGA_AQUI_TU_DATABASE_URL
npm run resolve-migration
```

- Sustituye `PEGA_AQUI_TU_DATABASE_URL` por la URL que copiaste (empieza por `postgresql://`).
- En PowerShell, si la URL tiene `&` o caracteres raros, usa comillas simples: `$env:DATABASE_URL='postgresql://...'`

Si todo va bien verás: **`✅ Migración "20260226130000_add_payment_settings_fields" marcada como rolled back.`**

## Paso 3: Redeploy en Railway

Haz un **Redeploy** del backend en Railway (Deployments → ⋮ → Redeploy, o un nuevo push). La migración se volverá a ejecutar y debería aplicarse bien.
