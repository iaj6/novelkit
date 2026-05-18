#!/usr/bin/env bash
set -euo pipefail

die() { echo "error: $*" >&2; exit 1; }
note() { echo "info: $*" >&2; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "missing required command: $1"
}

opt_cmd() {
  command -v "$1" >/dev/null 2>&1
}

repo_root() {
  git rev-parse --show-toplevel 2>/dev/null || pwd
}

# Resolve <book> to its library directory; die if missing.
book_dir() {
  local book="$1"
  local d="$(repo_root)/library/$book"
  [[ -d "$d" ]] || die "unknown book '$book' (not found in library/)"
  echo "$d"
}

# Concatenated manuscript for a book (produced by concat_chapters.sh).
book_path() {
  local book="$1"
  echo "$(book_dir "$book")/manuscript.md"
}

# Canon directory (used by build_cover_prompt.py).
book_canon_dir() {
  local book="$1"
  echo "$(book_dir "$book")/canon"
}

# Per-book build directory. Build outputs live alongside each book.
build_dir() {
  local book="$1"
  echo "$(book_dir "$book")/build"
}

# Read title from cdk.config.json. Empty string if absent or unparseable.
book_title() {
  local book="$1"
  local cfg="$(book_dir "$book")/cdk.config.json"
  if [[ -f "$cfg" ]]; then
    if command -v jq >/dev/null 2>&1; then
      jq -r '.title // empty' "$cfg" 2>/dev/null
    else
      grep -oE '"title"[[:space:]]*:[[:space:]]*"[^"]*"' "$cfg" \
        | head -1 \
        | sed -E 's/.*"title"[[:space:]]*:[[:space:]]*"([^"]*)"/\1/'
    fi
  fi
}

metadata_args() {
  local book="$1"
  # Title precedence: $TITLE env > cdk.config.json > book slug
  local title="${TITLE:-$(book_title "$book")}"
  [[ -n "$title" ]] || title="$book"
  local author="${AUTHOR:-}"
  local lang="${LANG:-en}"
  local dedication="${DEDICATION:-}"
  local epigraph="${EPIGRAPH:-}"
  local epigraph_attrib="${EPIGRAPH_ATTRIBUTION:-}"

  echo "--metadata"
  echo "title=$title"
  echo "--metadata"
  echo "lang=$lang"
  if [[ -n "$author" ]]; then
    echo "--metadata"
    echo "author=$author"
  fi
  if [[ -n "$dedication" ]]; then
    echo "--metadata"
    echo "dedication=$dedication"
  fi
  if [[ -n "$epigraph" ]]; then
    echo "--metadata"
    echo "epigraph=$epigraph"
  fi
  if [[ -n "$epigraph_attrib" ]]; then
    echo "--metadata"
    echo "epigraph_attribution=$epigraph_attrib"
  fi
}
