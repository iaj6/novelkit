#!/usr/bin/env bash
set -euo pipefail

# Sync per-book build artifacts from library/<slug>/build/ into
# site/public/books/<slug>/ so Astro can serve them as static files.
#
# Also generates WebP versions of cover images for the web:
#   cover.webp        — full-size WebP, quality 80, for the book detail page
#   cover-thumb.webp  — 600px wide WebP for the landing-page grid
#
# Run before `npm run build` or `npm run dev` whenever the press has
# regenerated artifacts.
#
# Idempotent — WebP files are regenerated only when missing or older
# than the source cover.png.
# --clean wipes site/public/books/ before syncing.

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

have_cwebp=0
if command -v cwebp >/dev/null 2>&1; then
  have_cwebp=1
fi

needs_regen() {
  # Returns 0 (true) if $2 is missing or older than $1.
  local src="$1" dst="$2"
  [[ ! -f "$dst" ]] && return 0
  [[ "$src" -nt "$dst" ]] && return 0
  return 1
}

synced=0
for book_dir in "$LIBRARY"/*/; do
  slug="$(basename "$book_dir")"
  build_dir="$book_dir/build"
  if [[ ! -d "$build_dir" ]]; then
    continue
  fi

  dest="$PUBLIC_BOOKS/$slug"
  mkdir -p "$dest"
  # -p preserves mtimes so the WebP regen check below sees stable timestamps
  # (otherwise every cp would mark the PNG as "newer" than its WebP and force
  # a regeneration on every sync).
  cp -Rp "$build_dir/." "$dest/"
  synced=$((synced + 1))
  echo "info: synced $slug"

  # Generate WebP versions of the cover if cwebp is available.
  cover_src="$dest/cover.png"
  if [[ -f "$cover_src" ]] && [[ "$have_cwebp" == "1" ]]; then
    cover_webp="$dest/cover.webp"
    thumb_webp="$dest/cover-thumb.webp"

    if needs_regen "$cover_src" "$cover_webp"; then
      cwebp -q 80 -m 6 -quiet "$cover_src" -o "$cover_webp" >/dev/null
      echo "info:   ↳ generated cover.webp"
    fi

    if needs_regen "$cover_src" "$thumb_webp"; then
      cwebp -q 80 -m 6 -resize 600 0 -quiet "$cover_src" -o "$thumb_webp" >/dev/null
      echo "info:   ↳ generated cover-thumb.webp"
    fi
  elif [[ -f "$cover_src" ]] && [[ "$have_cwebp" == "0" ]]; then
    echo "warn:   cwebp not installed; skipping WebP generation for $slug" >&2
    echo "warn:   install via:  brew install webp" >&2
  fi
done

echo "info: synced $synced book(s) into $PUBLIC_BOOKS"
