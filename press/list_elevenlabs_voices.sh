#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT/scripts/common.sh"
source "$ROOT/scripts/load_env.sh" "$ROOT/.env"

need_cmd python3

[[ -n "${ELEVENLABS_API_KEY:-}" ]] || die "ELEVENLABS_API_KEY is not set (expected in $ROOT/.env or your shell environment)"

out_dir="$(repo_root)/build/elevenlabs"
mkdir -p "$out_dir"

out_tsv="$out_dir/voices.tsv"
out_log="$out_dir/voices.log"

note "writing: $out_tsv"
note "log: $out_log"

(
  python3 "$ROOT/scripts/tts_elevenlabs.py" --list-voices
) >"$out_tsv" 2>"$out_log" || true

note "done"

