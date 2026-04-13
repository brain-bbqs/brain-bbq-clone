#!/usr/bin/env bash
# Decrypt all .sql.enc migrations back to .sql (used in CI)
# Usage: MIGRATIONS_KEY=<passphrase> ./scripts/decrypt-migrations.sh
set -euo pipefail

DIR="supabase/migrations"

if [ -z "${MIGRATIONS_KEY:-}" ]; then
  echo "ERROR: MIGRATIONS_KEY environment variable is required" >&2
  exit 1
fi

count=0
for f in "$DIR"/*.sql.enc; do
  [ -f "$f" ] || continue
  out="${f%.enc}"
  openssl enc -aes-256-cbc -d -pbkdf2 -iter 100000 \
    -pass "pass:${MIGRATIONS_KEY}" \
    -in "$f" -out "$out"
  count=$((count + 1))
done

echo "Decrypted $count migration(s) → .sql"
