#!/usr/bin/env bash
set -euo pipefail

PRESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$PRESS_DIR/common.sh"

need_cmd pandoc

book="${1:-}"
[[ -n "$book" ]] || die "usage: press/md_to_html.sh <book>"

in="$(book_path "$book")"
[[ -f "$in" ]] || die "missing manuscript: $in (run press/concat_chapters.sh $book first)"

out_dir="$(build_dir "$book")"
mkdir -p "$out_dir"

out="$out_dir/$book.html"
# Ship the stylesheet alongside the HTML and reference it relatively —
# an absolute path here ends up verbatim in the <link> href and 404s
# once the edition is synced to the deployed site.
cp "$PRESS_DIR/book.css" "$out_dir/book.css"
css="book.css"
template="$PRESS_DIR/templates/book.html"
filter="$PRESS_DIR/filters/chapter_headings.lua"
cover_src="$out_dir/cover.png"

meta=()
while IFS= read -r line; do
  meta+=("$line")
done < <(metadata_args "$book")

if [[ -f "$cover_src" ]]; then
  meta+=(--metadata "cover_image=cover.png")
fi

note "building HTML: $out"
pandoc "$in" \
  --standalone \
  --template "$template" \
  --lua-filter "$filter" \
  --toc \
  --toc-depth=2 \
  --css "$css" \
  "${meta[@]}" \
  -o "$out"

note "done: $out"
