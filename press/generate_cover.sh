#!/usr/bin/env bash
set -euo pipefail

# Generate a cover for one book.
#
# Default pipeline: canon → Claude (visual brief synthesis) → OpenAI image model.
# The synthesis step costs roughly $0.01–0.02 in Anthropic spend per cover and
# substantially improves how book-specific the cover is.
#
# Pass --no-synthesis to skip the Claude step and feed raw canon directly to
# the image model (cheaper, but the model has to do its own canon parsing).

PRESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$PRESS_DIR/common.sh"
source "$PRESS_DIR/load_env.sh" "$(repo_root)/.env"

need_cmd python3

book="${1:-}"
[[ -n "$book" ]] || die "usage: press/generate_cover.sh <book> [--with-text] [--no-synthesis]"
shift

with_text=""
synthesize=1
for arg in "$@"; do
  case "$arg" in
    --with-text)    with_text="--include-text" ;;
    --no-synthesis) synthesize=0 ;;
    *) die "unknown flag: $arg" ;;
  esac
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

if [[ "$synthesize" == "1" ]]; then
  if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
    die "ANTHROPIC_API_KEY is not set (needed for cover-brief synthesis).
Set it in $(repo_root)/.env, or pass --no-synthesis to use raw canon extraction."
  fi
  note "synthesizing cover brief via Claude (${ANTHROPIC_COVER_MODEL:-claude-sonnet-4-6})"
  prompt="$(python3 "$PRESS_DIR/synthesize_cover_brief.py" \
    --book "$book" \
    --title "$title" \
    --author "$author" \
    $with_text \
  )"
else
  note "using raw canon extraction (no synthesis)"
  prompt="$(python3 "$PRESS_DIR/build_cover_prompt.py" \
    --book "$book" \
    --title "$title" \
    --author "$author" \
    $with_text \
  )"
fi

# Save the prompt for inspection / reproducibility.
prompt_file="$out_dir/cover-prompt.md"
printf '%s\n' "$prompt" > "$prompt_file"
note "prompt saved: $prompt_file"

python3 "$PRESS_DIR/generate_image.py" \
  --prompt "$prompt" \
  --out "$out" \
  --format png \
  --size 1024x1536
