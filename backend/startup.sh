#!/bin/sh
set -e

echo "=== STARTUP: begin ==="
echo "NODE_ENV=${NODE_ENV:-}"
echo "PORT=${PORT:-}"

if [ -n "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL_SET=true"
else
  echo "DATABASE_URL_SET=false"
fi

if [ -n "${JWT_SECRET:-}" ]; then
  echo "JWT_SECRET_SET=true"
else
  echo "JWT_SECRET_SET=false"
fi

# Paso 1: Limpiar migraciones fallidas/bloqueadas antes de intentar deploy
echo "=== STARTUP: resolving stuck migrations ==="
if node dist/scripts/resolve-failed-migration.js; then
  echo "=== STARTUP: resolve-migration ok ==="
else
  echo "=== STARTUP: resolve-migration failed (continuing anyway) ==="
fi

# Paso 2: Aplicar migraciones pendientes
echo "=== STARTUP: migrate deploy ==="
if npx prisma migrate deploy; then
  echo "=== STARTUP: migrate ok ==="
else
  echo "=== STARTUP: migrate deploy FAILED ==="
  echo "=== Check logs above for details ==="
  # Continuar de todas formas para que la app arranque
fi

# Paso 3: Seed del admin (idempotente)
echo "=== STARTUP: seeding admin ==="
if node dist/scripts/seed.js; then
  echo "=== STARTUP: seed ok ==="
else
  echo "=== STARTUP: seed failed (revisa logs arriba) - continuando ==="
fi

echo "=== STARTUP: launching node ==="
exec node dist/index.js
