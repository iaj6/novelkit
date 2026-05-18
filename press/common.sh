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

book_path() {
  local book="$1"
  case "$book" in
    book-one|book-two|book-three) ;;
    *) die "unknown book '$book' (expected: book-one|book-two|book-three)" ;;
  esac
  echo "$(repo_root)/manuscript/$book.md"
}

build_dir() {
  local book="$1"
  echo "$(repo_root)/build/$book"
}

metadata_args() {
  local book="$1"
  local title="${TITLE:-$book}"
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
