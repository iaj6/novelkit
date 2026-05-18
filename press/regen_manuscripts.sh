#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/scripts/common.sh"

regen_one() {
  local book="$1"
  local out="$ROOT/manuscript/$book.md"
  local dir="$ROOT/draft/$book"

  [[ -d "$dir" ]] || die "missing draft dir: $dir"

  note "regenerating: $out"
  {
    echo "# The Last Troll — ${book//-/ } (Manuscript)"
    echo

    if [[ -f "$dir/00-prologue-the-ruin-that-remembers.md" ]]; then
      echo "<!-- source: $dir/00-prologue-the-ruin-that-remembers.md -->"
      echo
      cat "$dir/00-prologue-the-ruin-that-remembers.md"
      echo
      echo
    fi

    for f in "$dir"/[0-9][0-9]-*.md; do
      base="$(basename "$f")"
      [[ "$base" == "00-prologue-"* ]] && continue
      [[ "$base" == ".keep" ]] && continue
      echo "<!-- source: $f -->"
      echo
      cat "$f"
      echo
      echo
    done
  } > "$out"
}

for book in book-one book-two book-three; do
  regen_one "$book"
done
