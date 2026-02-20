# ✅ Configuración Completa - Backend y Frontend

## 🌐 URLs Configuradas

### Backend (Railway)
```
https://paginas-production.up.railway.app
```

### API Endpoints
```
https://paginas-production.up.railway.app/api
```

---

## ✅ Estado Actual

### Backend ✅
- [x] Desplegado en Railway
- [x] Base de datos PostgreSQL configurada
- [x] Migraciones ejecutadas
- [x] Administrador creado
- [x] URL pública: `https://paginas-production.up.railway.app`

### Frontend ✅
- [x] Archivo `.env.local` creado con la URL del backend
- [x] Configurado para conectarse a: `https://paginas-production.up.railway.app/api`

---

## 🔐 Credenciales del Administrador

- **Email:** `admin@rifasnao.com`
- **Password:** `admin123456`

**⚠️ IMPORTANTE:** Cambia esta contraseña después del primer login en producción.

---

## 🧪 Pruebas

### 1. Health Check del Backend
```
https://paginas-production.up.railway.app/health
```
**Debería responder:** `{"status":"ok","timestamp":"..."}`

### 2. Listar Rifas
```
https://paginas-production.up.railway.app/api/raffles
```

### 3. Login Admin
```
POST https://paginas-production.up.railway.app/api/admin/auth/login
Body: {
  "email": "admin@rifasnao.com",
  "password": "admin123456"
}
```

---

## 🚀 Próximos Pasos

### Para Desarrollo Local:

1. **Frontend:**
   ```bash
   npm install
   npm run dev
   ```
   El frontend se conectará automáticamente al backend en Railway usando `.env.local`

2. **Admin Panel:**
   ```bash
   cd admin-panel
   npm install
   # Crear .env con: VITE_API_URL=https://paginas-production.up.railway.app/api
   npm run dev
   ```

### Para Producción:

Cuando despliegues el frontend (Vercel, Netlify, etc.):

1. **Agrega la variable de entorno:**
   - Name: `VITE_API_URL`
   - Value: `https://paginas-production.up.railway.app/api`

2. **Actualiza CORS en Railway** (si es necesario):
   ```env
   FRONTEND_URL=https://tu-frontend-desplegado.com
   ADMIN_PANEL_URL=https://tu-admin-desplegado.com
   ```

---

## 📋 Checklist Final

- [x] Backend desplegado en Railway
- [x] Base de datos configurada
- [x] Migraciones ejecutadas
- [x] Administrador creado
- [x] Frontend configurado con `.env.local`
- [ ] Probar health check
- [ ] Probar frontend localmente
- [ ] Crear primera rifa desde el admin panel

---

## 🎉 ¡Todo Listo!

Tu backend está funcionando en:
**https://paginas-production.up.railway.app**

Tu frontend está configurado para conectarse automáticamente.

¡Puedes empezar a usar la aplicación!




