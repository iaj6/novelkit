#!/usr/bin/env bash
set -euo pipefail

# Concatenate library/<book>/draft/*.md into library/<book>/manuscript.md.
# Chapters are emitted in numeric order based on their NN-* filename prefix.
#
# Usage:
#   press/concat_chapters.sh <book>      # concat one book
#   press/concat_chapters.sh             # concat every book under library/

PRESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$PRESS_DIR/common.sh"

concat_one() {
  local book="$1"
  local draft_dir="$(book_dir "$book")/draft"
  local out="$(book_path "$book")"

  if [[ ! -d "$draft_dir" ]]; then
    note "skip: $book (no draft/ directory)"
    return 0
  fi

  shopt -s nullglob
  local chapters=("$draft_dir"/[0-9][0-9]-*.md)
  shopt -u nullglob
  if [[ ${#chapters[@]} -eq 0 ]]; then
    note "skip: $book (no chapter files in draft/)"
    return 0
  fi

  local title
  title="$(book_title "$book")"
  [[ -n "$title" ]] || title="$book"

  note "concat: $book ($((${#chapters[@]})) chapters) → $out"
  {
    echo "# $title"
    echo
    for f in "${chapters[@]}"; do
      echo "<!-- source: $f -->"
      echo
      cat "$f"
      echo
      echo
    done
  } > "$out"
}

main() {
  if [[ $# -eq 1 ]]; then
    concat_one "$1"
    return 0
  fi

  shopt -s nullglob
  local dirs=("$(repo_root)"/library/*/)
  shopt -u nullglob
  for d in "${dirs[@]}"; do
    concat_one "$(basename "$d")"
  done
}

main "$@"
