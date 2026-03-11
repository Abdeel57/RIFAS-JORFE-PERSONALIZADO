# Despliegue como plantilla Railway (todo-en-uno)

Esta guía describe cómo desplegar la aplicación de sorteos como un único servicio en Railway, con frontend, admin y API en la misma URL.

## Requisitos previos

- Cuenta en [Railway](https://railway.app)
- Repositorio en GitHub (público o privado con acceso configurado)
- Opcional: [Google AI Studio](https://aistudio.google.com) para API key de Gemini (chatbot)

## URLs por instancia

Tras el despliegue, una sola URL sirve todo:

| Ruta | Descripción |
|------|-------------|
| `/` | Tienda de sorteos (frontend público) |
| `/admin` | Panel de administración |
| `/api` | API REST |
| `/health` | Health check |

## Despliegue desde template

### 1. Crear el template (una sola vez)

1. Despliega el proyecto manualmente en Railway desde el repo.
2. Añade **PostgreSQL** como add-on (New → Database → PostgreSQL).
3. En el proyecto: **Settings** (esquina superior derecha) → **Generate Template from Project**.
4. Configura las variables del template:
   - `DATABASE_URL`: referencia `${{Postgres.DATABASE_URL}}`
   - `JWT_SECRET`: `${{secret(32)}}`
   - `NODE_ENV`: `production`
   - `GEMINI_API_KEY`: (opcional, dejar vacío o pedir al usuario)
5. Guarda el template en tu Workspace.

### 2. Desplegar para cada cliente

1. En Railway: **Deploy from Template**.
2. Selecciona tu template.
3. Conecta el repo (o usa el mismo repo para todas las instancias).
4. Railway crea proyecto + PostgreSQL + servicio.
5. Espera a que termine el build y el deploy.

## Variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `DATABASE_URL` | Sí | URL de PostgreSQL (Railway la genera al añadir la DB) |
| `JWT_SECRET` | Sí | Mínimo 32 caracteres para firmar tokens |
| `NODE_ENV` | Recomendado | `production` |
| `GEMINI_API_KEY` | No | Para el chatbot de soporte (IA) |
| `FRONTEND_URL` | No | Solo si usas frontend externo; en todo-en-uno no hace falta |

## Configurar health check en Railway

1. Servicio → **Settings** → **Health Check**.
2. **Path**: `/health`
3. **Timeout**: 30 segundos (o el valor por defecto)

## Checklist post-deploy

1. **Acceder al admin**: `https://[tu-url].up.railway.app/admin`
2. **Login por defecto** (creado por el seed):
   - Email: `admin@bismark.com`
   - Password: `admin123456`
3. **Cambiar la contraseña** en la primera sesión (si hay opción).
4. **Configurar SystemSettings** (Admin → Configuración):
   - Logo y nombre del sitio
   - Datos bancarios (CLABE, beneficiario, etc.)
   - WhatsApp, email, redes sociales
5. **Crear o editar rifas** según necesites.
6. **Probar una compra** desde la tienda (`/`).

## Primeros pasos

- **Crear rifa**: Admin → Rifas → Nueva rifa.
- **Probar compra**: Ir a `/`, seleccionar boletos, completar checkout.
- **Verificar boletos**: El cliente puede usar `/#verify` con su teléfono.
- **Comprobante digital**: Tras marcar pago, el admin puede enviar el enlace `/#comprobante?purchase=ID` por WhatsApp.

## Dominio personalizado

1. Servicio → **Settings** → **Networking** → **Generate Domain**.
2. O añade un dominio propio en la misma sección.

## Solución de problemas

- **Build falla**: Revisa los logs. Suele ser por `DATABASE_URL` o `JWT_SECRET` faltantes.
- **404 en /admin**: El build del admin puede haber fallado; revisa que el Dockerfile incluya la etapa de admin.
- **API no responde**: Comprueba que `DATABASE_URL` y `JWT_SECRET` estén configuradas.
- **Health check falla**: Usa `/health` como path, no `/`.
