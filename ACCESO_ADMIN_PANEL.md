# 🔐 Cómo Acceder al Panel de Administración

## 📍 Opciones de Acceso

### Opción 1: Ejecutar Localmente (Desarrollo)

1. **Abre una terminal** en la carpeta `admin-panel`:
   ```bash
   cd admin-panel
   npm install
   npm run dev
   ```

2. **El admin panel estará disponible en:**
   ```
   http://localhost:5174
   ```

3. **Credenciales de acceso:**
   - **Email:** `admin@rifasnao.com`
   - **Password:** `admin123456`

---

### Opción 2: Desplegar en Railway (Producción)

Si quieres desplegar el admin panel en Railway también:

1. **En Railway**, crea un nuevo servicio
2. **Conecta el mismo repositorio** de GitHub
3. **Configura:**
   - Root Directory: `admin-panel`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview` (o usa un servidor estático)
   - Variables de entorno:
     ```env
     VITE_API_URL=https://paginas-production.up.railway.app/api
     ```

4. **Railway generará una URL** como:
   ```
   https://tu-admin-panel.up.railway.app
   ```

---

## 🚀 Inicio Rápido (Local)

### Paso 1: Instalar Dependencias

```bash
cd admin-panel
npm install
```

### Paso 2: Configurar Variables de Entorno

Crea un archivo `.env` en `admin-panel/` con:

```env
VITE_API_URL=https://paginas-production.up.railway.app/api
```

### Paso 3: Iniciar el Servidor

```bash
npm run dev
```

### Paso 4: Acceder

Abre tu navegador en:
```
http://localhost:5174
```

### Paso 5: Login

- **Email:** `admin@rifasnao.com`
- **Password:** `admin123456`

---

## 🔗 URLs Importantes

| Servicio | URL |
|----------|-----|
| **Backend API** | `https://paginas-production.up.railway.app` |
| **Admin Panel (Local)** | `http://localhost:5174` |
| **Admin Panel (Producción)** | `https://tu-admin-panel.up.railway.app` (si lo despliegas) |

---

## 📋 Checklist

- [ ] Backend funcionando en Railway
- [ ] Health check responde: `https://paginas-production.up.railway.app/health`
- [ ] Admin panel instalado (`cd admin-panel && npm install`)
- [ ] Archivo `.env` creado en `admin-panel/` con `VITE_API_URL`
- [ ] Servidor de desarrollo iniciado (`npm run dev`)
- [ ] Acceso a `http://localhost:5174`
- [ ] Login exitoso con las credenciales

---

## 🐛 Si No Puedes Acceder

### Error: "Cannot connect to backend"

**Solución:**
1. Verifica que el backend esté funcionando: `https://paginas-production.up.railway.app/health`
2. Verifica que `.env` tenga la URL correcta
3. Reinicia el servidor de desarrollo

### Error: "Invalid credentials"

**Solución:**
1. Verifica que el seed se haya ejecutado en la base de datos
2. Las credenciales son: `admin@rifasnao.com` / `admin123456`

### Error: CORS

**Solución:**
1. Agrega en Railway → Variables del backend:
   ```env
   ADMIN_PANEL_URL=http://localhost:5174
   ```
2. Reinicia el backend

---

## 🎯 Funcionalidades del Admin Panel

Una vez dentro podrás:

- 📊 **Dashboard** - Ver estadísticas generales
- 🎫 **Rifas** - Crear, editar, eliminar rifas
- 🎟️ **Boletos** - Ver y gestionar boletos
- 💰 **Compras** - Aprobar pagos, ver compras
- 👥 **Usuarios** - Ver usuarios y su historial

---

## ✅ Resumen

**Para desarrollo local:**
```
http://localhost:5174
```

**Credenciales:**
- Email: `admin@rifasnao.com`
- Password: `admin123456`

¡Eso es todo! El admin panel está listo para usar.




