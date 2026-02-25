# 🔍 Verificar Login del Administrador

## 📋 Credenciales por Defecto

Según el archivo `backend/src/scripts/seed.ts`, las credenciales son:

- **Email:** `admin@rifasnao.com`
- **Password:** `admin123456`

## 🔍 Pasos para Diagnosticar el Problema

### 1. Verificar si el Admin Existe en la Base de Datos

**Opción A: Desde tu máquina local (si tienes acceso a la BD de Railway)**

```bash
cd backend
npm run check:admin
```

Este script verificará si hay administradores en la base de datos.

**Opción B: Verificar en Railway**

1. Ve a tu servicio de **Database** en Railway
2. Abre la pestaña **Connect**
3. Usa las credenciales para conectarte con un cliente PostgreSQL
4. Ejecuta esta consulta:

```sql
SELECT id, email, name, role, "createdAt" FROM "Admin";
```

### 2. Si NO hay Admin en la BD

El seed no se ejecutó. Necesitas ejecutarlo manualmente:

**Desde tu máquina local:**

```bash
cd backend
# Configura DATABASE_URL con la URL de Railway
export DATABASE_URL="postgresql://postgres:BmfvUrloTOTrEQraIAdFIJjHXlCdLQub@yamabiko.proxy.rlwy.net:33083/railway"
npx tsx src/scripts/seed.ts
```

O usa el script de Railway:

```bash
npm run railway:setup
```

### 3. Verificar los Logs del Backend en Railway

1. Ve a tu servicio de **Backend** en Railway
2. Abre la pestaña **Deployments** → **View Logs**
3. Intenta hacer login desde el admin panel
4. Busca los logs que empiezan con:
   - `Login attempt started`
   - `Email parsed`
   - `Admin query result`
   - `Password comparison result`
   - `Login successful` o `Login error`

### 4. Verificar Variables de Entorno en Railway

Asegúrate de que estas variables estén configuradas en Railway:

- `DATABASE_URL` - URL de conexión a PostgreSQL
- `JWT_SECRET` - Secret para firmar tokens (mínimo 32 caracteres)
- `JWT_EXPIRES_IN` - Tiempo de expiración (default: 7d)
- `ADMIN_PANEL_URL` - URL del admin panel (ej: `https://fantastic-amazement-production.up.railway.app`)
- `FRONTEND_URL` - URL del frontend
- `NODE_ENV` - Debe ser `production`

## 🐛 Problemas Comunes

### Error: "Invalid credentials"

**Causas posibles:**
1. El admin no existe en la BD (el seed no se ejecutó)
2. El email o password son incorrectos
3. El hash de la contraseña no coincide (problema con bcrypt)

**Solución:**
- Verifica que el admin exista con `npm run check:admin`
- Si no existe, ejecuta el seed
- Asegúrate de usar exactamente: `admin@rifasnao.com` y `admin123456`

### Error: "No token provided" o problemas con JWT

**Causas posibles:**
1. `JWT_SECRET` no está configurado o es muy corto
2. Error al generar el token

**Solución:**
- Verifica que `JWT_SECRET` tenga al menos 32 caracteres
- Revisa los logs del backend para ver si hay errores al generar el token

### Error de CORS

**Causas posibles:**
1. `ADMIN_PANEL_URL` no está configurado correctamente
2. El backend no está permitiendo el origen del admin panel

**Solución:**
- Verifica que `ADMIN_PANEL_URL` sea la URL completa del admin panel en Railway
- El backend está configurado para permitir todos los orígenes (`origin: true`), así que esto no debería ser un problema

## 📝 Próximos Pasos

1. **Intenta hacer login** con las credenciales: `admin@rifasnao.com` / `admin123456`
2. **Revisa los logs del backend** en Railway para ver qué está pasando
3. **Ejecuta `npm run check:admin`** para verificar si el admin existe
4. Si el admin no existe, **ejecuta el seed** para crearlo

Los logs de debug te mostrarán exactamente qué está pasando en cada paso del proceso de login.





