#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/scripts/common.sh"

need_cmd pandoc

book="${1:-}"
[[ -n "$book" ]] || die "usage: scripts/md_to_html.sh <book-one|book-two|book-three>"

in="$(book_path "$book")"
[[ -f "$in" ]] || die "missing manuscript: $in"

out_dir="$(build_dir "$book")"
mkdir -p "$out_dir"

out="$out_dir/$book.html"
css="$ROOT/scripts/book.css"
template="$ROOT/scripts/templates/book.html"
filter="$ROOT/scripts/filters/chapter_headings.lua"
cover_src="$(repo_root)/build/assets/cover-${book}.png"
cover_dst="$out_dir/cover.png"

meta=()
while IFS= read -r line; do
  meta+=("$line")
done < <(metadata_args "$book")

if [[ -f "$cover_src" ]]; then
  cp -f "$cover_src" "$cover_dst"
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
