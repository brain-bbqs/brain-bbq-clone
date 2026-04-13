#!/usr/bin/env bash
# Decrypt all .sql.gpg migrations back to .sql (used in CI)
# Usage: MIGRATIONS_KEY=<passphrase> ./scripts/decrypt-migrations.sh
set -euo pipefail

DIR="supabase/migrations"

if [ -z "${MIGRATIONS_KEY:-}" ]; then
  echo "ERROR: MIGRATIONS_KEY environment variable is required" >&2
  exit 1
fi

count=0
for f in "$DIR"/*.sql.gpg; do
  [ -f "$f" ] || continue
  out="${f%.gpg}"
  gpg --batch --yes --decrypt \
      --passphrase "$MIGRATIONS_KEY" \
      --output "$out" "$f"
  count=$((count + 1))
done

echo "Decrypted $count migration(s) → .sql"
