# 🔐 Variables de Entorno - Backend y Frontend

## 📦 BACKEND (Railway)

### Variables REQUERIDAS (Obligatorias)

Estas variables **DEBES** configurarlas en Railway para que el backend funcione:

```env
DATABASE_URL=<Railway lo genera automáticamente cuando creas PostgreSQL>
JWT_SECRET=<genera una clave secreta de mínimo 32 caracteres>
GEMINI_API_KEY=<tu API key de Google Gemini>
NODE_ENV=production
```

### Variables OPCIONALES (Recomendadas)

Estas variables mejoran la configuración pero tienen valores por defecto:

```env
PORT=3001
FRONTEND_URL=https://tu-frontend-desplegado.com
ADMIN_PANEL_URL=https://tu-admin-panel-desplegado.com
JWT_EXPIRES_IN=7d
```

---

## 🎨 FRONTEND (Vite/React)

### Variables OPCIONALES

El frontend solo necesita **UNA** variable si quieres cambiar la URL del API:

```env
VITE_API_URL=https://tu-backend.up.railway.app/api
```

**Nota**: Si no configuras esta variable, el frontend intentará conectarse a `http://localhost:3001/api` (solo funciona en desarrollo local).

---

## 📝 Guía de Configuración Paso a Paso

### 1. BACKEND en Railway

#### Paso 1: Obtener JWT_SECRET

Genera una clave secreta segura ejecutando en tu terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia el resultado (será una cadena de 64 caracteres hexadecimales).

#### Paso 2: Obtener GEMINI_API_KEY

1. Ve a https://makersuite.google.com/app/apikey
2. Crea una nueva API key o usa una existente
3. Copia la clave

#### Paso 3: Configurar en Railway

1. Ve a tu servicio backend en Railway
2. Click en la pestaña **"Variables"**
3. Agrega las siguientes variables:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `DATABASE_URL` | ✅ Ya está (Railway la genera) | URL de conexión a PostgreSQL |
| `JWT_SECRET` | `<pega el valor generado>` | Clave secreta para tokens JWT |
| `GEMINI_API_KEY` | `<tu API key de Gemini>` | API key de Google Gemini AI |
| `NODE_ENV` | `production` | Entorno de ejecución |
| `PORT` | `3001` | Puerto del servidor (opcional) |
| `FRONTEND_URL` | `https://tu-frontend.com` | URL del frontend (para CORS) |
| `ADMIN_PANEL_URL` | `https://tu-admin-panel.com` | URL del admin panel (para CORS) |

**Ejemplo de cómo se ven en Railway:**

```
DATABASE_URL = postgresql://postgres:password@host:5432/railway
JWT_SECRET = a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
GEMINI_API_KEY = AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NODE_ENV = production
FRONTEND_URL = https://tu-frontend.vercel.app
ADMIN_PANEL_URL = https://tu-admin.vercel.app
```

#### Paso 4: Obtener URL del Backend

Después de desplegar, Railway te dará una URL como:
```
https://tu-backend.up.railway.app
```

**Copia esta URL** - la necesitarás para el frontend.

---

### 2. FRONTEND (Vite)

#### Opción A: Con archivo .env.local (Recomendado para desarrollo)

Crea un archivo `.env.local` en la raíz del proyecto frontend:

```env
VITE_API_URL=https://tu-backend.up.railway.app/api
```

#### Opción B: Configurar en plataforma de hosting (Vercel, Netlify, etc.)

Si despliegas el frontend en Vercel, Netlify u otra plataforma:

1. Ve a la configuración de tu proyecto
2. Busca la sección "Environment Variables" o "Variables de Entorno"
3. Agrega:

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://tu-backend.up.railway.app/api` |

**Ejemplo en Vercel:**
- Settings → Environment Variables
- Name: `VITE_API_URL`
- Value: `https://tu-backend.up.railway.app/api`
- Environment: Production, Preview, Development (marca todas)

---

## ✅ Checklist de Variables

### Backend (Railway) ✅

- [ ] `DATABASE_URL` - ✅ Ya configurada por Railway
- [ ] `JWT_SECRET` - Generada y configurada
- [ ] `GEMINI_API_KEY` - Configurada
- [ ] `NODE_ENV` - Configurada como `production`
- [ ] `FRONTEND_URL` - Configurada (si tienes frontend desplegado)
- [ ] `ADMIN_PANEL_URL` - Configurada (si tienes admin desplegado)

### Frontend ✅

- [ ] `VITE_API_URL` - Configurada con la URL de tu backend en Railway

---

## 🔍 Verificación

### Verificar Backend

1. Ve a tu servicio en Railway
2. Click en "Deployments" → "View Logs"
3. Busca el mensaje: `🚀 Server running on http://0.0.0.0:3001`
4. Prueba el health check:
   ```
   https://tu-backend.up.railway.app/health
   ```
   Debería responder: `{"status":"ok","timestamp":"..."}`

### Verificar Frontend

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Network"
3. Intenta cargar una rifa
4. Verifica que las peticiones vayan a: `https://tu-backend.up.railway.app/api`

---

## 🐛 Troubleshooting

### Error: "Variables de entorno faltantes o inválidas"

**Solución:**
- Verifica que todas las variables requeridas estén configuradas
- Asegúrate de que `JWT_SECRET` tenga al menos 32 caracteres
- Verifica que `GEMINI_API_KEY` sea válida

### Error: CORS en el frontend

**Solución:**
- Configura `FRONTEND_URL` en Railway con la URL exacta de tu frontend
- Asegúrate de que no haya espacios extra en las URLs
- Reinicia el servicio backend después de agregar las variables

### Frontend no se conecta al backend

**Solución:**
- Verifica que `VITE_API_URL` esté configurada correctamente
- Asegúrate de incluir `/api` al final de la URL
- Verifica que el backend esté corriendo y accesible
- Revisa la consola del navegador para ver errores específicos

---

## 📚 Referencias

- **Railway Variables**: https://docs.railway.app/develop/variables
- **Vite Environment Variables**: https://vitejs.dev/guide/env-and-mode.html
- **Google Gemini API**: https://ai.google.dev/





