#!/usr/bin/env bash
set -euo pipefail

PRESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$PRESS_DIR/common.sh"
source "$PRESS_DIR/load_env.sh" "$(repo_root)/.env"

need_cmd python3

book="${1:-}"
[[ -n "$book" ]] || die "usage: press/build_audiobook.sh <book>"

[[ -n "${ELEVENLABS_API_KEY:-}" ]] || die "ELEVENLABS_API_KEY is not set (expected in $(repo_root)/.env or your shell environment)"

out_root="$(build_dir "$book")/audiobook"
mkdir -p "$out_root"

note "preparing TTS text: $book"
python3 "$PRESS_DIR/prepare_tts.py" --book "$book" --speak-headings >/dev/null

manifest="$(build_dir "$book")/tts/manifest.json"
[[ -f "$manifest" ]] || die "missing manifest: $manifest"

note "generating audio chapters (ElevenLabs mp3): $out_root"

PRESS_DIR="$PRESS_DIR" MANIFEST="$manifest" OUT_ROOT="$out_root" python3 - <<'PY'
import json
import os
import subprocess
import sys
from pathlib import Path

press_dir = Path(os.environ["PRESS_DIR"])
manifest = Path(os.environ["MANIFEST"])
out_root = Path(os.environ["OUT_ROOT"])
repo_root = press_dir.parent

data = json.loads(manifest.read_text(encoding="utf-8"))
chapters = data["chapters"]

for ch in chapters:
    slug = ch["slug"]
    txt = repo_root / ch["text_file"]
    out = out_root / f"{slug}.mp3"
    playlist = out_root / f"{slug}.m3u"
    # Chunked chapters write parts + an .m3u and never <slug>.mp3 — check the
    # playlist too, else multi-part chapters re-synthesize (re-bill) every run.
    if (out.exists() and out.stat().st_size > 0) or (playlist.exists() and playlist.stat().st_size > 0):
        continue
    cmd = [
        sys.executable,
        str(press_dir / "tts_elevenlabs.py"),
        "--text-file", str(txt),
        "--out", str(out),
    ]
    subprocess.check_call(cmd)
PY

note "done: $out_root"
