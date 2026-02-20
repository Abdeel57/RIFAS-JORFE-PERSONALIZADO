# Rifas NAO - Sorteos y Herramientas AI

Plataforma completa para gestión de rifas y sorteos con herramientas de IA integradas.

## Estructura del Proyecto

```
rifas-nao---sorteos-y-herramientas-ai/
├── frontend/          # Frontend público (React + Vite)
├── backend/           # Backend API (Node.js + Express + Prisma)
└── admin-panel/      # Panel de administración (React + Vite)
```

## Inicio Rápido

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm run prisma:generate
npm run prisma:migrate
npx tsx src/scripts/seed.ts
npm run dev
```

### 2. Frontend

```bash
# En la raíz del proyecto
npm install
npm run dev
```

### 3. Panel de Administración

El admin panel está integrado en el backend. En desarrollo:

```bash
cd admin-panel
npm install
npm run dev
```

En producción, el admin panel se construye automáticamente con el backend y está disponible en `/admin`.

## Configuración

### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/rifas_nao"
JWT_SECRET="tu-secret-key"
GEMINI_API_KEY="tu-api-key"
FRONTEND_URL="http://localhost:3000"
```

**Nota:** El admin panel ahora está integrado en el backend y está disponible en `http://localhost:3001/admin`

### Frontend
El frontend se conecta automáticamente al backend en `http://localhost:3001/api`. 
Para cambiar esto, crear `.env.local`:
```env
VITE_API_URL=http://localhost:3001/api
```

## Credenciales de Administrador

Después de ejecutar el seed:
- Email: `admin@rifasnao.com`
- Password: `admin123456`

## Características

- ✅ Gestión completa de rifas
- ✅ Sistema de boletos con estados
- ✅ Procesamiento de compras
- ✅ Verificación de boletos por teléfono
- ✅ Chat de soporte con IA (Gemini)
- ✅ Panel de administración completo
- ✅ Dashboard con estadísticas
- ✅ Autenticación JWT

## Tecnologías

- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL
- **Admin Panel**: React, TypeScript, Vite, Recharts
- **IA**: Google Gemini AI

## Documentación

Ver README.md en cada directorio para más detalles:
- [Backend README](backend/README.md)
- [Admin Panel README](admin-panel/README.md)
