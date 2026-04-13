#!/usr/bin/env bash
# Encrypt all plaintext .sql migrations to .sql.enc (AES-256-CBC via openssl)
# Usage: MIGRATIONS_KEY=<passphrase> ./scripts/encrypt-migrations.sh
set -euo pipefail

DIR="supabase/migrations"

if [ -z "${MIGRATIONS_KEY:-}" ]; then
  echo "ERROR: MIGRATIONS_KEY environment variable is required" >&2
  exit 1
fi

count=0
for f in "$DIR"/*.sql; do
  [ -f "$f" ] || continue
  openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 \
    -pass "pass:${MIGRATIONS_KEY}" \
    -in "$f" -out "${f}.enc"
  rm "$f"
  count=$((count + 1))
done

echo "Encrypted $count migration(s) → .sql.enc"
