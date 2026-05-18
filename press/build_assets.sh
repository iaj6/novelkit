#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT/scripts/common.sh"
source "$ROOT/scripts/load_env.sh" "$ROOT/.env"

with_text="${1:-}"

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  die "OPENAI_API_KEY is not set (expected in $ROOT/.env or your shell environment)"
fi

for book in book-one book-two book-three; do
  if [[ "$with_text" == "--with-text" ]]; then
    "$ROOT/scripts/generate_cover.sh" "$book" --with-text
  else
    "$ROOT/scripts/generate_cover.sh" "$book"
  fi
done

note "rebuilding outputs with embedded covers"
"$ROOT/scripts/build_all.sh"

