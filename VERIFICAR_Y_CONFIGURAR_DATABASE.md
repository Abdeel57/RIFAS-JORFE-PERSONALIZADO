# Verificar y Configurar la Base de Datos

## 🔍 Problema Identificado

El error de CORS es independiente de la base de datos, PERO si las tablas no existen o no hay usuarios admin, el login fallará por otras razones.

## ✅ Verificación Paso a Paso

### Paso 1: Verificar que las Migraciones se Ejecutaron

Las migraciones **deberían ejecutarse automáticamente** cuando el backend inicia (según `startup.sh`), pero vamos a verificar:

1. **Ve a Railway** → Servicio **BACKEND** → **"Logs"**
2. **Busca mensajes que digan:**
   - `=== STARTUP: migrate deploy ===`
   - `=== STARTUP: migrate ok ===` o `=== STARTUP: migrate failed ===`

Si ves `migrate failed`, hay un problema con la base de datos.

### Paso 2: Verificar que Existe el Usuario Admin

El seed **NO se ejecuta automáticamente**. Necesitas ejecutarlo manualmente.

**Credenciales por defecto del seed:**
- Email: `admin@rifasnao.com`
- Password: `admin123456`

## 🛠️ Solución: Ejecutar Migraciones y Seed Manualmente

### Opción 1: Usando la Terminal de Railway (Recomendado)

1. **Ve a Railway** → Servicio **BACKEND**
2. **Abre la Terminal:**
   - Ve a la pestaña **"Deployments"**
   - Haz clic en el último deployment
   - Busca el botón **"Terminal"** o **"Open Terminal"**
   
3. **Ejecuta las migraciones (si no se ejecutaron):**
   ```bash
   npx prisma migrate deploy
   ```

4. **Ejecuta el seed para crear el usuario admin:**
   ```bash
   npx tsx src/scripts/seed.ts
   ```

5. **Verifica que el admin se creó:**
   ```bash
   npx tsx src/scripts/check-admin.ts
   ```

### Opción 2: Verificar usando Prisma Studio

1. **En la terminal de Railway (BACKEND), ejecuta:**
   ```bash
   npx prisma studio
   ```

2. **Prisma Studio se abrirá en una URL** (aparecerá en los logs)
3. **Verifica que existan las tablas:**
   - `Admin`
   - `Raffle`
   - `Ticket`
   - `User`
   - `Purchase`

4. **Verifica que exista un usuario en la tabla `Admin`:**
   - Debería haber al menos un registro con email `admin@rifasnao.com`

## 📋 Checklist de Verificación

- [ ] Las migraciones se ejecutaron correctamente (ver logs)
- [ ] Las tablas existen en la base de datos
- [ ] Existe al menos un usuario admin en la tabla `Admin`
- [ ] El email del admin es `admin@rifasnao.com`
- [ ] La contraseña del admin es `admin123456`

## 🐛 Si las Migraciones Fallan

### Error: "Cannot connect to database"

1. **Verifica la variable `DATABASE_URL` en Railway:**
   - Ve a **BACKEND** → **"Variables"**
   - Verifica que `DATABASE_URL` exista y tenga un valor válido
   - Debería ser algo como: `postgresql://postgres:password@host:port/database`

2. **Verifica que el servicio DATABASE esté corriendo:**
   - Ve a Railway → Servicio **DATABASE**
   - Debería mostrar estado "Online"

### Error: "Prisma Client not generated"

1. **En la terminal de Railway (BACKEND), ejecuta:**
   ```bash
   npx prisma generate
   ```

2. **Luego ejecuta las migraciones:**
   ```bash
   npx prisma migrate deploy
   ```

## 🎯 Después de Verificar/Configurar

Una vez que:
1. ✅ Las tablas existan
2. ✅ El usuario admin esté creado
3. ✅ El CORS esté configurado (ya lo arreglamos)
4. ✅ El backend esté redesplegado

**Prueba el login:**
- Ve a `https://fantastic-amazement-production.up.railway.app`
- Email: `admin@rifasnao.com`
- Password: `admin123456`

## 📝 Notas Importantes

- **Las migraciones se ejecutan automáticamente** al iniciar el backend (según `startup.sh`)
- **El seed NO se ejecuta automáticamente** - debes ejecutarlo manualmente
- **Solo necesitas ejecutar el seed UNA VEZ** - después de eso, el admin ya existirá
- Si ejecutas el seed múltiples veces, no creará duplicados (verifica si ya existe)




