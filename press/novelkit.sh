#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

die() { echo "error: $*" >&2; exit 1; }
note() { echo "info: $*" >&2; }

usage() {
  cat <<'TXT'
usage:
  scripts/novelkit.sh init <target-dir> [--title "My Book"] [--author "My Name"]

Creates a new NovelKit-style project by copying `templates/novelkit/` into <target-dir>.
TXT
}

cmd="${1:-}"
shift || true

case "$cmd" in
  init)
    target="${1:-}"
    shift || true
    [[ -n "$target" ]] || { usage; exit 1; }

    title="Untitled"
    author=""
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --title)
          shift || die "missing value for --title"
          title="${1:-}"
          ;;
        --author)
          shift || die "missing value for --author"
          author="${1:-}"
          ;;
        -h|--help)
          usage; exit 0
          ;;
        *)
          die "unknown arg: $1"
          ;;
      esac
      shift || true
    done

    template_dir="$ROOT/templates/novelkit"
    [[ -d "$template_dir" ]] || die "missing template: $template_dir"

    if [[ -e "$target" ]]; then
      die "target exists: $target"
    fi

    mkdir -p "$target"
    cp -R "$template_dir/." "$target/"

    # Replace placeholders in all UTF-8-ish text files.
    python3 - "$target" "$title" "$author" <<'PY'
import sys
from pathlib import Path

root = Path(sys.argv[1]).resolve()
title = sys.argv[2]
author = sys.argv[3]

replacements = {
    "{{TITLE}}": title,
    "{{AUTHOR}}": author,
}

for path in root.rglob("*"):
    if path.is_dir():
        continue
    try:
        data = path.read_text(encoding="utf-8")
    except Exception:
        continue
    new = data
    for k, v in replacements.items():
        new = new.replace(k, v)
    if new != data:
        path.write_text(new, encoding="utf-8")
PY

    # Make shell scripts executable in the new project (best effort).
    chmod +x "$target/scripts/"*.sh 2>/dev/null || true

    note "created: $target"
    note "next: cd \"$target\" && cp .env.example .env"
    ;;
  -h|--help|"")
    usage
    ;;
  *)
    usage
    die "unknown command: $cmd"
    ;;
esac

