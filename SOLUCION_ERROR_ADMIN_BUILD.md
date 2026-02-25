# 🔧 Solución: Error de Build del Admin Panel en Railway

## ❌ Error Encontrado

```
sh: 1: cd: can't cd to admin-panel
Build Failed: build daemon returned an error
```

## 🔍 Causa del Problema

Railway está ejecutando el build desde la raíz del repositorio, pero cuando intenta hacer `cd admin-panel`, no encuentra la carpeta porque Railway necesita que configures el **Root Directory** correctamente.

## ✅ Solución: Configurar Root Directory en Railway

### Opción 1: Usar la Interfaz de Railway (Recomendado)

1. **Ve a Railway** → Tu Servicio Admin Panel
2. **Settings** → Busca **"Source"** o **"Repository"**
3. Busca la opción **"Root Directory"** o **"Working Directory"**
4. Configura: `admin-panel`
5. Guarda los cambios

### Opción 2: Usar railway.json en la Raíz

Si Railway no detecta automáticamente el `admin-panel/railway.json`, puedes crear un servicio específico:

1. **Crea un nuevo servicio** en Railway
2. **Conecta el mismo repositorio**
3. **En Settings → Source**, configura:
   - **Root Directory:** `admin-panel`
4. Railway detectará automáticamente el `package.json` y `railway.json` dentro de `admin-panel/`

### Opción 3: Configuración Manual de Build

Si no encuentras Root Directory:

1. **Railway → Tu Servicio → Settings → Build**
2. **Build Command:**
   ```bash
   npm install && npm run build
   ```
   (Sin el `cd admin-panel`, porque Railway debería estar en esa carpeta)

3. **Start Command:**
   ```bash
   npm run preview
   ```

**Pero primero necesitas configurar el Root Directory como `admin-panel`**

---

## 📝 Pasos Detallados para Configurar Root Directory

### Método 1: En la Configuración del Servicio

1. Railway → Tu Servicio Admin Panel
2. Click en **"Settings"** (icono de engranaje)
3. Busca la sección **"Source"** o **"Repository"**
4. Busca **"Root Directory"** o **"Working Directory"**
5. Ingresa: `admin-panel`
6. Click en **"Save"** o **"Update"**

### Método 2: Al Crear el Servicio

1. Railway → **"+ New"** → **"GitHub Repo"**
2. Selecciona tu repositorio: `PAGINAS-`
3. **ANTES de hacer deploy**, busca la opción **"Configure"** o **"Settings"**
4. Busca **"Root Directory"**
5. Configura: `admin-panel`
6. Luego haz click en **"Deploy"**

---

## 🔄 Si Railway Ya Está Desplegando

Si Railway ya está intentando hacer build:

1. **Detén el servicio** temporalmente (si es posible)
2. **Configura el Root Directory** como `admin-panel`
3. **Reinicia el servicio** o haz un nuevo deploy

---

## ✅ Verificación

Después de configurar el Root Directory:

1. Railway debería detectar automáticamente:
   - `admin-panel/package.json`
   - `admin-panel/railway.json`
   - `admin-panel/nixpacks.toml`

2. El build debería ejecutarse desde dentro de `admin-panel/`

3. Los comandos serán:
   - Build: `npm install && npm run build` (sin `cd`)
   - Start: `npm run preview` (sin `cd`)

---

## 📋 Checklist

- [ ] Root Directory configurado como `admin-panel` en Railway
- [ ] Build Command: `npm install && npm run build` (sin `cd`)
- [ ] Start Command: `npm run preview` (sin `cd`)
- [ ] Variable `VITE_API_URL` configurada
- [ ] Dominio público generado
- [ ] Build exitoso en Railway

---

## 🎯 Resumen

**El problema:** Railway está ejecutando comandos desde la raíz, pero necesita ejecutarlos desde `admin-panel/`

**La solución:** Configurar **Root Directory** como `admin-panel` en Railway Settings

**Ubicación:** Railway → Tu Servicio → Settings → Source/Repository → Root Directory

¡Una vez configurado, Railway trabajará directamente desde `admin-panel/` y no necesitarás los comandos con `cd`!





