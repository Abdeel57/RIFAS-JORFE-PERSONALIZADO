# Integración del Admin Panel en el Backend

## Arquitectura Actualizada

El admin panel ahora está integrado en el backend Express, eliminando la necesidad de un servicio separado en Railway.

### Estructura en Railway

```
Railway
├── BACKEND (Express)
│   ├── /api/* → API endpoints
│   ├── /admin/* → Admin panel (archivos estáticos)
│   └── /health → Health check
└── DATABASE (PostgreSQL)
```

### URLs

- **API**: `https://tu-backend.up.railway.app/api/*`
- **Admin Panel**: `https://tu-backend.up.railway.app/admin`
- **Health Check**: `https://tu-backend.up.railway.app/health`

## Build Automático

El admin panel se construye automáticamente durante el deploy del backend:

1. Se instalan las dependencias del admin panel
2. Se construye el admin panel (output a `backend/dist/admin`)
3. Se instalan las dependencias del backend
4. Se genera Prisma Client
5. Se construye el backend
6. Se inicia el servidor Express que sirve tanto API como admin

## Variables de Entorno

Ya no necesitas `ADMIN_PANEL_URL`. Solo necesitas:

```env
DATABASE_URL=...
JWT_SECRET=...
FRONTEND_URL=https://tu-frontend.com  # Solo para CORS del frontend
NODE_ENV=production
```

## CORS Simplificado

Como el admin panel está en el mismo dominio que la API, no necesita configuración de CORS. Solo el frontend externo (Netlify) necesita estar en la lista de orígenes permitidos.

## Desarrollo Local

En desarrollo, puedes ejecutar el admin panel por separado:

```bash
cd admin-panel
npm install
npm run dev
```

Estará disponible en `http://localhost:5174` y se conectará al backend en `http://localhost:3001/api`.

## Producción

En producción, el admin panel se construye automáticamente y está disponible en `/admin` del mismo dominio del backend.

## Credenciales

Las credenciales del admin siguen siendo las mismas:
- Email: `admin@rifasnao.com`
- Password: `admin123456`

## Troubleshooting

### El admin panel no carga

1. Verifica que el build del admin panel se haya ejecutado correctamente
2. Revisa los logs del backend para ver si hay errores al servir archivos estáticos
3. Verifica que la carpeta `backend/dist/admin` exista y contenga `index.html`

### Error 404 en rutas del admin

Esto es normal. El backend sirve `index.html` para todas las rutas `/admin/*` que no sean archivos estáticos, permitiendo que React Router maneje el routing del lado del cliente.

### CORS errors

Si ves errores de CORS desde el admin panel, verifica que estés accediendo desde el mismo dominio. El admin panel no debería tener problemas de CORS ya que está en el mismo dominio que la API.

