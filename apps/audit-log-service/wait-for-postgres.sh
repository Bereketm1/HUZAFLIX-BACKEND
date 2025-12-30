#!/bin/sh

# usage: ./wait-for-postgres.sh <cmd...>
# waits for POSTGRES host:port to be available then runs migrations then execs the provided command

set -e

HOST=${DB_HOST:-postgres}
PORT=${POSTGRES_PORT:-5432}
DB_USER=${POSTGRES_USER:-postgres}
DB_PASSWORD=${POSTGRES_PASSWORD:-postgres}
DB_NAME=${POSTGRES_DB:-postgres}

echo "Waiting for Postgres at ${HOST}:${PORT}..."

while ! nc -z "$HOST" "$PORT"; do
  echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "Postgres is up - checking database..."

sleep 2

echo "Ensuring database '${DB_NAME}' exists..."
DB_EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$HOST" -p "$PORT" -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" || echo "")

if [ -z "$DB_EXISTS" ]; then
  echo "Database '${DB_NAME}' does not exist. Creating it..."
  PGPASSWORD="$DB_PASSWORD" psql -h "$HOST" -p "$PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE ${DB_NAME}"
  echo "Database '${DB_NAME}' created successfully"
else
  echo "Database '${DB_NAME}' already exists"
fi

echo "Running database migrations..."
pnpm migration:run

echo "Postgres is ready - executing command: $@"
exec "$@"
