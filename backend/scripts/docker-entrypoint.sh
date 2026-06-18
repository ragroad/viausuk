#!/bin/sh
set -e

# Prototype default — matches docker-compose postgres service
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="postgresql://postgres:postgres@postgres:5432/via"
  echo "ℹ️  DATABASE_URL not set — using default: postgresql://postgres:postgres@postgres:5432/via"
fi

POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

echo "⏳ Waiting for PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT}..."

TRIES=30
while ! nc -z "$POSTGRES_HOST" "$POSTGRES_PORT" 2>/dev/null; do
  TRIES=$((TRIES - 1))
  if [ "$TRIES" -le 0 ]; then
    echo "❌ Database not reachable. Start PostgreSQL first:"
    echo "   docker compose up postgres -d"
    echo "   Or set DATABASE_URL to your Postgres connection string."
    exit 1
  fi
  sleep 2
done

echo "✓  PostgreSQL is ready"
echo "⏳ Syncing database schema..."
npx prisma db push

echo "⏳ Seeding demo data..."
npm run db:seed

echo "🚀 Starting VIA backend on port ${PORT:-3001}..."
exec node dist/index.js
