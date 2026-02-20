# 🗄️ Ejecutar Migraciones desde Local - Guía Completa

## 📋 Paso 1: Obtener DATABASE_URL de Railway

1. Ve a **Railway** → Tu proyecto
2. Click en el servicio **PostgreSQL** (el que tiene el ícono de elefante)
3. Click en la pestaña **"Variables"**
4. Busca `DATABASE_URL` o `POSTGRES_URL`
5. **Copia el valor completo** (será algo como: `postgresql://postgres:password@host.railway.app:5432/railway`)

---

## 📝 Paso 2: Crear archivo .env en backend/

Crea un archivo `.env` en la carpeta `backend/` con:

```env
DATABASE_URL=<pega aquí la DATABASE_URL que copiaste de Railway>
```

**Ejemplo:**
```env
DATABASE_URL=postgresql://postgres:abc123@containers-us-west-123.railway.app:5432/railway
```

**⚠️ IMPORTANTE:** 
- Este archivo NO debe committearse (ya está en .gitignore)
- Mantén esta URL segura y no la compartas

---

## 🚀 Paso 3: Ejecutar Migraciones

### Opción A: Usar el Script Automático (Windows PowerShell)

```powershell
cd backend
.\setup-migrations.ps1
```

### Opción B: Usar el Script Automático (Linux/Mac)

```bash
cd backend
chmod +x setup-migrations.sh
./setup-migrations.sh
```

### Opción C: Ejecutar Manualmente

```bash
cd backend

# 1. Instalar dependencias
npm install

# 2. Generar Prisma Client
npx prisma generate

# 3. Crear migración inicial
npx prisma migrate dev --name init

# 4. Ejecutar migraciones (aplicar a la base de datos)
npx prisma migrate deploy

# 5. Crear administrador inicial
npx tsx src/scripts/seed.ts
```

---

## ✅ Paso 4: Verificar

### Opción 1: Prisma Studio (Interfaz Visual)

```bash
cd backend
npx prisma studio
```

Esto abrirá una interfaz web en `http://localhost:5555` donde podrás ver todas las tablas creadas.

### Opción 2: Verificar con Railway

Después de ejecutar las migraciones, prueba el health check:

```
https://paginas-production.up.railway.app/health
```

---

## 🔐 Credenciales del Administrador

Después de ejecutar el seed, se creará un administrador con:

- **Email:** `admin@rifasnao.com`
- **Password:** `admin123456`

**⚠️ IMPORTANTE:** Cambia esta contraseña después del primer login en producción.

---

## 🐛 Troubleshooting

### Error: "Can't reach database server"

**Causa:** La DATABASE_URL es incorrecta o la base de datos no está accesible.

**Solución:**
1. Verifica que la DATABASE_URL esté correcta
2. Asegúrate de que el servicio PostgreSQL esté "Online" en Railway
3. Verifica que no haya espacios extra en la URL

### Error: "Migration already applied"

**Causa:** Las migraciones ya se ejecutaron anteriormente.

**Solución:** Esto es normal, simplemente continúa con el siguiente paso.

### Error: "Prisma Client not generated"

**Solución:**
```bash
npx prisma generate
```

### Error: "Module not found"

**Solución:**
```bash
npm install
```

---

## 📊 Qué se Creará

Las migraciones crearán estas tablas en tu base de datos:

1. **Raffle** - Rifas/sorteos
2. **Ticket** - Boletos
3. **User** - Usuarios
4. **Purchase** - Compras
5. **Admin** - Administradores

---

## 🔄 Si Necesitas Resetear la Base de Datos

**⚠️ CUIDADO:** Esto eliminará TODOS los datos.

```bash
cd backend
npx prisma migrate reset
npx tsx src/scripts/seed.ts
```

---

## ✅ Checklist

- [ ] Obtuve la DATABASE_URL de Railway
- [ ] Creé el archivo `.env` en `backend/` con la DATABASE_URL
- [ ] Ejecuté `npm install` en la carpeta backend
- [ ] Ejecuté las migraciones
- [ ] Ejecuté el seed
- [ ] Verifiqué que las tablas se crearon (Prisma Studio)
- [ ] Probé el health check en Railway

---

## 🎉 ¡Listo!

Después de completar estos pasos:
- ✅ Tu base de datos estará configurada
- ✅ Tendrás un administrador creado
- ✅ El backend podrá conectarse correctamente
- ✅ Podrás usar el panel de administración




