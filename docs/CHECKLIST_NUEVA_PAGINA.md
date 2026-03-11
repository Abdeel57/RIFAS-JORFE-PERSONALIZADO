# Checklist: Nueva página (nuevo despliegue)

Cuando creas una **nueva página** (nuevo proyecto en Railway), sigue estos pasos para que las tablas se creen y el admin funcione.

---

## 1. Crear el proyecto en Railway

- **Deploy from Template** o **Deploy from GitHub** (conecta el repo).
- Añade **PostgreSQL**: New → Database → Add PostgreSQL.
- Railway genera automáticamente `DATABASE_URL` y la vincula al servicio.

---

## 2. Variables de entorno obligatorias

En el servicio (backend), configura:

| Variable      | Requerida | Descripción                                      |
|---------------|-----------|--------------------------------------------------|
| `DATABASE_URL`| Sí        | Se genera al añadir PostgreSQL (referencia)      |
| `JWT_SECRET`  | Sí        | Mínimo 32 caracteres (genera uno nuevo por proyecto) |
| `NODE_ENV`    | Recomendado | `production`                                  |

**Generar JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 3. Configuración del build en Railway

### Si usas Dockerfile (raíz del repo)

- **Root Directory**: vacío o raíz del proyecto.
- **Dockerfile Path**: `Dockerfile` (por defecto).
- El `startup.sh` ya ejecuta migraciones y seed al iniciar.

### Si usas Nixpacks (Root Directory = `backend`)

- **Root Directory**: `backend`
- El `nixpacks.toml` ya incluye migraciones y seed en el comando de inicio.

**Importante:** No sobrescribas el **Start Command** en Railway. Déjalo por defecto para que use el del Dockerfile o Nixpacks.

---

## 4. Orden al iniciar (automático)

En cada arranque del servicio se ejecuta:

1. `prisma migrate deploy` → crea/actualiza tablas
2. `node dist/scripts/seed.js` → crea admin si no existe
3. `node dist/index.js` → inicia el servidor

---

## 5. Si las tablas no se crean

### Opción A: Revisar logs

En Railway → Tu servicio → **Deployments** → último deploy → **View Logs**.

Busca en los logs:

- `DATABASE_URL_SET=true`
- `=== STARTUP: migrate ok ===`
- `=== STARTUP: seed ok ===`

Si no aparecen, `DATABASE_URL` puede no estar configurada o el build no está usando el Dockerfile correcto.

### Opción B: Ejecutar manualmente (Railway CLI)

```bash
# Instalar CLI si no la tienes
npm i -g @railway/cli

# Conectar al proyecto
railway login
cd backend
railway link   # elige el proyecto y servicio

# Crear tablas
railway run npx prisma migrate deploy

# Crear admin
railway run npx tsx src/scripts/seed.ts
```

---

## 6. Credenciales del admin

Tras el seed:

- **Usuario:** `Bismark`
- **Contraseña:** `admin123`

---

## 7. Verificar que todo esté bien

1. **Health check:** `https://tu-url.up.railway.app/health`
2. **Diagnóstico admin:** `https://tu-url.up.railway.app/api/admin/auth/check`
3. **Login:** `https://tu-url.up.railway.app/admin`
   - Usuario: `Bismark`
   - Contraseña: `admin123`

---

## Resumen rápido

| Paso | Acción |
|------|--------|
| 1 | Crear proyecto + PostgreSQL |
| 2 | Configurar `DATABASE_URL` (referencia) y `JWT_SECRET` (32+ chars) |
| 3 | No sobrescribir Start Command en Railway |
| 4 | Esperar al deploy; migraciones y seed se ejecutan al iniciar |
| 5 | Si falla, usar Railway CLI para ejecutar migraciones y seed manualmente |
