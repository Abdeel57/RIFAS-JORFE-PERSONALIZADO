# Panel de Administración - Rifas NAO

Panel de administración desarrollado con React, TypeScript y Vite.

## Requisitos Previos

- Node.js 18+
- npm o yarn

## Configuración

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno (opcional):
Crear `.env` si necesitas cambiar la URL del API:
```env
VITE_API_URL=http://localhost:3001/api
```

3. Iniciar servidor de desarrollo:
```bash
npm run dev
```

El panel estará disponible en `http://localhost:5174`

## Credenciales por Defecto

Después de ejecutar el seed del backend:
- Email: `admin@rifasnao.com`
- Password: `admin123456`

## Estructura del Proyecto

```
admin-panel/
├── src/
│   ├── components/    # Componentes UI
│   ├── pages/         # Páginas principales
│   ├── services/      # Servicios API
│   └── hooks/         # Custom hooks
└── package.json
```

## Scripts Disponibles

- `npm run dev` - Iniciar en modo desarrollo
- `npm run build` - Compilar para producción
- `npm run preview` - Previsualizar build de producción






