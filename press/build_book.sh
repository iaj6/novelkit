#!/usr/bin/env bash
set -euo pipefail

PRESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$PRESS_DIR/common.sh"

book="${1:-}"
[[ -n "$book" ]] || die "usage: press/build_book.sh <book>"

"$PRESS_DIR/md_to_html.sh" "$book"
"$PRESS_DIR/md_to_epub.sh" "$book"
"$PRESS_DIR/html_to_pdf.sh" "$book"
