#!/usr/bin/env bash
set -euo pipefail

# Sync per-book build artifacts from library/<slug>/build/ into
# site/public/books/<slug>/ so Astro can serve them as static files.
#
# Run before `npm run build` or `npm run dev` whenever the press has
# regenerated artifacts.
#
# Idempotent — files are copied via cp -R; new files added, removed
# files in source are NOT pruned from dest. Pass --clean to wipe
# public/books/ first.

SITE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$SITE_DIR/.." && pwd)"
LIBRARY="$REPO_ROOT/library"
PUBLIC_BOOKS="$SITE_DIR/public/books"

clean=0
for arg in "$@"; do
  case "$arg" in
    --clean) clean=1 ;;
    *) echo "unknown arg: $arg" >&2; exit 1 ;;
  esac
done

if [[ ! -d "$LIBRARY" ]]; then
  echo "info: no library/ at $LIBRARY — nothing to sync." >&2
  exit 0
fi

if [[ "$clean" == "1" ]]; then
  echo "info: wiping $PUBLIC_BOOKS"
  rm -rf "$PUBLIC_BOOKS"
fi

mkdir -p "$PUBLIC_BOOKS"

synced=0
for book_dir in "$LIBRARY"/*/; do
  slug="$(basename "$book_dir")"
  build_dir="$book_dir/build"
  if [[ ! -d "$build_dir" ]]; then
    continue
  fi

  dest="$PUBLIC_BOOKS/$slug"
  mkdir -p "$dest"
  # Copy whole build/ contents into public/books/<slug>/
  cp -R "$build_dir/." "$dest/"
  synced=$((synced + 1))
  echo "info: synced $slug"
done

echo "info: synced $synced book(s) into $PUBLIC_BOOKS"
