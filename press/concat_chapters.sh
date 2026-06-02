#!/usr/bin/env bash
set -euo pipefail

# Concatenate library/<book>/draft/*.md into library/<book>/manuscript.md.
# Chapters are emitted in numeric order based on their NN-* filename prefix.
#
# If library/<book>/revision-1/<chapter>.md exists for a given chapter,
# the revision file is used in place of the draft file. This lets the
# `cdk repair` pipeline land corrections in revision-1/ without mutating
# the original drafts, while still flowing through to the published
# manuscript automatically.
#
# Usage:
#   press/concat_chapters.sh <book>      # concat one book
#   press/concat_chapters.sh             # concat every book under library/

PRESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$PRESS_DIR/common.sh"

concat_one() {
  local book="$1"
  local book_root="$(book_dir "$book")"
  local draft_dir="$book_root/draft"
  local revision_dir="$book_root/revision-1"
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

  local revisions_used=0
  note "concat: $book ($((${#chapters[@]})) chapters) → $out"
  {
    echo "# $title"
    echo
    for f in "${chapters[@]}"; do
      local basename
      basename="$(basename "$f")"
      local source_file="$f"
      if [[ -f "$revision_dir/$basename" ]]; then
        source_file="$revision_dir/$basename"
        revisions_used=$((revisions_used + 1))
      fi
      echo "<!-- source: $source_file -->"
      echo
      cat "$source_file"
      echo
      echo
    done
  } > "$out"

  if [[ $revisions_used -gt 0 ]]; then
    note "  used revision-1/ for $revisions_used chapter(s)"
  fi
}

main() {
  if [[ $# -eq 1 ]]; then
    concat_one "$1"
    return 0
  fi

  shopt -s nullglob
  local dirs=("$(repo_root)"/library/*/)
  shopt -u nullglob
  # `${arr[@]+...}` guards the empty case: under `set -u` on bash 3.2 (macOS),
  # a bare "${dirs[@]}" with no matches raises "unbound variable".
  for d in ${dirs[@]+"${dirs[@]}"}; do
    concat_one "$(basename "$d")"
  done
}

main "$@"
