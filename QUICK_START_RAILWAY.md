# 🚀 Inicio Rápido - Railway Deployment

## Archivos Creados para Railway

He preparado todos los archivos necesarios para desplegar en Railway:

✅ `backend/railway.json` - Configuración de Railway
✅ `backend/nixpacks.toml` - Configuración de build
✅ `backend/Procfile` - Comando de inicio
✅ `backend/DEPLOY.md` - Guía detallada de deployment
✅ `RAILWAY_SETUP.md` - Guía completa paso a paso
✅ Scripts actualizados en `package.json`

## 📝 Pasos para Hacer Push y Desplegar

### 1. Verificar que todo esté commiteado

```bash
git status
git add .
git commit -m "Preparar proyecto para Railway deployment"
```

### 2. Hacer Push al Repositorio

```bash
git push origin main
# o
git push origin master
```

### 3. Configurar en Railway

#### A. Crear Proyecto
1. Ve a https://railway.app
2. Inicia sesión o crea cuenta
3. Click en "New Project"
4. Selecciona "Deploy from GitHub repo"
5. Conecta tu repositorio

#### B. Crear Base de Datos PostgreSQL
1. En tu proyecto Railway, click "+ New"
2. Selecciona "Database" → "Add PostgreSQL"
3. Railway generará automáticamente `DATABASE_URL`

#### C. Configurar Servicio Backend
1. Railway detectará automáticamente el backend
2. Si no, crea un nuevo servicio y selecciona tu repo
3. **IMPORTANTE**: Configura "Root Directory" como `backend`

#### D. Variables de Entorno Requeridas

En Railway → Tu Servicio → Variables, agrega:

```env
DATABASE_URL=<Railway lo genera automáticamente>
JWT_SECRET=<genera uno con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
GEMINI_API_KEY=<tu API key de Gemini>
NODE_ENV=production
```

#### E. Build Settings (Railway debería detectarlos automáticamente)

**Build Command:**
```
npm install && npm run prisma:generate && npm run build
```

**Start Command:**
```
npm run railway:deploy
```

**Root Directory:**
```
backend
```

### 4. Ejecutar Migraciones y Seed

Después del primer deploy exitoso:

1. Ve a tu servicio en Railway
2. Abre la Terminal (en la pestaña del servicio)
3. Ejecuta:

```bash
# Migraciones
npm run prisma:migrate

# Crear administrador
npx tsx src/scripts/seed.ts
```

O todo junto:
```bash
npm run railway:setup
```

### 5. Verificar Deployment

1. Railway te dará una URL (ej: `https://tu-backend.up.railway.app`)
2. Prueba el health check:
   ```
   https://tu-backend.up.railway.app/health
   ```
3. Debería responder: `{"status":"ok","timestamp":"..."}`

### 6. Credenciales de Administrador

Después del seed:
- **Email**: `admin@rifasnao.com`
- **Password**: `admin123456`

## 🔧 Configuración Adicional

### CORS (si despliegas frontend/admin)

Agrega estas variables de entorno en Railway:

```env
FRONTEND_URL=https://tu-frontend.com
ADMIN_PANEL_URL=https://tu-admin-panel.com
```

### Dominio Personalizado (Opcional)

1. Ve a Settings → Networking
2. Click en "Generate Domain" o agrega tu dominio personalizado
3. Configura DNS según las instrucciones

## 📚 Documentación Completa

- **Guía detallada**: Ver `RAILWAY_SETUP.md`
- **Troubleshooting**: Ver `backend/DEPLOY.md`
- **Backend README**: Ver `backend/README.md`

## ✅ Checklist Pre-Deployment

- [ ] Código commiteado y pusheado a GitHub
- [ ] Cuenta de Railway creada
- [ ] Repositorio conectado en Railway
- [ ] Base de datos PostgreSQL creada
- [ ] Variables de entorno configuradas
- [ ] Root Directory configurado como `backend`
- [ ] Migraciones ejecutadas
- [ ] Seed ejecutado (crear admin)
- [ ] Health check funcionando
- [ ] URLs de CORS configuradas (si aplica)

## 🆘 Problemas Comunes

### Railway no detecta el backend
- Verifica que "Root Directory" esté configurado como `backend`
- Verifica que `package.json` esté en `backend/`

### Error de migraciones
- Ejecuta manualmente: `npm run prisma:migrate` en la terminal de Railway
- Verifica que `DATABASE_URL` esté correcta

### Build falla
- Revisa los logs en Railway
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que TypeScript compile correctamente

### No se puede conectar a la base de datos
- Verifica que el servicio PostgreSQL esté corriendo
- Verifica que `DATABASE_URL` esté correctamente configurada
- Asegúrate de que no haya espacios extra en las variables

## 🎉 ¡Listo!

Una vez completados estos pasos, tu backend estará corriendo en Railway y podrás:
- Acceder a la API desde cualquier lugar
- Usar el panel de administración
- Conectar el frontend a la API desplegada






