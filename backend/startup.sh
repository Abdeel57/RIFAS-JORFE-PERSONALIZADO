#!/bin/sh
set -eu

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

echo "=== STARTUP: migrate deploy ==="
if npx prisma migrate deploy; then
  echo "=== STARTUP: migrate ok ==="
else
  echo "=== STARTUP: migrate failed (continuing) ==="
fi

echo "=== STARTUP: seeding admin ==="
if node dist/scripts/seed.js 2>/dev/null; then
  echo "=== STARTUP: seed ok ==="
else
  echo "=== STARTUP: seed skipped or failed (continuing) ==="
fi

echo "=== STARTUP: launching node ==="
exec node dist/index.js

