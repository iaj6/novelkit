#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/scripts/common.sh"

need_cmd pandoc

book="${1:-}"
[[ -n "$book" ]] || die "usage: scripts/html_to_pdf.sh <book-one|book-two|book-three>"

in_html="$(build_dir "$book")/$book.html"
[[ -f "$in_html" ]] || die "missing HTML (build it first): $in_html"

out_dir="$(build_dir "$book")"
mkdir -p "$out_dir"

out_pdf="$out_dir/$book.pdf"

note "building PDF: $out_pdf"

# Help macOS find Homebrew dynamic libraries for WeasyPrint (Pango/GObject/etc).
export DYLD_FALLBACK_LIBRARY_PATH="/opt/homebrew/lib:${DYLD_FALLBACK_LIBRARY_PATH:-}"
# Keep fontconfig cache inside the repo (avoids macOS permission/cache warnings).
export XDG_CACHE_HOME="$(repo_root)/build/.cache"
mkdir -p "$XDG_CACHE_HOME/fontconfig"

if opt_cmd weasyprint; then
  note "using weasyprint"
  weasyprint "$in_html" "$out_pdf"
elif opt_cmd wkhtmltopdf; then
  note "using wkhtmltopdf"
  wkhtmltopdf --quiet "$in_html" "$out_pdf"
elif python3 - <<'PY' >/dev/null 2>&1
import importlib.util
raise SystemExit(0 if importlib.util.find_spec("weasyprint") else 1)
PY
then
  note "using python -m weasyprint"
  python3 -m weasyprint "$in_html" "$out_pdf"
else
  # Fallback: use pandoc + LaTeX, which is installed in this environment.
  # This won’t match CSS-based HTML rendering, but it produces a reliable PDF.
  note "no HTML->PDF engine found; falling back to pandoc --pdf-engine=xelatex"
  in_md="$(book_path "$book")"
  meta=()
  while IFS= read -r line; do
    meta+=("$line")
  done < <(metadata_args "$book")
  pandoc "$in_md" \
    --pdf-engine=xelatex \
    --toc \
    --toc-depth=2 \
    "${meta[@]}" \
    -o "$out_pdf"
fi

note "done: $out_pdf"
