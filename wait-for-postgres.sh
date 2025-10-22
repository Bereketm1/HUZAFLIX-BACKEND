#!/usr/bin/env bash

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

echo "Postgres is up - executing command: $@"

echo "Running database migrations..."
npm run migration:run

echo "Seeding database..."
npm run seed

echo "Starting server..."
exec "$@"
