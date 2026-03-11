# Cómo ejecutar migraciones en Railway

## Paso 1: Instalar Railway CLI (ya hecho)

```bash
npm install -g @railway/cli
```

---

## Paso 2: Iniciar sesión

Abre una terminal y ejecuta:

```bash
railway login
```

Se abrirá el navegador para que inicies sesión con tu cuenta de Railway.

---

## Paso 3: Vincular tu proyecto

**IMPORTANTE:** Siempre ejecuta los comandos desde la carpeta `backend`:

```bash
cd backend
railway link
```

Te preguntará:
1. **¿Qué proyecto?** → Elige el proyecto de la nueva página
2. **¿Qué servicio?** → Elige el servicio (backend/API)

---

## Paso 4: Ejecutar migraciones y seed

### Opción A: Script automático (Windows PowerShell)

```powershell
cd backend
.\migrar-railway.ps1
```

### Opción B: Comandos manuales

```bash
cd backend    # ← OBLIGATORIO: Prisma está aquí

# Crear tablas en la base de datos
railway run npx prisma migrate deploy

# Crear usuario admin
railway run npx tsx src/scripts/seed.ts
```

---

## Resumen

| Paso | Comando |
|------|---------|
| 1 | `railway login` |
| 2 | `cd backend` |
| 3 | `railway link` (elegir proyecto y servicio) |
| 4 | `railway run npx prisma migrate deploy` |
| 5 | `railway run npx tsx src/scripts/seed.ts` |

O usa el script: `.\migrar-railway.ps1`

---

## Credenciales del admin

- **Usuario:** Bismark
- **Contraseña:** admin123

---

## Si algo falla

- **"Not logged in"** → Ejecuta `railway login`
- **"No project linked"** → Ejecuta `railway link` y elige el proyecto
- **"DATABASE_URL"** → Verifica que PostgreSQL esté añadido al proyecto en Railway
