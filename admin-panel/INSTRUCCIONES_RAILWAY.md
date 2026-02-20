# 🚀 Instrucciones para Desplegar Admin Panel en Railway

## 📍 Opción 1: Usando railway.json (Recomendado)

Railway detectará automáticamente el archivo `railway.json` que ya está en `admin-panel/`.

### Pasos:

1. **Crear Nuevo Servicio:**
   - Railway → Tu Proyecto → **"+ New"**
   - Selecciona **"GitHub Repo"**
   - Elige tu repositorio: `PAGINAS-`

2. **Railway detectará automáticamente:**
   - El archivo `admin-panel/railway.json`
   - Configurará el build y start automáticamente

3. **Configurar Variables:**
   - Railway → Tu Servicio Admin Panel → **"Variables"**
   - Agrega:
     ```env
     VITE_API_URL=https://paginas-production.up.railway.app/api
     ```

4. **Generar Dominio:**
   - Railway → Tu Servicio → **"Settings"** → **"Networking"**
   - Click en **"Generate Domain"**
   - Railway asignará automáticamente el puerto

---

## 📍 Opción 2: Configuración Manual

Si Railway no detecta automáticamente el `railway.json`:

### Paso 1: Crear el Servicio

1. Railway → **"+ New"** → **"GitHub Repo"**
2. Selecciona: `PAGINAS-`

### Paso 2: Configurar Build Settings

1. Railway → Tu Servicio → **"Settings"**
2. Busca la sección **"Build"** o **"Deploy"**
3. Configura:

   **Build Command:**
   ```bash
   cd admin-panel && npm install && npm run build
   ```

   **Start Command:**
   ```bash
   cd admin-panel && npm run preview
   ```

### Paso 3: Variables de Entorno

Railway → Tu Servicio → **"Variables"** → Agrega:

```env
VITE_API_URL=https://paginas-production.up.railway.app/api
```

### Paso 4: Generar Dominio

Railway → Tu Servicio → **"Settings"** → **"Networking"** → **"Generate Domain"**

---

## 📍 Opción 3: Usando Nixpacks (Automático)

Railway usa Nixpacks automáticamente. El archivo `nixpacks.toml` ya está configurado.

1. **Crear Servicio:**
   - Railway → **"+ New"** → **"GitHub Repo"**
   - Selecciona: `PAGINAS-`

2. **Railway detectará:**
   - El archivo `admin-panel/nixpacks.toml`
   - Configurará todo automáticamente

3. **Solo necesitas agregar:**
   - Variable: `VITE_API_URL=https://paginas-production.up.railway.app/api`
   - Generar dominio público

---

## 🔍 Dónde Encontrar las Configuraciones en Railway

### Si no ves "Root Directory":

1. **Settings → Build:**
   - Aquí puedes configurar el Build Command
   - Usa: `cd admin-panel && npm install && npm run build`

2. **Settings → Deploy:**
   - Aquí puedes configurar el Start Command
   - Usa: `cd admin-panel && npm run preview`

3. **Variables:**
   - Railway → Tu Servicio → **"Variables"** (pestaña superior)
   - Agrega: `VITE_API_URL=https://paginas-production.up.railway.app/api`

4. **Networking:**
   - Railway → Tu Servicio → **"Settings"** → **"Networking"**
   - Click en **"Generate Domain"**

---

## ✅ Verificación

Después de configurar:

1. Railway debería empezar a hacer build automáticamente
2. Revisa los **Logs** para ver el progreso
3. Una vez completado, Railway generará una URL
4. Accede a esa URL para ver el admin panel

---

## 🐛 Si Tienes Problemas

### Error: "Cannot find package.json"

**Solución:** Asegúrate de que el Build Command incluya `cd admin-panel`:
```bash
cd admin-panel && npm install && npm run build
```

### Error: "Port already in use"

**Solución:** Railway asignará automáticamente un puerto. No necesitas especificarlo.

### Error: "Build failed"

**Solución:** Revisa los logs en Railway → Tu Servicio → **"Deployments"** → Click en el deployment → Ver logs

---

## 📝 Resumen Rápido

1. **Crear servicio** en Railway desde GitHub Repo
2. **Agregar variable:** `VITE_API_URL=https://paginas-production.up.railway.app/api`
3. **Generar dominio** público
4. **Esperar** a que Railway haga el build y deploy
5. **Acceder** a la URL generada

¡Railway debería detectar automáticamente los archivos de configuración que ya creamos!




