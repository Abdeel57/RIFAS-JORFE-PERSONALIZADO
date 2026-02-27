# Configuración del servicio Backend en Railway

Para que el **build con Dockerfile** funcione (y con él la verificación automática con Banxico), el servicio **BACKEND** debe usar la carpeta `backend` como raíz.

## Pasos en Railway (solo una vez)

1. Entra a tu proyecto en **Railway**.
2. Haz clic en el servicio **BACKEND** (no en Database).
3. Ve a la pestaña **Settings**.
4. En **Build**, busca **Root Directory** (o "Source" / "Monorepo").
5. Pon exactamente: **`backend`** (sin barra al final).
6. Guarda si hace falta. En **Builder** deja **Dockerfile** (o "Dockerfile" si está la opción).
7. Dispara un nuevo deploy (Deployments → "Deploy" o push a GitHub).

Con eso, el contexto del build es la carpeta `backend`, el Dockerfile encuentra `package.json`, `prisma/` y `startup.sh`, y Chromium se instala correctamente para Banxico CEP.
