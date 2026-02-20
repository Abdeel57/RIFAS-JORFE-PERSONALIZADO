# 🚀 Pasos Simples para Desplegar Admin Panel en Railway

## ✅ Pasos Rápidos (Sin Root Directory)

### Paso 1: Crear Nuevo Servicio

1. Ve a Railway → Tu Proyecto
2. Click en **"+ New"**
3. Selecciona **"GitHub Repo"**
4. Elige tu repositorio: `PAGINAS-`

### Paso 2: Configurar Build y Start Commands

Railway → Tu Servicio → **"Settings"** → Busca **"Build"** o **"Deploy"**

**Build Command:**
```bash
cd admin-panel && npm install && npm run build
```

**Start Command:**
```bash
cd admin-panel && npm run preview
```

**Nota:** Si no ves estas opciones, Railway debería detectar automáticamente el archivo `railway.json` que ya está configurado.

### Paso 3: Agregar Variable de Entorno

Railway → Tu Servicio → **"Variables"** (pestaña superior)

Agrega:
```env
VITE_API_URL=https://paginas-production.up.railway.app/api
```

### Paso 4: Generar Dominio Público

Railway → Tu Servicio → **"Settings"** → **"Networking"**

Click en **"Generate Domain"** o **"Generate Public Domain"**

Railway generará una URL como:
```
https://tu-admin-panel.up.railway.app
```

### Paso 5: Actualizar Backend (CORS)

Railway → Tu Servicio Backend → **"Variables"**

Agrega o actualiza:
```env
ADMIN_PANEL_URL=https://tu-admin-panel.up.railway.app
```

(Reemplaza con la URL que Railway genere para el admin panel)

Reinicia el backend después de agregar esta variable.

---

## 🔍 Dónde Están las Configuraciones en Railway

### Si no encuentras "Root Directory":

**No te preocupes**, Railway puede trabajar sin eso usando comandos con `cd`.

### Ubicaciones de Configuración:

1. **Build Command:**
   - Railway → Tu Servicio → **"Settings"**
   - Busca **"Build"** o **"Build Command"**
   - O en la pestaña **"Deploy"** → **"Build Settings"**

2. **Start Command:**
   - Railway → Tu Servicio → **"Settings"**
   - Busca **"Start Command"** o **"Deploy"**
   - O en la pestaña **"Deploy"** → **"Start Command"**

3. **Variables:**
   - Railway → Tu Servicio → **"Variables"** (pestaña superior, muy visible)

4. **Networking:**
   - Railway → Tu Servicio → **"Settings"** → **"Networking"**
   - O busca **"Public Domain"** o **"Generate Domain"**

---

## 📝 Comandos Exactos para Copiar

### Build Command:
```bash
cd admin-panel && npm install && npm run build
```

### Start Command:
```bash
cd admin-panel && npm run preview
```

### Variable:
```
VITE_API_URL=https://paginas-production.up.railway.app/api
```

---

## ✅ Verificación

1. Railway empezará a hacer build automáticamente
2. Revisa los **Logs** en Railway → Tu Servicio → **"Deployments"**
3. Una vez completado, verás la URL pública
4. Accede a esa URL para ver el admin panel
5. Login con: `admin@rifasnao.com` / `admin123456`

---

## 🎯 Resumen

1. ✅ Crear servicio desde GitHub Repo
2. ✅ Build Command: `cd admin-panel && npm install && npm run build`
3. ✅ Start Command: `cd admin-panel && npm run preview`
4. ✅ Variable: `VITE_API_URL=https://paginas-production.up.railway.app/api`
5. ✅ Generar dominio público
6. ✅ Agregar `ADMIN_PANEL_URL` en el backend
7. ✅ ¡Listo!

**No necesitas Root Directory**, los comandos con `cd` funcionan perfectamente.




