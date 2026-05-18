#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/scripts/common.sh"

need_cmd python3

note "installing weasyprint via pip (user install)"
python3 -m pip install --user --upgrade pip >/dev/null
python3 -m pip install --user weasyprint

user_base="$(python3 -m site --user-base)"
bin_dir="$user_base/bin"

note "installed to: $bin_dir"
note "if 'weasyprint' is not found, add to PATH:"
note "  export PATH=\"$bin_dir:$PATH\""

# On macOS, Python from Xcode Command Line Tools may not search Homebrew’s lib dir
# for the dynamic libraries WeasyPrint uses. Creating shim symlinks in ~/lib
# allows dlopen() to resolve names like libgobject-2.0-0.
if [[ "$(uname -s)" == "Darwin" ]]; then
  mkdir -p "$HOME/lib"
  declare -A links=(
    ["libgobject-2.0-0"]="/opt/homebrew/lib/libgobject-2.0.dylib"
    ["libpango-1.0-0"]="/opt/homebrew/lib/libpango-1.0.dylib"
    ["libpangoft2-1.0-0"]="/opt/homebrew/lib/libpangoft2-1.0.dylib"
    ["libharfbuzz-0"]="/opt/homebrew/lib/libharfbuzz.0.dylib"
    ["libfontconfig-1"]="/opt/homebrew/lib/libfontconfig.1.dylib"
  )

  note "creating macOS dylib shims in: $HOME/lib"
  for name in "${!links[@]}"; do
    target="${links[$name]}"
    if [[ -e "$target" ]]; then
      ln -sf "$target" "$HOME/lib/$name"
    else
      note "skip: missing $target (install via Homebrew)"
    fi
  done
fi
