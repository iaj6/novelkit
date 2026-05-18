#!/usr/bin/env bash
set -euo pipefail

PRESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$PRESS_DIR/common.sh"

shopt -s nullglob
for d in "$(repo_root)"/library/*/; do
  book="$(basename "$d")"
  if [[ ! -f "$d/manuscript.md" ]]; then
    note "skip: $book (no manuscript.md — run press/concat_chapters.sh $book first)"
    continue
  fi
  "$PRESS_DIR/build_book.sh" "$book"
done
