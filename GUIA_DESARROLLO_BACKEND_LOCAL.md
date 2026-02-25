# Guía Completa: Desarrollar Backend Localmente

## 🎯 Objetivo

Configurar y ejecutar el backend localmente para poder crear el administrador y probar todo antes de desplegar.

## 📋 Requisitos Previos

- Node.js 18 o superior
- PostgreSQL instalado (o usar Railway Database)
- Git
- Editor de código (VS Code recomendado)

## 🚀 Paso 1: Configurar Base de Datos

### Opción A: PostgreSQL Local

1. **Instalar PostgreSQL:**
   - Windows: Descarga desde https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. **Crear base de datos:**
   ```bash
   # Conectar a PostgreSQL
   psql -U postgres
   
   # Crear base de datos
   CREATE DATABASE rifas_nao;
   
   # Salir
   \q
   ```

### Opción B: Usar Base de Datos de Railway (Recomendado)

1. Ve a Railway → DATABASE → "Variables"
2. Copia la `DATABASE_URL`
3. Úsala en tu archivo `.env` local

## 🔧 Paso 2: Configurar el Backend Localmente

### 1. Navegar al directorio del backend

```bash
cd backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear archivo `.env`

Crea un archivo `.env` en la carpeta `backend/` con este contenido:

```env
# Base de Datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/rifas_nao?schema=public"
# O si usas Railway Database, pega aquí la DATABASE_URL de Railway

# JWT Secret (genera uno nuevo o usa el de Railway)
JWT_SECRET="tu-clave-secreta-de-al-menos-32-caracteres-aqui-12345678901234567890"

# Entorno
NODE_ENV="development"
PORT=3001

# Frontend (opcional, para desarrollo local)
FRONTEND_URL="http://localhost:3000"

# Gemini API Key (opcional, solo si usas el chatbot)
GEMINI_API_KEY="tu-api-key-de-gemini"
```

**⚠️ IMPORTANTE:** 
- Si usas la base de datos de Railway, usa esa `DATABASE_URL`
- Genera un `JWT_SECRET` nuevo o usa el mismo de Railway

**Generar JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Generar Prisma Client

```bash
npm run prisma:generate
```

### 5. Ejecutar Migraciones

```bash
npm run prisma:migrate
```

Esto creará todas las tablas en la base de datos.

### 6. Crear Usuario Administrador

```bash
npx tsx src/scripts/seed.ts
```

Deberías ver:
```
✅ Admin creado:
   Email: admin@rifasnao.com
   Password: admin123456
```

### 7. Verificar que el Admin Existe

```bash
npx tsx src/scripts/check-admin.ts
```

Deberías ver la información del admin creado.

## 🏃 Paso 3: Ejecutar el Backend

### Modo Desarrollo (con hot reload)

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3001`

### Verificar que Funciona

1. **Health Check:**
   ```
   http://localhost:3001/health
   ```
   Debería responder: `{"status":"ok",...}`

2. **Root:**
   ```
   http://localhost:3001/
   ```
   Debería responder con información del servidor

3. **API de Rifas:**
   ```
   http://localhost:3001/api/raffles
   ```
   Debería responder con un array (puede estar vacío)

## 🔐 Paso 4: Probar el Login del Admin

### Opción A: Usar cURL

```bash
curl -X POST http://localhost:3001/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@rifasnao.com\",\"password\":\"admin123456\"}"
```

Deberías recibir un token JWT.

### Opción B: Usar Postman o Thunder Client

1. Método: `POST`
2. URL: `http://localhost:3001/api/admin/auth/login`
3. Headers: `Content-Type: application/json`
4. Body (JSON):
   ```json
   {
     "email": "admin@rifasnao.com",
     "password": "admin123456"
   }
   ```

### Opción C: Usar el Admin Panel Local

1. En otra terminal, ve a `admin-panel/`
2. Ejecuta: `npm run dev`
3. Accede a: `http://localhost:5174`
4. Intenta hacer login

