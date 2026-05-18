#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/scripts/common.sh"

for book in book-one book-two book-three; do
  "$ROOT/scripts/build_book.sh" "$book"
done

