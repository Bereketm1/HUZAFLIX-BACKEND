#!/bin/bash
set -euo pipefail

# Creates the databases required by the local development stack if they don't exist.
# This script is executed by the official postgres image when the container initializes
# (it will *not* run on already-initialized data directories).

DBS=(
  "huzaflix"
  "huzaflix_dev"
  "huzaflix_dev_payment"
  "huzaflix_dev_api"
  "huzaflix_dev_audit"
)

for DB in "${DBS[@]}"; do
  echo "Checking database: $DB"
  if psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB'" | grep -q 1; then
    echo "  -> exists"
  else
    echo "  -> creating $DB"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres -c "CREATE DATABASE \"$DB\";"
  fi
done

echo "All required databases are present."