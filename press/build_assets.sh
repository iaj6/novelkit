#!/usr/bin/env bash
set -euo pipefail

PRESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$PRESS_DIR/common.sh"
source "$PRESS_DIR/load_env.sh" "$(repo_root)/.env"

# Generate covers for every book in library/, then rebuild HTML/EPUB/PDF
# so the cover is embedded in the outputs.

with_text=""
for arg in "$@"; do
  if [[ "$arg" == "--with-text" ]]; then
    with_text="--with-text"
  fi
done

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  die "OPENAI_API_KEY is not set (expected in $(repo_root)/.env or your shell environment)"
fi

shopt -s nullglob
for d in "$(repo_root)"/library/*/; do
  book="$(basename "$d")"
  if [[ ! -d "$d/canon" ]]; then
    note "skip: $book (no canon/ directory)"
    continue
  fi
  "$PRESS_DIR/generate_cover.sh" "$book" $with_text
done

note "rebuilding outputs with embedded covers"
"$PRESS_DIR/build_all.sh"
