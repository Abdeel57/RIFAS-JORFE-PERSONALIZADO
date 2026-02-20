# 🔧 Solución: Error "cd admin-panel: No such file or directory"

## ❌ Error

```
RUN cd admin-panel && npm install && npm run build
/bin/bash: line 1: cd: admin-panel: No such file or directory
```

## 🔍 Causa

Cuando configuras **Root Directory** como `admin-panel` en Railway, Railway ya está trabajando desde dentro de esa carpeta. Por lo tanto, **NO debes** usar `cd admin-panel` en los comandos.

## ✅ Solución

### Opción 1: Verificar Build Command en Railway (Recomendado)

1. **Railway → Tu Servicio Admin Panel → Settings**
2. Busca **"Build Command"** o **"Build Settings"**
3. Si ves un Build Command configurado manualmente, cámbialo a:
   ```bash
   npm install && npm run build
   ```
   (Sin `cd admin-panel`)
4. **Start Command** debe ser:
   ```bash
   npm run preview
   ```
   (Sin `cd admin-panel`)
5. Guarda los cambios

### Opción 2: Dejar que Railway use los archivos automáticamente

Si configuraste Root Directory como `admin-panel`, Railway debería detectar automáticamente:
- `admin-panel/railway.json`
- `admin-panel/nixpacks.toml`
- `admin-panel/package.json`

Y usar los comandos correctos (sin `cd`).

**Si Railway sigue usando comandos con `cd admin-panel`:**

1. **Elimina cualquier Build Command manual** en Railway Settings
2. **Deja que Railway detecte automáticamente** los archivos de configuración
3. O configura manualmente:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run preview`

---

## 📋 Comandos Correctos

Cuando Root Directory = `admin-panel`:

✅ **Build Command:**
```bash
npm install && npm run build
```

✅ **Start Command:**
```bash
npm run preview
```

❌ **NO uses:**
```bash
cd admin-panel && npm install && npm run build  # ❌ INCORRECTO
```

---

## 🔄 Pasos para Corregir

1. **Railway → Tu Servicio → Settings**
2. Busca **"Build Command"** o **"Build Settings"**
3. Si hay un Build Command configurado, cámbialo a: `npm install && npm run build`
4. Verifica **Start Command**: `npm run preview`
5. Guarda los cambios
6. Railway hará un nuevo deploy automáticamente

---

## ✅ Verificación

Después de corregir:

1. Railway debería ejecutar:
   - Build: `npm install && npm run build` (desde `admin-panel/`)
   - Start: `npm run preview` (desde `admin-panel/`)

2. El build debería completarse exitosamente

3. El servicio debería iniciar correctamente

---

## 🎯 Resumen

**Problema:** Railway está ejecutando `cd admin-panel` pero ya está dentro de esa carpeta.

**Solución:** 
- Configura Build Command como: `npm install && npm run build` (sin `cd`)
- Configura Start Command como: `npm run preview` (sin `cd`)
- O elimina los comandos manuales y deja que Railway detecte automáticamente los archivos

¡Los archivos `admin-panel/railway.json` y `admin-panel/nixpacks.toml` ya están correctos!




