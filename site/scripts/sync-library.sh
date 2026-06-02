#!/usr/bin/env bash
set -euo pipefail

# Sync per-book build artifacts from library/<slug>/build/ into
# site/public/books/<slug>/ so Astro can serve them as static files.
#
# VISIBILITY-AWARE. Only books whose cdk.config.json sets
#   "visibility": "public"
# are synced. Any other value (private, missing, typo) is treated as
# not-publishable: the book is skipped, AND any stale copy already under
# site/public/books/<slug>/ is pruned. This keeps the deployed file set in
# agreement with the site's getBooks() (which filters the *pages* the same
# way), so that:
#   - private books never leak their downloadable files onto the site, and
#   - `cdk unpublish` followed by a sync actually RETRACTS a book's files
#     (not just its page).
#
# Also generates WebP versions of cover images for the web:
#   cover.webp        — full-size WebP, quality 80, for the book detail page
#   cover-thumb.webp  — 600px wide WebP for the landing-page grid
#
# Run before `npm run build` or `npm run dev` whenever the press has
# regenerated artifacts (wired as predev/prebuild in package.json).
#
# Idempotent — WebP files are regenerated only when missing or older
# than the source cover.png.
#
# --clean wipes site/public/books/ before syncing. NOTE: only safe on a
#   machine where every public book's build/ artifacts are present locally
#   (e.g. after running the press). Do NOT use in CI: there, library/*/build/
#   is gitignored, so the committed public/books/ copies are the only source
#   of artifacts and a wipe would erase them.

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

# Echo the "visibility" value from a cdk.config.json ("public" / "private" /
# …), or nothing if the file is missing/unreadable or the field is absent.
# Callers treat only the literal "public" as publishable; everything else
# (including the empty string) is private. Never fails — safe under set -e.
read_visibility() {
  local cfg="$1" line
  [[ -f "$cfg" ]] || return 0
  line="$(grep -m1 '"visibility"' "$cfg" 2>/dev/null || true)"
  printf '%s' "$line" | sed -n 's/.*"visibility"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p'
  return 0
}

# ── Phase 1: sync public books that have freshly-built artifacts ─────────
synced=0
for book_dir in "$LIBRARY"/*/; do
  slug="$(basename "$book_dir")"

  # Only public books are eligible. Non-public books are skipped here and
  # pruned in phase 2 below.
  if [[ "$(read_visibility "${book_dir}cdk.config.json")" != "public" ]]; then
    continue
  fi

  build_dir="${book_dir}build"
  if [[ ! -d "$build_dir" ]]; then
    # Public, but no build/ on this machine (e.g. CI, where build/ is
    # gitignored, or the press hasn't run yet). Leave any committed
    # public/books/<slug>/ in place — it's the only artifact source there.
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

# ── Phase 2: prune anything under public/books/ that isn't a public book ─
# Keeps the deployed file set equal to the set getBooks() will render.
# Removes books flipped to private (retraction) and orphaned slugs (renamed
# or deleted books) so stale downloads don't linger in the build output.
# Runs every sync — this is what makes the directory a pure function of
# (library visibility), not an ever-growing pile.
pruned=0
for dest_dir in "$PUBLIC_BOOKS"/*/; do
  [[ -d "$dest_dir" ]] || continue   # no-match glob guard
  slug="$(basename "$dest_dir")"
  if [[ "$(read_visibility "$LIBRARY/$slug/cdk.config.json")" != "public" ]]; then
    echo "info: pruning non-public '$slug' from public/books"
    rm -rf "$dest_dir"
    pruned=$((pruned + 1))
  fi
done

echo "info: synced $synced public book(s); pruned $pruned non-public; target $PUBLIC_BOOKS"
