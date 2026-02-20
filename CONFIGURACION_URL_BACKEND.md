# ✅ Configuración con tu URL de Railway

## 🌐 Tu URL del Backend

```
https://paginas-production.up.railway.app
```

---

## ✅ Paso 1: Verificar que el Backend Funciona

Prueba el health check en tu navegador o con curl:

```
https://paginas-production.up.railway.app/health
```

**Debería responder:**
```json
{"status":"ok","timestamp":"2024-..."}
```

Si funciona ✅, continúa. Si no funciona ❌, revisa los logs en Railway.

---

## ✅ Paso 2: Configurar Variables de Entorno del Backend

En Railway → Tu Servicio → Variables, asegúrate de tener:

### Variables Requeridas:
```env
DATABASE_URL=<ya configurada por Railway>
JWT_SECRET=<tu clave secreta>
GEMINI_API_KEY=<tu API key de Gemini>
NODE_ENV=production
```

### Variables Opcionales (para CORS):
Si vas a desplegar el frontend y admin panel, agrega:

```env
FRONTEND_URL=https://tu-frontend-desplegado.com
ADMIN_PANEL_URL=https://tu-admin-desplegado.com
```

**Nota:** Si aún no tienes el frontend/admin desplegados, puedes dejarlas sin configurar por ahora. El backend funcionará igual.

---

## ✅ Paso 3: Configurar el Frontend

### Opción A: Desarrollo Local

Crea un archivo `.env.local` en la raíz del proyecto frontend:

```env
VITE_API_URL=https://paginas-production.up.railway.app/api
```

### Opción B: Si despliegas el Frontend (Vercel, Netlify, etc.)

En la plataforma de hosting, agrega la variable de entorno:

**Nombre:** `VITE_API_URL`  
**Valor:** `https://paginas-production.up.railway.app/api`

---

## ✅ Paso 4: Configurar el Admin Panel

Si despliegas el admin panel, crea `.env` en `admin-panel/`:

```env
VITE_API_URL=https://paginas-production.up.railway.app/api
```

O en la plataforma de hosting, agrega la misma variable.

---

## 🧪 Pruebas Rápidas

### 1. Health Check
```bash
curl https://paginas-production.up.railway.app/health
```

### 2. Listar Rifas
```bash
curl https://paginas-production.up.railway.app/api/raffles
```

### 3. Login Admin (después del seed)
```bash
curl -X POST https://paginas-production.up.railway.app/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rifasnao.com","password":"admin123456"}'
```

---

## 📝 Resumen de URLs

| Servicio | URL |
|----------|-----|
| **Backend API** | `https://paginas-production.up.railway.app` |
| **API Endpoints** | `https://paginas-production.up.railway.app/api` |
| **Health Check** | `https://paginas-production.up.railway.app/health` |

---

## 🔧 Próximos Pasos

1. ✅ Verifica que el health check funcione
2. ✅ Configura las variables de entorno del backend (JWT_SECRET, GEMINI_API_KEY)
3. ✅ Ejecuta las migraciones y seed en Railway (terminal)
4. ✅ Configura `VITE_API_URL` en el frontend
5. ✅ Prueba el frontend conectándose al backend

---

## 🐛 Si algo no funciona

### El health check no responde:
- Verifica que el servicio esté "Online" (punto verde)
- Revisa los logs en Railway → Deployments → View Logs
- Verifica que el puerto esté configurado correctamente (3001)

### Error de CORS:
- Agrega las URLs del frontend/admin en las variables de entorno del backend
- Reinicia el servicio después de agregar las variables

### Error 404:
- Asegúrate de usar `/api` antes de las rutas
- Ejemplo: `https://paginas-production.up.railway.app/api/raffles` ✅
- NO: `https://paginas-production.up.railway.app/raffles` ❌




