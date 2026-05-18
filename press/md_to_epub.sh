#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/scripts/common.sh"

need_cmd pandoc

book="${1:-}"
[[ -n "$book" ]] || die "usage: scripts/md_to_epub.sh <book-one|book-two|book-three>"

in="$(book_path "$book")"
[[ -f "$in" ]] || die "missing manuscript: $in"

out_dir="$(build_dir "$book")"
mkdir -p "$out_dir"

out="$out_dir/$book.epub"
css="$ROOT/scripts/book.css"
filter="$ROOT/scripts/filters/chapter_headings.lua"
cover_src="$(repo_root)/build/assets/cover-${book}.png"
cover_dst="$out_dir/cover.png"

meta=()
while IFS= read -r line; do
  meta+=("$line")
done < <(metadata_args "$book")

epub_cover_args=()
if [[ -f "$cover_src" ]]; then
  cp -f "$cover_src" "$cover_dst"
  epub_cover_args+=(--epub-cover-image "$cover_dst")
fi

note "building EPUB: $out"
pandoc "$in" \
  --toc \
  --toc-depth=2 \
  --split-level=2 \
  --lua-filter "$filter" \
  --css "$css" \
  "${epub_cover_args[@]}" \
  "${meta[@]}" \
  -o "$out"

note "done: $out"
