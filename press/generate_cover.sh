#!/usr/bin/env bash
set -euo pipefail

PRESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$PRESS_DIR/common.sh"
source "$PRESS_DIR/load_env.sh" "$(repo_root)/.env"

need_cmd python3

book="${1:-}"
[[ -n "$book" ]] || die "usage: press/generate_cover.sh <book> [--with-text]"

with_text=""
for arg in "$@"; do
  if [[ "$arg" == "--with-text" ]]; then
    with_text="--include-text"
  fi
done

out_dir="$(build_dir "$book")"
mkdir -p "$out_dir"

# Title defaults come from book_title() in common.sh (cdk.config.json → book slug).
title="${TITLE:-$(book_title "$book")}"
[[ -n "$title" ]] || title="$book"
author="${AUTHOR:-}"

out="$out_dir/cover.png"

note "generating cover for: $book"
note "output: $out"

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  die "OPENAI_API_KEY is not set (expected in $(repo_root)/.env or your shell environment)"
fi

prompt="$(python3 "$PRESS_DIR/build_cover_prompt.py" \
  --book "$book" \
  --title "$title" \
  --author "$author" \
  $with_text \
)"

python3 "$PRESS_DIR/generate_image.py" \
  --prompt "$prompt" \
  --out "$out" \
  --format png \
  --size 1024x1536
