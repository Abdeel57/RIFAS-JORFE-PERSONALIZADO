# Backend API - Rifas NAO

Backend API desarrollado con Node.js, Express, TypeScript y PostgreSQL usando Prisma ORM.

## Requisitos Previos

- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

## Configuración

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/rifas_nao?schema=public"
JWT_SECRET="tu-secret-key-super-segura-aqui"
GEMINI_API_KEY="tu-api-key-de-gemini"
FRONTEND_URL="http://localhost:3000"
```

**Nota:** El admin panel está integrado en el backend. En desarrollo, puedes ejecutarlo por separado desde `admin-panel/`. En producción, se construye automáticamente y está disponible en `/admin`.
```

3. Configurar base de datos:
```bash
# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Crear administrador inicial
npx tsx src/scripts/seed.ts
```

4. Iniciar servidor:
```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

El servidor estará disponible en `http://localhost:3001`

---
**Última actualización:** CORS configurado para permitir todos los orígenes

## Endpoints API

### Públicos
- `GET /api/raffles` - Listar rifas activas
- `GET /api/raffles/:id` - Detalles de rifa
- `GET /api/raffles/:id/tickets` - Estado de boletos
- `POST /api/purchases` - Crear compra
- `POST /api/verify` - Verificar boletos por teléfono
- `POST /api/support/chat` - Chat con IA

### Administración (requieren autenticación)
- `POST /api/admin/auth/login` - Login admin
- `GET /api/admin/dashboard/stats` - Estadísticas
- `CRUD /api/admin/raffles` - Gestión de rifas
- `GET /api/admin/tickets` - Listar boletos
- `PUT /api/admin/tickets/:id` - Actualizar estado boleto
- `GET /api/admin/purchases` - Listar compras
- `PUT /api/admin/purchases/:id/status` - Actualizar estado compra
- `GET /api/admin/users` - Listar usuarios

## Estructura del Proyecto

```
backend/
├── src/
│   ├── config/        # Configuración (DB, env)
│   ├── controllers/   # Lógica de negocio
│   ├── middleware/    # Auth, validación
│   ├── routes/        # Definición de rutas
│   ├── services/      # Servicios externos
│   └── utils/         # Utilidades
├── prisma/
│   └── schema.prisma  # Esquema de base de datos
└── package.json
```

## Scripts Disponibles

- `npm run dev` - Iniciar en modo desarrollo
- `npm run build` - Compilar TypeScript
- `npm start` - Iniciar en producción
- `npm run prisma:generate` - Generar cliente Prisma
- `npm run prisma:migrate` - Ejecutar migraciones
- `npm run prisma:studio` - Abrir Prisma Studio


