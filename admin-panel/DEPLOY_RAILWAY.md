# 🚀 Desplegar Admin Panel en Railway

## 📋 Pasos para Desplegar

### Paso 1: Crear Nuevo Servicio en Railway

1. Ve a tu proyecto en Railway
2. Click en **"+ New"**
3. Selecciona **"GitHub Repo"** o **"Empty Service"**
4. Si usas GitHub Repo, selecciona el mismo repositorio: `PAGINAS-`

### Paso 2: Configurar el Servicio

#### Root Directory:
```
admin-panel
```

#### Build Command:
```
npm install && npm run build
```

#### Start Command:
```
npm run preview
```

### Paso 3: Configurar Variables de Entorno

Railway → Tu Servicio Admin Panel → **"Variables"**:

```env
VITE_API_URL=https://paginas-production.up.railway.app/api
PORT=5174
```

**Nota:** Railway asignará automáticamente un puerto, pero puedes especificar uno.

### Paso 4: Configurar Networking

1. Railway → Tu Servicio → **"Settings"** → **"Networking"**
2. En "Generate Service Domain", ingresa el puerto: `5174` (o el que Railway asigne)
3. Click en **"Generate Domain"**

Railway generará una URL como:
```
https://tu-admin-panel.up.railway.app
```

### Paso 5: Actualizar CORS en el Backend

Para que el admin panel pueda conectarse al backend:

1. Ve a Railway → Tu Servicio Backend → **"Variables"**
2. Agrega o actualiza:
   ```env
   ADMIN_PANEL_URL=https://tu-admin-panel.up.railway.app
   ```
3. Reinicia el servicio backend

---

## ✅ Verificación

Después del deploy:

1. **Accede a la URL** que Railway generó:
   ```
   https://tu-admin-panel.up.railway.app
   ```

2. **Login con:**
   - Email: `admin@rifasnao.com`
   - Password: `admin123456`

3. **Verifica que puedas:**
   - Ver el dashboard
   - Acceder a las rifas
   - Ver compras y usuarios

---

## 🔧 Configuración Completa

### Backend (Railway)
- URL: `https://paginas-production.up.railway.app`
- Variables:
  ```env
  DATABASE_URL=<configurada>
  JWT_SECRET=<configurada>
  NODE_ENV=production
  ADMIN_PANEL_URL=https://tu-admin-panel.up.railway.app
  ```

### Admin Panel (Railway)
- URL: `https://tu-admin-panel.up.railway.app` (Railway la generará)
- Variables:
  ```env
  VITE_API_URL=https://paginas-production.up.railway.app/api
  ```

---

## 📝 Checklist

- [ ] Nuevo servicio creado en Railway para admin panel
- [ ] Root Directory configurado como `admin-panel`
- [ ] Build Command configurado
- [ ] Start Command configurado como `npm run preview`
- [ ] Variable `VITE_API_URL` configurada
- [ ] Dominio público generado
- [ ] `ADMIN_PANEL_URL` agregada en el backend
- [ ] Backend reiniciado
- [ ] Admin panel accesible desde la web
- [ ] Login funcionando

---

## 🎉 ¡Listo!

Una vez completado, podrás acceder al admin panel desde cualquier lugar usando la URL que Railway genere.




