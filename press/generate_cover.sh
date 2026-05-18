#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT/scripts/common.sh"
source "$ROOT/scripts/load_env.sh" "$ROOT/.env"

need_cmd python3

book="${1:-book-one}"
with_text="${2:-}"

out_dir="$(repo_root)/build/assets"
mkdir -p "$out_dir"

title="${TITLE:-The Last Troll}"
author="${AUTHOR:-}"

out="$out_dir/cover-${book}.png"

note "generating cover for: $book"
note "output: $out"

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  die "OPENAI_API_KEY is not set (expected in $ROOT/.env or your shell environment)"
fi

prompt="$(python3 "$ROOT/scripts/build_cover_prompt.py" \
  --book "$book" \
  --title "$title" \
  --author "$author" \
  $( [[ "$with_text" == "--with-text" ]] && echo "--include-text" ) \
)"

python3 "$ROOT/scripts/generate_image.py" \
  --prompt "$prompt" \
  --out "$out" \
  --format png \
  --size 1024x1536
