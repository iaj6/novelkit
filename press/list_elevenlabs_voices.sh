#!/usr/bin/env bash
set -euo pipefail

PRESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$PRESS_DIR/common.sh"
source "$PRESS_DIR/load_env.sh" "$(repo_root)/.env"

need_cmd python3

[[ -n "${ELEVENLABS_API_KEY:-}" ]] || die "ELEVENLABS_API_KEY is not set (expected in $(repo_root)/.env or your shell environment)"

out_dir="$(repo_root)/build/elevenlabs"
mkdir -p "$out_dir"

out_tsv="$out_dir/voices.tsv"
out_log="$out_dir/voices.log"

note "writing: $out_tsv"
note "log: $out_log"

(
  python3 "$PRESS_DIR/tts_elevenlabs.py" --list-voices
) >"$out_tsv" 2>"$out_log" || true

note "done"
