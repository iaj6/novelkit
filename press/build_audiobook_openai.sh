#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT/scripts/common.sh"
source "$ROOT/scripts/load_env.sh" "$ROOT/.env"

need_cmd python3

book="${1:-}"
[[ -n "$book" ]] || die "usage: scripts/build_audiobook_openai.sh <book-one|book-two|book-three>"

[[ -n "${OPENAI_API_KEY:-}" ]] || die "OPENAI_API_KEY is not set (expected in $ROOT/.env or your shell environment)"

out_root="$(repo_root)/build/audiobook-openai/$book"
mkdir -p "$out_root"

note "preparing TTS text: $book"
python3 "$ROOT/scripts/prepare_tts.py" --book "$book" --speak-headings >/dev/null

manifest="$(repo_root)/build/tts/$book/manifest.json"
[[ -f "$manifest" ]] || die "missing manifest: $manifest"

note "generating audio chapters (OpenAI TTS): $out_root"

ROOT="$ROOT" python3 - "$book" <<'PY'
import json
import os
import subprocess
import sys
from pathlib import Path

root = Path(os.environ["ROOT"])
book = sys.argv[1]
manifest = root / "build" / "tts" / book / "manifest.json"
out_root = root / "build" / "audiobook-openai" / book

data = json.loads(manifest.read_text(encoding="utf-8"))
chapters = data["chapters"]

for ch in chapters:
    slug = ch["slug"]
    txt = root / ch["text_file"]
    out = out_root / f"{slug}.mp3"
    playlist = out_root / f"{slug}.m3u"
    if (out.exists() and out.stat().st_size > 0) or (playlist.exists() and playlist.stat().st_size > 0):
        continue
    cmd = [
        sys.executable,
        str(root / "scripts" / "tts_openai.py"),
        "--text-file", str(txt),
        "--out", str(out),
    ]
    subprocess.check_call(cmd)
PY

note "done: $out_root"
