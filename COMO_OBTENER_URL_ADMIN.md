# 🌐 Cómo Obtener la URL Pública del Admin Panel en Railway

## 📍 Método 1: Desde Settings → Networking (Recomendado)

### Paso 1: Ir a Settings
1. Railway → Tu Proyecto
2. Click en el **servicio del Admin Panel**
3. Click en **"Settings"** (icono de engranaje ⚙️ en la parte superior)

### Paso 2: Ir a Networking
1. En Settings, busca la sección **"Networking"** o **"Public Domain"**
2. Deberías ver una opción para generar o ver el dominio público

### Paso 3: Generar Dominio (si no existe)
1. Si no hay dominio público aún, busca el botón:
   - **"Generate Domain"**
   - **"Generate Public Domain"**
   - **"Create Public Domain"**
2. Click en ese botón
3. Railway generará automáticamente una URL como:
   ```
   https://tu-admin-panel.up.railway.app
   ```
   o
   ```
   https://tu-admin-panel.railway.app
   ```

---

## 📍 Método 2: Desde la Vista Principal del Servicio

### Paso 1: Ver el Servicio
1. Railway → Tu Proyecto
2. Click en el **servicio del Admin Panel**

### Paso 2: Buscar la URL
1. En la parte superior del servicio, deberías ver:
   - Una sección que dice **"Domains"** o **"Networking"**
   - O directamente la URL pública si ya está generada
2. Si ves la URL, cópiala directamente

---

## 📍 Método 3: Desde el Dashboard Principal

### Paso 1: Ver Todos los Servicios
1. Railway → Tu Proyecto
2. En el dashboard principal, deberías ver todos tus servicios

### Paso 2: Buscar el Admin Panel
1. Encuentra el servicio del Admin Panel
2. Al lado del nombre del servicio, debería aparecer:
   - Un icono de "globo" o "link" 🌐
   - O directamente la URL pública

---

## 📍 Método 4: Si No Aparece Ninguna URL

### Opción A: Generar Manualmente
1. Railway → Tu Servicio Admin Panel → **Settings**
2. Busca **"Networking"** o **"Domains"**
3. Click en **"Generate Domain"** o **"Add Domain"**
4. Railway generará automáticamente una URL

### Opción B: Verificar que el Servicio Esté Desplegado
1. Asegúrate de que el servicio esté **"Active"** o **"Running"**
2. Si está en estado "Building" o "Failed", espera a que termine
3. Una vez que esté corriendo, Railway debería mostrar la URL

---

## 🔍 Dónde Buscar la URL

La URL pública generalmente aparece en:

1. **Settings → Networking**
   - Sección "Public Domain" o "Domains"
   - Botón "Generate Domain"

2. **Vista Principal del Servicio**
   - Parte superior, junto al nombre del servicio
   - Sección "Domains" o "Networking"

3. **Dashboard del Proyecto**
   - Lista de servicios con sus URLs

---

## 📝 Formato de la URL

Railway genera URLs en estos formatos:

```
https://tu-admin-panel.up.railway.app
```

o

```
https://tu-admin-panel.railway.app
```

o

```
https://tu-admin-panel-production.up.railway.app
```

---

## ✅ Una Vez que Tengas la URL

1. **Copia la URL completa** (ejemplo: `https://admin-panel-production.up.railway.app`)

2. **Agrégala al Backend:**
   - Railway → Tu Servicio Backend → **Variables**
   - Agrega o actualiza:
     ```env
     ADMIN_PANEL_URL=https://tu-admin-panel.up.railway.app
     ```
   - (Reemplaza con tu URL real)

3. **Reinicia el Backend** después de agregar la variable

4. **Accede al Admin Panel:**
   - Abre la URL en tu navegador
   - Login con: `admin@rifasnao.com` / `admin123456`

---

## 🎯 Resumen Rápido

1. Railway → Tu Servicio Admin Panel → **Settings**
2. Busca **"Networking"** o **"Public Domain"**
3. Click en **"Generate Domain"** (si no existe)
4. Copia la URL generada
5. Agrégala como `ADMIN_PANEL_URL` en el backend

¡Eso es todo! La URL debería estar disponible inmediatamente después de generarla.





