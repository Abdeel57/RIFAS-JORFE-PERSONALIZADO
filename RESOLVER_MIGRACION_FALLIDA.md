# Resolver migración fallida en Railway

Si el backend falla con **P3009** (migración fallida), hay que marcar la migración como "rolled back" para que Prisma pueda volver a intentarla.

## Paso 1: Marcar la migración como resuelta (rolled back)

En **Railway** → **BACKEND** → **Settings** → **Variables**, asegúrate de tener `DATABASE_URL`.

Luego, en **Railway** → **BACKEND** → **Deployments** → abre la **Terminal** del último deployment y ejecuta:

```bash
npx prisma migrate resolve --rolled-back 20260226130000_add_payment_settings_fields
```

O desde tu máquina (con `DATABASE_URL` configurada):

```bash
cd backend
set DATABASE_URL=<tu-database-url-de-railway>
npx prisma migrate resolve --rolled-back 20260226130000_add_payment_settings_fields
```

## Paso 2: Redeploy

Después de marcar la migración como rolled back, haz un nuevo deploy del backend (push o redeploy manual). La migración se ejecutará de nuevo y debería completarse correctamente.
