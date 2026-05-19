#!/usr/bin/env bash
set -euo pipefail

PRESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$PRESS_DIR/common.sh"

need_cmd pandoc

book="${1:-}"
[[ -n "$book" ]] || die "usage: press/md_to_epub.sh <book>"

in="$(book_path "$book")"
[[ -f "$in" ]] || die "missing manuscript: $in (run press/concat_chapters.sh $book first)"

out_dir="$(build_dir "$book")"
mkdir -p "$out_dir"

out="$out_dir/$book.epub"
css="$PRESS_DIR/book.css"
filter="$PRESS_DIR/filters/chapter_headings.lua"
cover_src="$out_dir/cover.png"

meta=()
while IFS= read -r line; do
  meta+=("$line")
done < <(metadata_args "$book")

epub_cover_args=()
if [[ -f "$cover_src" ]]; then
  epub_cover_args+=(--epub-cover-image "$cover_src")
fi

note "building EPUB: $out"
pandoc "$in" \
  --toc \
  --toc-depth=2 \
  --split-level=2 \
  --lua-filter "$filter" \
  --css "$css" \
  ${epub_cover_args[@]+"${epub_cover_args[@]}"} \
  ${meta[@]+"${meta[@]}"} \
  -o "$out"

note "done: $out"
