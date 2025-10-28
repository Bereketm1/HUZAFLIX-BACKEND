#!/bin/sh

# usage: ./wait-for-postgres.sh <cmd...>
# waits for POSTGRES host:port to be available then exec the provided command

set -e

HOST=${DB_HOST:-postgres}
PORT=${POSTGRES_PORT:-5432}

echo "Waiting for Postgres at ${HOST}:${PORT}..."

# loop until tcp connection succeeds
while ! nc -z "$HOST" "$PORT"; do
  echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "Running database migrations..."
pnpm run migration:run

echo "Seeding database..."
pnpm run seed

echo "Postgres is up - executing command: $@"
exec "$@"
