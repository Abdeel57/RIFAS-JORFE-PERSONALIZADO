# 🔧 Forzar Railway a Usar Node.js en Lugar de Caddy

## ❌ Problema Actual

Railway está usando **Caddy** (servidor estático) en lugar de ejecutar el **backend Node.js**.

## ✅ Solución: Configuración Manual en Railway

### Paso 1: Ir a Settings del Backend

1. **Railway → Tu Proyecto**
2. **Click en el servicio Backend (PAGINAS-)**
3. **Click en "Settings"** (icono de engranaje ⚙️)

### Paso 2: Configurar Build Command Manualmente

**Settings → Build** (o busca "Build Command")

**Configura manualmente:**
```
npm install && npm run prisma:generate && npm run clean && npm run build
```

### Paso 3: Configurar Start Command Manualmente

**Settings → Deploy** (o busca "Start Command")

**Configura manualmente:**
```
npm start
```

**IMPORTANTE:** Asegúrate de que NO diga `caddy run` o cualquier cosa relacionada con Caddy.

### Paso 4: Verificar Root Directory

**Settings → Source** (o "Repository")

**Root Directory debe ser:**
```
backend
```

(Solo la palabra "backend", sin rutas completas)

### Paso 5: Guardar y Redeploy

1. **Guarda todos los cambios** (click en "Save" o "Update")
2. **Railway → Backend → Deployments**
3. **Click en "Redeploy"**
4. **Espera 2-3 minutos**

### Paso 6: Verificar Logs

**Railway → Backend → Logs**

**✅ Deberías ver:**
```
🔍 Iniciando servidor Express...
PORT: 3001
🔧 Configurando CORS...
✅ CORS configurado para permitir todos los orígenes
🚀 Server running on http://0.0.0.0:3001
```

**❌ NO deberías ver:**
```
server running (Caddy)
started background certificate maintenance
```

---

## 🚨 Si Railway Sigue Usando Caddy

### Opción A: Eliminar Detección Automática

1. **Railway → Backend → Settings → Build**
2. **Desactiva "Auto-detect"** o cualquier opción de detección automática
3. **Configura manualmente** Build Command y Start Command
4. **Guarda y redeploy**

### Opción B: Verificar que No Haya Archivos que Confundan a Railway

Railway puede detectar el proyecto como sitio estático si hay:
- `vite.config.ts` en la raíz (ya lo hay, pero está bien porque Root Directory es `backend`)
- `package.json` con scripts de Vite en la raíz (ya lo hay, pero está bien porque Root Directory es `backend`)

Como Root Directory es `backend`, Railway debería ignorar estos archivos.

### Opción C: Usar Procfile Explícitamente

Railway debería detectar automáticamente el `Procfile` en `backend/Procfile`, pero si no lo hace:

1. **Railway → Backend → Settings → Deploy**
2. **Start Command:** `web: npm run prisma:migrate && npm start`
3. **Guarda y redeploy**

---

## 📋 Checklist Final

- [ ] Root Directory = `backend` (solo, sin rutas)
- [ ] Build Command = `npm install && npm run prisma:generate && npm run clean && npm run build`
- [ ] Start Command = `npm start` (NO `caddy run`)
- [ ] Auto-detect desactivado (si existe la opción)
- [ ] Cambios guardados
- [ ] Redeploy hecho
- [ ] Logs muestran mensajes del backend Node.js

---

## 🎯 Resumen

**El problema:** Railway está usando Caddy en lugar de Node.js.

**La solución:** Configurar manualmente Build Command y Start Command en Railway Settings, asegurándote de que Start Command sea `npm start` y NO `caddy run`.

¡Una vez configurado correctamente, Railway ejecutará el backend Node.js!




