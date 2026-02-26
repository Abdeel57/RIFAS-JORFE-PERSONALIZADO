# Migraciones y dependencias sin usar consola en Railway

## Qué hacer (resumen)

1. **Dependencias**  
   En tu PC, desde la raíz del repo:
   ```bash
   cd backend
   npm install
   ```
   Luego haz **push** al repositorio. En el próximo deploy, Railway volverá a ejecutar `npm install` durante el build y tendrá todas las dependencias (incluidas `multer` y `sharp`).

2. **Migraciones**  
   No hace falta ejecutar nada a mano en Railway. El comando de arranque del backend ya incluye:
   ```bash
   npx prisma migrate deploy && node dist/index.js
   ```
   Cada vez que Railway inicia el servicio, aplica las migraciones pendientes (por ejemplo la tabla `StoredImage` para las imágenes subidas desde el admin).

   **Solo haz push** del código (incluida la carpeta `prisma/migrations`). En el siguiente deploy, al arrancar, se aplicará la migración automáticamente.

## Opcional: aplicar la migración desde tu PC

Si quieres aplicar la migración tú mismo contra la base de datos de Railway:

1. En **Railway** → tu proyecto → servicio **Backend** o **Postgres** → pestaña **Variables**.
2. Copia el valor de **`DATABASE_URL`**.
3. En tu PC, dentro de la carpeta `backend`, crea o edita el archivo **`.env`** y pega:
   ```
   DATABASE_URL="postgresql://..."
   ```
   (la URL completa que copiaste).

4. En la terminal (desde la carpeta del repo):
   ```bash
   cd backend
   npm install
   npx prisma migrate deploy
   ```
5. Verás algo como: `Applying migration 20260226120000_add_stored_image`.  
   A partir de ahí, la base de datos en Railway ya tiene la tabla `StoredImage` y el próximo deploy no tendrá migraciones pendientes.
