# Debug: DATABASE_URL no encontrada en Railway

Si tienes todo configurado pero sigue fallando con "Environment variable not found: DATABASE_URL", revisa esto:

---

## 1. ¿La variable está en el servicio correcto?

**La variable debe estar en el servicio BACKEND**, no solo en el proyecto.

- Abre el **servicio que ejecuta tu API** (el que tiene el código Node/Express).
- Ve a **Variables**.
- Debe existir `DATABASE_URL` ahí.

El servicio PostgreSQL tiene sus propias variables; el backend necesita una **copia** o **referencia**.

---

## 2. Usar referencia correcta

En el servicio backend → Variables → `DATABASE_URL` debe ser una **referencia** al PostgreSQL:

```
${{Postgres.DATABASE_URL}}
```

**Importante:** El nombre `Postgres` debe coincidir exactamente con el nombre de tu servicio PostgreSQL en Railway. Si se llama "PostgreSQL" o "postgres-db", usa:

```
${{PostgreSQL.DATABASE_URL}}
```

o

```
${{postgres-db.DATABASE_URL}}
```

---

## 3. Añadir referencia desde Railway

1. Servicio **backend** → pestaña **Variables**.
2. Clic en **"+ New Variable"** o **"Add Variable Reference"**.
3. Si hay **"Add Variable Reference"**: elige el servicio PostgreSQL y la variable `DATABASE_URL`.
4. Si no: crea variable manualmente:
   - **Name:** `DATABASE_URL`
   - **Value:** `${{Postgres.DATABASE_URL}}` (ajusta el nombre del servicio)

---

## 4. Conectar PostgreSQL al backend

En Railway, a veces hay que "conectar" la base de datos al servicio:

1. Abre el servicio **backend**.
2. Ve a **Settings** o **Variables**.
3. Busca **"Connect"**, **"Add Reference"** o **"Link Database"**.
4. Selecciona el servicio PostgreSQL para que Railway inyecte `DATABASE_URL`.

---

## 5. Esperar al redespliegue

Cada cambio de variables provoca un **nuevo deploy**. Espera a que termine por completo antes de probar.

---

## 6. Verificar en los logs

En el deploy del backend, al iniciar deberías ver algo como:

```
DATABASE_URL_SET=true
```

Si aparece `DATABASE_URL_SET=false`, la variable no está llegando al servicio.

---

## 7. Si usas Dockerfile

Con Dockerfile, las variables se inyectan en **runtime**, no en build. Prisma las usa al iniciar, así que debería funcionar. Si falla, comprueba que no haya un `.env` en el build que sobrescriba o oculte la variable.

---

## 8. Checklist rápido

- [ ] `DATABASE_URL` está en el **servicio backend** (no solo en PostgreSQL)
- [ ] El valor es una referencia: `${{NombreDelServicioPostgres.DATABASE_URL}}`
- [ ] El nombre del servicio PostgreSQL coincide exactamente
- [ ] El último deploy terminó correctamente
- [ ] En los logs de inicio aparece `DATABASE_URL_SET=true`

---

## 9. Solución de emergencia

Si nada funciona, añade la variable **directamente** (sin referencia):

1. Servicio PostgreSQL → Variables → copia el valor completo de `DATABASE_URL`.
2. Servicio backend → Variables → New Variable.
3. **Name:** `DATABASE_URL`
4. **Value:** pega la URL completa (usa la **pública** si el backend está en otro proyecto).

Esto evita referencias y confirma que el problema es la inyección de variables.
