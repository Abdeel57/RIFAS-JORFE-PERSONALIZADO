# Configuración en Railway - Guía Completa

## 📋 Checklist Pre-Deployment

- [ ] Cuenta de Railway creada
- [ ] Repositorio GitHub conectado (o código listo para subir)
- [ ] API Key de Gemini obtenida
- [ ] JWT Secret generado (mínimo 32 caracteres)

## 🚀 Pasos de Deployment

### Paso 1: Crear Proyecto en Railway

1. Ve a https://railway.app y crea una cuenta
2. Haz clic en "New Project"
3. Selecciona "Deploy from GitHub repo" (recomendado) o "Empty Project"

### Paso 2: Crear Base de Datos PostgreSQL

1. En tu proyecto Railway, haz clic en **"+ New"**
2. Selecciona **"Database"** → **"Add PostgreSQL"**
3. Railway creará automáticamente una instancia PostgreSQL
4. **IMPORTANTE**: Copia la variable `DATABASE_URL` que aparece automáticamente

### Paso 3: Configurar el Servicio Backend

#### Opción A: Desde GitHub (Recomendado)

1. Si conectaste GitHub, selecciona tu repositorio
2. Railway detectará automáticamente que es Node.js
3. Configura el **Root Directory** como `backend` (si el backend está en una carpeta)

#### Opción B: Proyecto Vacío

1. Crea un nuevo servicio
2. Selecciona "GitHub Repo" y conecta tu repositorio
3. O usa "Empty Service" y sube el código manualmente

### Paso 4: Configurar Variables de Entorno

En tu servicio backend, ve a **"Variables"** y agrega:

#### Variables Requeridas:

```env
DATABASE_URL=<Railway lo genera automáticamente cuando creas PostgreSQL>
JWT_SECRET=<genera una clave secreta de al menos 32 caracteres>
GEMINI_API_KEY=<tu API key de Google Gemini>
NODE_ENV=production
```

#### Variables Opcionales:

```env
PORT=3001
FRONTEND_URL=https://tu-frontend.com
ADMIN_PANEL_URL=https://tu-admin-panel.com
```

**Generar JWT_SECRET:**
```bash
# En tu terminal local
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Paso 5: Configurar Build Settings

Railway debería detectar automáticamente, pero verifica:

**Build Command:**
```bash
npm install && npm run prisma:generate && npm run build
```

**Start Command:**
```bash
npm run railway:deploy
```

O simplemente:
```bash
npm start
```

**Root Directory:** `backend` (si tu backend está en una carpeta)

### Paso 6: Ejecutar Migraciones y Seed

Después del primer deploy:

1. Ve a tu servicio en Railway
2. Abre la **Terminal** (pestaña "Deployments" → "View Logs" → "Terminal")
3. Ejecuta:

```bash
# Ejecutar migraciones
npm run prisma:migrate

# Crear administrador inicial
npx tsx src/scripts/seed.ts
```

O ejecuta todo junto:
```bash
npm run railway:setup
```

### Paso 7: Obtener URL del Backend

1. Ve a tu servicio backend
2. Haz clic en **"Settings"**
3. En **"Networking"**, verás la URL pública generada
4. Cópiala (ejemplo: `https://tu-backend.up.railway.app`)

### Paso 8: Configurar CORS

Actualiza las variables de entorno con la URL del frontend:

```env
FRONTEND_URL=https://tu-frontend.com
```

**Nota:** El admin panel está integrado en el backend y está disponible en `https://tu-backend.up.railway.app/admin`. No necesita configuración de CORS separada ya que está en el mismo dominio.

Railway reiniciará automáticamente el servicio.

## 🔍 Verificación

### 1. Health Check
```bash
curl https://tu-backend.up.railway.app/health
```

Debería responder:
```json
{"status":"ok","timestamp":"2024-..."}
```

### 2. Probar Endpoints

```bash
# Listar rifas
curl https://tu-backend.up.railway.app/api/raffles

# Login admin
curl -X POST https://tu-backend.up.railway.app/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rifasnao.com","password":"admin123456"}'
```

### 3. Verificar Base de Datos

En Railway, puedes usar Prisma Studio:
```bash
npx prisma studio
```

O conectarte directamente usando la `DATABASE_URL`.

## 🐛 Troubleshooting

### Error: "Cannot connect to database"
- ✅ Verifica que `DATABASE_URL` esté correctamente configurada
- ✅ Asegúrate de que el servicio PostgreSQL esté corriendo
- ✅ Verifica que no haya espacios extra en las variables de entorno

### Error: "Prisma Client not generated"
- ✅ Verifica que el script `postinstall` esté ejecutándose
- ✅ Revisa los logs de build en Railway
- ✅ Ejecuta manualmente: `npm run prisma:generate`

### Error: "Migrations failed"
- ✅ Verifica que la base de datos esté accesible
- ✅ Ejecuta migraciones manualmente desde la terminal
- ✅ Verifica que `DATABASE_URL` tenga permisos correctos

### Error: "Port already in use"
- ✅ Railway asigna el puerto automáticamente
- ✅ Usa `process.env.PORT` en el código (ya está configurado)

### Build Falla
- ✅ Verifica que todas las dependencias estén en `package.json`
- ✅ Revisa los logs de build en Railway
- ✅ Asegúrate de que TypeScript compile correctamente

## 📊 Monitoreo

Railway proporciona:
- **Logs en tiempo real**: Ve a "Deployments" → "View Logs"
- **Métricas**: CPU, Memoria, Red
- **Alertas**: Configura alertas para errores
- **Historial**: Ve todos los deployments anteriores

## 🔄 Actualizaciones

Para actualizar el código:

1. Haz push a tu repositorio GitHub
2. Railway detectará automáticamente los cambios
3. Ejecutará build y deploy automáticamente
4. Las migraciones se ejecutarán automáticamente con `railway:deploy`

## 🔐 Seguridad

- ✅ Nunca commitees `.env` o archivos con credenciales
- ✅ Usa variables de entorno de Railway para secretos
- ✅ Genera un `JWT_SECRET` único y seguro
- ✅ Mantén `GEMINI_API_KEY` seguro
- ✅ Usa HTTPS (Railway lo proporciona automáticamente)

## 📝 Notas Adicionales

- Railway proporciona HTTPS automáticamente
- Puedes configurar un dominio personalizado en Settings → Domains
- Railway tiene un plan gratuito generoso para empezar
- Las bases de datos PostgreSQL en Railway se respaldan automáticamente

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs en Railway
2. Verifica las variables de entorno
3. Consulta la documentación de Railway: https://docs.railway.app
4. Revisa este archivo DEPLOY.md en el backend