## 🐛 Solución de Problemas Comunes

### Error: "Cannot connect to database"

**Causa:** La `DATABASE_URL` es incorrecta o PostgreSQL no está corriendo.

**Solución:**
1. Verifica que PostgreSQL esté corriendo:
   ```bash
   # Windows
   services.msc (buscar PostgreSQL)
   
   # Mac/Linux
   sudo systemctl status postgresql
   ```

2. Verifica la `DATABASE_URL` en `.env`
3. Prueba conectarte manualmente:
   ```bash
   psql "postgresql://usuario:password@localhost:5432/rifas_nao"
   ```

### Error: "Prisma Client not generated"

**Solución:**
```bash
npm run prisma:generate
```

### Error: "Migration failed"

**Solución:**
1. Verifica que la base de datos exista
2. Verifica que la `DATABASE_URL` sea correcta
3. Intenta resetear las migraciones (⚠️ esto borrará datos):
   ```bash
   npx prisma migrate reset
   npx prisma migrate deploy
   ```

### Error: "Admin already exists" al ejecutar seed

Esto es normal. El script verifica si el admin ya existe y no lo duplica.

### El servidor no inicia

**Verifica:**
1. Que el puerto 3001 no esté en uso:
   ```bash
   # Windows
   netstat -ano | findstr :3001
   
   # Mac/Linux
   lsof -i :3001
   ```

2. Que todas las dependencias estén instaladas:
   ```bash
   npm install
   ```

3. Revisa los logs del servidor para ver el error específico

### No puedo hacer login

**Verifica:**
1. Que el admin exista:
   ```bash
   npx tsx src/scripts/check-admin.ts
   ```

2. Que las credenciales sean correctas:
   - Email: `admin@rifasnao.com`
   - Password: `admin123456`

3. Que el servidor esté corriendo en el puerto correcto

## 📊 Paso 5: Usar Prisma Studio (Opcional)

Para ver y editar datos directamente en la base de datos:

```bash
npm run prisma:studio
```

Esto abrirá una interfaz web en `http://localhost:5555` donde puedes:
- Ver todas las tablas
- Ver/editar datos
- Crear nuevos registros

## ✅ Checklist de Verificación

- [ ] PostgreSQL instalado y corriendo
- [ ] Base de datos `rifas_nao` creada
- [ ] Archivo `.env` configurado correctamente
- [ ] Dependencias instaladas (`npm install`)
- [ ] Prisma Client generado (`npm run prisma:generate`)
- [ ] Migraciones ejecutadas (`npm run prisma:migrate`)
- [ ] Usuario admin creado (`npx tsx src/scripts/seed.ts`)
- [ ] Servidor corriendo (`npm run dev`)
- [ ] Health check funciona (`http://localhost:3001/health`)
- [ ] Login funciona (puedes obtener token)

## 🎯 Siguiente Paso: Desplegar a Railway

Una vez que todo funcione localmente:

1. Haz commit de los cambios
2. Push a GitHub
3. Railway detectará los cambios y redesplegará
4. Verifica que funcione en producción

## 📝 Notas Importantes

- **En desarrollo local:** El admin panel se ejecuta por separado en `admin-panel/`
- **En producción:** El admin panel está integrado en el backend en `/admin`
- **Base de datos:** Puedes usar la misma de Railway o una local
- **Variables de entorno:** El `.env` local no se sube a Git (está en `.gitignore`)

## 🆘 Si Nada Funciona

1. **Verifica los logs del servidor** cuando ejecutas `npm run dev`
2. **Revisa la consola** para ver errores específicos
3. **Verifica la conexión a la base de datos** con Prisma Studio
4. **Asegúrate de que todas las dependencias estén instaladas**

## 📚 Recursos Adicionales

- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de Express](https://expressjs.com/)
- [Documentación de Railway](https://docs.railway.app/)


