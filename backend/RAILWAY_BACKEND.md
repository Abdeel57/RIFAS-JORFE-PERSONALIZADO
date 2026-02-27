# Configuración del servicio Backend en Railway

El backend se construye con **Nixpacks** (no con Dockerfile) para que Chromium y la verificación Banxico funcionen y los logs del build se vean bien.

## Pasos en Railway (solo una vez)

1. Entra a tu proyecto en **Railway**.
2. Haz clic en el servicio **BACKEND**.
3. Ve a **Settings**.
4. En **Build** / **Source**, pon **Root Directory** = **`backend`** (sin barra final).
5. Si en **Builder** estaba "Dockerfile", cámbialo a **Nixpacks** o **Auto** (ya no hay Dockerfile en backend; se usa `nixpacks.toml`).
6. Guarda y lanza un nuevo deploy (o haz push a GitHub).

Con **Root Directory** = `backend`, el build se hace desde la carpeta `backend`, Nixpacks instala Chromium y dependencias, y el servicio arranca con `npm start`. Si el build fallaba antes sin logs, suele ser por usar Dockerfile con contexto incorrecto; sin Dockerfile, Nixpacks suele mostrar los pasos del build con normalidad.
