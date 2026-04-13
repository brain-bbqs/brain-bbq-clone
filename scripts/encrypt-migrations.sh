#!/usr/bin/env bash
# Encrypt all plaintext .sql migrations to .sql.gpg
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
  gpg --batch --yes --symmetric --cipher-algo AES256 \
      --passphrase "$MIGRATIONS_KEY" \
      --output "${f}.gpg" "$f"
  rm "$f"
  count=$((count + 1))
done

echo "Encrypted $count migration(s) → .sql.gpg"
