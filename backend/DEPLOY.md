# Guía de Deployment en Railway

## Pasos para desplegar en Railway

### 1. Crear proyecto en Railway

1. Ve a [Railway](https://railway.app)
2. Crea una nueva cuenta o inicia sesión
3. Haz clic en "New Project"
4. Selecciona "Deploy from GitHub repo" o "Empty Project"

### 2. Configurar Base de Datos PostgreSQL

1. En tu proyecto Railway, haz clic en "+ New"
2. Selecciona "Database" → "Add PostgreSQL"
3. Railway creará automáticamente una base de datos PostgreSQL
4. Copia la variable `DATABASE_URL` que Railway genera automáticamente

### 3. Configurar el Backend

1. Si conectaste desde GitHub, selecciona el repositorio
2. Si es un proyecto vacío, conecta tu repositorio o sube el código
3. Railway detectará automáticamente que es un proyecto Node.js

### 4. Configurar Variables de Entorno

En Railway, ve a tu servicio y configura las siguientes variables de entorno:

**Variables requeridas:**
```
DATABASE_URL=<Railway lo genera automáticamente>
JWT_SECRET=<genera una clave secreta segura, mínimo 32 caracteres>
GEMINI_API_KEY=<tu API key de Google Gemini>
NODE_ENV=production
PORT=3001
```

**Variables opcionales:**
```
FRONTEND_URL=<URL de tu frontend desplegado>
ADMIN_PANEL_URL=<URL de tu admin panel desplegado>
```

### 5. Configurar Build y Start Commands

Railway debería detectar automáticamente los scripts, pero puedes verificar:

**Build Command:**
```
npm install && npm run prisma:generate && npm run build
```

**Start Command:**
```
npm run railway:deploy
```

O simplemente:
```
npm start
```

Y Railway ejecutará automáticamente las migraciones antes de iniciar.

### 6. Ejecutar Migraciones

Las migraciones se ejecutarán automáticamente con el comando `railway:deploy`, pero también puedes ejecutarlas manualmente:

1. Ve a tu servicio en Railway
2. Abre la terminal
3. Ejecuta: `npm run prisma:migrate`

### 7. Crear Administrador Inicial

Después de que el servicio esté corriendo:

1. Abre la terminal de Railway
2. Ejecuta: `npx tsx src/scripts/seed.ts`

O crea un administrador manualmente usando Prisma Studio:
```
npx prisma studio
```

### 8. Obtener URL del Backend

Railway generará automáticamente una URL pública para tu servicio. 
Cópiala y úsala para configurar:
- `FRONTEND_URL` en las variables de entorno
- `ADMIN_PANEL_URL` en las variables de entorno
- Configuración del frontend para apuntar a esta URL

### 9. Configurar Dominio Personalizado (Opcional)

1. Ve a tu servicio en Railway
2. Haz clic en "Settings"
3. En "Domains", agrega tu dominio personalizado
4. Configura los registros DNS según las instrucciones de Railway

## Verificación

Una vez desplegado, verifica que todo funciona:

1. **Health Check**: `GET https://tu-url-railway.railway.app/health`
2. **API Endpoints**: Prueba los endpoints públicos
3. **Admin Login**: Accede al panel de administración con las credenciales del seed

## Troubleshooting

### Error: "Cannot connect to database"
- Verifica que `DATABASE_URL` esté correctamente configurada
- Asegúrate de que la base de datos PostgreSQL esté corriendo

### Error: "Prisma Client not generated"
- Verifica que el comando `postinstall` esté ejecutándose
- Ejecuta manualmente: `npm run prisma:generate`

### Error: "Migrations failed"
- Verifica que la base de datos esté vacía o en el estado correcto
- Ejecuta las migraciones manualmente desde la terminal de Railway

### Error: "Port already in use"
- Railway asigna automáticamente el puerto, usa `process.env.PORT`

## Monitoreo

Railway proporciona:
- Logs en tiempo real
- Métricas de uso
- Alertas de errores
- Historial de deployments

## Actualizaciones

Para actualizar el código:
1. Haz push a tu repositorio GitHub
2. Railway detectará los cambios automáticamente
3. Ejecutará el build y deploy automáticamente





