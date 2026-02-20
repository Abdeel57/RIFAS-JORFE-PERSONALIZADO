# 🔧 Solución: Railway Detecta el Proyecto como Sitio Estático

## ❌ Problema Identificado

Railway está detectando tu proyecto como un **sitio estático de Vite** y está usando **Caddy** para servir archivos, NO está ejecutando el **backend Node.js**.

**Evidencia en los logs:**
```
↳ Deploying as vite static site
↳ Output directory: dist
Deploy: $ caddy run --config /Caddyfile
```

**Debería mostrar:**
```
Build: npm install && npm run prisma:generate && npm run build
Deploy: npm start
```

## ✅ Solución: Configurar Root Directory

Railway necesita saber que este servicio es el **BACKEND**, no un sitio estático.

### Paso 1: Configurar Root Directory en Railway

1. **Railway → Tu Proyecto**
2. **Click en el servicio Backend (PAGINAS-)**
3. **Click en "Settings"** (icono de engranaje ⚙️)
4. Busca la sección **"Source"** o **"Repository"**
5. Busca **"Root Directory"** o **"Working Directory"**
6. Configura: `backend`
7. **Guarda los cambios**

### Paso 2: Verificar Build Command y Start Command

Después de configurar Root Directory:

**Railway → Backend → Settings → Build**

**Build Command debe ser:**
```
npm install && npm run prisma:generate && npm run clean && npm run build
```

**Start Command debe ser:**
```
npm start
```

### Paso 3: Forzar un Nuevo Deploy

1. **Railway → Backend → Deployments**
2. **Click en "Redeploy"**
3. **Espera 2-3 minutos**

### Paso 4: Verificar los Logs

**Railway → Backend → Logs**

Ahora deberías ver:
```
🔍 Iniciando servidor Express...
PORT: 3001
🔧 Configurando CORS...
✅ CORS configurado para permitir todos los orígenes
🚀 Server running on http://0.0.0.0:3001
```

**NO deberías ver:**
```
Deploying as vite static site
caddy run
```

---

## 🔍 Dónde Encontrar Root Directory

Si no encuentras "Root Directory" en Settings:

1. **Settings → Source** → Busca "Root Directory"
2. **Settings → General** → Busca "Root Directory"  
3. **Settings → Deploy** → Busca "Root Directory"
4. Al crear el servicio → Busca "Configure" → "Root Directory"

---

## 📋 Checklist

- [ ] Root Directory configurado como `backend`
- [ ] Build Command: `npm install && npm run prisma:generate && npm run clean && npm run build`
- [ ] Start Command: `npm start`
- [ ] Redeploy hecho después de configurar Root Directory
- [ ] Logs muestran "🔍 Iniciando servidor Express..." (NO "caddy run")

---

## 🎯 Resumen

**El problema:** Railway está detectando el proyecto como sitio estático porque no sabe que es el backend.

**La solución:** Configurar **Root Directory** como `backend` en Railway Settings.

**Pasos:**
1. Railway → Backend → Settings → Root Directory → `backend`
2. Guardar cambios
3. Redeploy
4. Verificar logs (deben mostrar mensajes del backend Node.js)

¡Una vez configurado el Root Directory, Railway ejecutará el backend correctamente!




