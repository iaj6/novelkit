#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/scripts/common.sh"

book="${1:-}"
[[ -n "$book" ]] || die "usage: scripts/build_book.sh <book-one|book-two|book-three>"

"$ROOT/scripts/md_to_html.sh" "$book"
"$ROOT/scripts/md_to_epub.sh" "$book"
"$ROOT/scripts/html_to_pdf.sh" "$book"

