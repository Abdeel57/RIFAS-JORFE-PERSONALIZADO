#!/bin/sh
# startup.sh — Railway deployment entry point
# Ejecuta: fix-schema → migrate deploy → seed → node

echo "=== STARTUP BEGIN ==="
echo "NODE_ENV=${NODE_ENV:-unset}"
echo "PORT=${PORT:-unset}"

if [ -n "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL=SET"
else
  echo "DATABASE_URL=NOT SET ⚠️"
fi

# ─── PASO 1: Reparar esquema directamente (bypassa el estado de Prisma) ─────
echo ""
echo "=== [1/4] fix-schema: aplicando columnas faltantes ==="
if node dist/scripts/fix-schema.js; then
  echo "=== fix-schema: OK ==="
else
  echo "=== fix-schema: FAILED (continuando de todas formas) ==="
fi

# ─── PASO 2: Aplicar migraciones pendientes con Prisma ── ───────────────────
echo ""
echo "=== [2/4] prisma migrate deploy ==="
if npx prisma migrate deploy; then
  echo "=== migrate deploy: OK ==="
else
  echo "=== migrate deploy: FAILED (posiblemente ya sincronizado por fix-schema) ==="
fi

# ─── PASO 3: Seed del admin (idempotente) ────────────────────────────────────
echo ""
echo "=== [3/4] seed ==="
if node dist/scripts/seed.js; then
  echo "=== seed: OK ==="
else
  echo "=== seed: FAILED (continuando) ==="
fi

# ─── PASO 4: Arrancar servidor ───────────────────────────────────────────────
echo ""
echo "=== [4/4] launching node dist/index.js ==="
exec node dist/index.js
