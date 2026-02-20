# 🗄️ Ejecutar Migraciones desde Local

## 📋 Pasos para Conectarte a Railway DB desde Local

### Paso 1: Obtener DATABASE_URL de Railway

1. Ve a Railway → Tu Servicio PostgreSQL
2. Click en la pestaña **"Variables"**
3. Busca `DATABASE_URL` o `POSTGRES_URL`
4. **Copia el valor completo** (será algo como: `postgresql://postgres:password@host:port/railway`)

### Paso 2: Configurar Variable de Entorno Local

Crea un archivo `.env` en la carpeta `backend/` con:

```env
DATABASE_URL=<pega aquí la DATABASE_URL de Railway>
```

**IMPORTANTE:** No commitees este archivo (ya está en .gitignore)

### Paso 3: Ejecutar Migraciones

Desde la terminal, en la carpeta `backend/`:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
```

### Paso 4: Ejecutar Seed (Crear Administrador)

```bash
npx tsx src/scripts/seed.ts
```

---

## 🔍 Verificación

Después de ejecutar las migraciones, puedes verificar con:

```bash
npx prisma studio
```

Esto abrirá una interfaz visual para ver las tablas creadas.

---

## ⚠️ Notas Importantes

1. **Seguridad**: No compartas tu `DATABASE_URL` públicamente
2. **Conexión**: Asegúrate de que tu IP pueda conectarse a Railway (Railway permite conexiones externas por defecto)
3. **Backup**: Las migraciones son destructivas, asegúrate de tener backup si hay datos importantes




