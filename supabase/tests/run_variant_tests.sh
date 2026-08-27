#!/usr/bin/env bash
# Local smoke test for the variant checkout migration.
# Requires a throwaway PostgreSQL 16 instance (see README notes in this folder).
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
CONTAINER="${PG_CONTAINER:-nexuspg}"
DB="${PG_DB:-nexus_test}"

docker exec -i "$CONTAINER" psql -U postgres -c "DROP DATABASE IF EXISTS $DB" >/dev/null
docker exec -i "$CONTAINER" psql -U postgres -c "CREATE DATABASE $DB" >/dev/null
docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -U postgres -d "$DB" < "$DIR/stubs.sql"
docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -U postgres -d "$DB" < "$DIR/../../SUPABASE_SETUP.sql" >/dev/null
docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -U postgres -d "$DB" < "$DIR/../PRODUCT_VARIANTS_MIGRATION.sql" >/dev/null
docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -U postgres -d "$DB" < "$DIR/../ADD_ALLOW_QUANTITY_SELECTION.sql" >/dev/null
docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -U postgres -d "$DB" < "$DIR/../PRODUCT_VARIANTS_ORDERS_MIGRATION.sql" >/dev/null
docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -U postgres -d "$DB" < "$DIR/variant_checkout_test.sql"
