# 📝 Crear Archivos .env Manualmente

## Frontend - Crear `.env.local`

Crea un archivo llamado `.env.local` en la **raíz del proyecto** (donde está `package.json`) con:

```env
VITE_API_URL=https://paginas-production.up.railway.app/api
```

## Admin Panel - Crear `.env`

Crea un archivo llamado `.env` en la carpeta `admin-panel/` con:

```env
VITE_API_URL=https://paginas-production.up.railway.app/api
```

---

## ✅ Verificación

Después de crear los archivos:

1. **Frontend:**
   ```bash
   npm run dev
   ```
   Debería conectarse automáticamente al backend.

2. **Admin Panel:**
   ```bash
   cd admin-panel
   npm run dev
   ```
   Debería conectarse automáticamente al backend.




