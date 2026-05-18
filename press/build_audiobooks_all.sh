#!/usr/bin/env bash
set -euo pipefail

PRESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$PRESS_DIR/common.sh"

# Default: ElevenLabs. Pass --openai to use the OpenAI TTS pipeline instead.
script="$PRESS_DIR/build_audiobook.sh"
for arg in "$@"; do
  if [[ "$arg" == "--openai" ]]; then
    script="$PRESS_DIR/build_audiobook_openai.sh"
  fi
done

shopt -s nullglob
for d in "$(repo_root)"/library/*/; do
  book="$(basename "$d")"
  if [[ ! -f "$d/manuscript.md" ]]; then
    note "skip: $book (no manuscript.md — run press/concat_chapters.sh $book first)"
    continue
  fi
  "$script" "$book"
done
