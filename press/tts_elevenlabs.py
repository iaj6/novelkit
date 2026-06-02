#!/usr/bin/env python3
"""Generate MP3 audio via ElevenLabs text-to-speech.

For chapters under the per-request character cap (default 38,000; ElevenLabs's
hard ceiling is 40,000) the script writes a single <out>.mp3.

For longer chapters, the script splits the text on paragraph → sentence →
whitespace boundaries and emits <out>.partNN.mp3 plus a sidecar <out>.m3u
playlist. When chunking, the script also passes `previous_text` and
`next_text` to each request — ElevenLabs uses these to keep prosody
continuous across the seam, so the audiobook doesn't sound stitched.
"""
import argparse
import json
import os
import re
import time
from pathlib import Path
from typing import Any, Optional
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def die(msg: str) -> None:
    raise SystemExit(f"error: {msg}")


def post_json(url: str, headers: dict[str, str], payload: dict[str, Any], timeout: int = 180) -> bytes:
    data = json.dumps(payload).encode("utf-8")
    req = Request(url, data=data, headers=headers, method="POST")
    try:
        with urlopen(req, timeout=timeout) as resp:
            return resp.read()
    except HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code} {e.reason}: {body}") from e
    except URLError as e:
        raise RuntimeError(f"network error: {e}") from e


def get_json(url: str, headers: dict[str, str], timeout: int = 60) -> Any:
    req = Request(url, headers=headers, method="GET")
    with urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


# ── chunking ──────────────────────────────────────────────────────────────

# Window of surrounding text passed to ElevenLabs via previous_text / next_text
# to keep prosody continuous across chunk boundaries. Kept small so the request
# stays comfortably under the API's character cap; ElevenLabs only needs a
# whiff of context to handle the seam.
CONTEXT_WINDOW_CHARS = 500


def chunk_text(text: str, max_chars: int) -> list[str]:
    """Split text into chunks no larger than max_chars.

    Strategy: paragraph boundary first (best for natural pauses), then
    sentence boundary, then whitespace, with hard split as the last resort.
    """
    text = text.strip()
    if len(text) <= max_chars:
        return [text]

    chunks: list[str] = []

    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    current = ""
    for p in paragraphs:
        candidate = f"{current}\n\n{p}".strip() if current else p
        if len(candidate) <= max_chars:
            current = candidate
            continue

        if current:
            chunks.append(current)
            current = ""

        # A single paragraph is itself too big — fall back to sentence-level.
        if len(p) > max_chars:
            sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", p) if s.strip()]
            cur2 = ""
            for s in sentences:
                cand2 = f"{cur2} {s}".strip() if cur2 else s
                if len(cand2) <= max_chars:
                    cur2 = cand2
                    continue
                if cur2:
                    chunks.append(cur2)
                    cur2 = ""
                if len(s) > max_chars:
                    # Sentence is somehow longer than the chunk cap — hard split.
                    for i in range(0, len(s), max_chars):
                        chunks.append(s[i : i + max_chars].strip())
                    cur2 = ""
                else:
                    cur2 = s
            if cur2:
                chunks.append(cur2)
            current = ""
        else:
            current = p

    if current:
        chunks.append(current)

    return [c for c in chunks if c.strip()]


def context_tail(text: str, n: int = CONTEXT_WINDOW_CHARS) -> str:
    """The last n chars of text, snapped to a word boundary on the left side."""
    if len(text) <= n:
        return text
    cut = text[-n:]
    space = cut.find(" ")
    return cut[space + 1 :] if space >= 0 else cut


def context_head(text: str, n: int = CONTEXT_WINDOW_CHARS) -> str:
    """The first n chars of text, snapped to a word boundary on the right side."""
    if len(text) <= n:
        return text
    cut = text[:n]
    space = cut.rfind(" ")
    return cut[:space] if space >= 0 else cut


# ── main ──────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(description="Generate MP3 audio via ElevenLabs text-to-speech.")
    parser.add_argument("--text-file", help="Input UTF-8 text file.")
    parser.add_argument("--out", help="Output .mp3 path.")
    parser.add_argument("--voice-id", default=os.getenv("ELEVENLABS_VOICE_ID", ""), help="ElevenLabs voice_id.")
    parser.add_argument("--model-id", default=os.getenv("ELEVENLABS_MODEL_ID", "eleven_v3"))
    parser.add_argument("--api-key", default=os.getenv("ELEVENLABS_API_KEY", ""), help="ElevenLabs API key (or env).")
    parser.add_argument("--stability", type=float, default=float(os.getenv("ELEVENLABS_STABILITY", "0.35")))
    parser.add_argument("--similarity", type=float, default=float(os.getenv("ELEVENLABS_SIMILARITY", "0.75")))
    parser.add_argument("--style", type=float, default=float(os.getenv("ELEVENLABS_STYLE", "0.15")))
    parser.add_argument("--speed", type=float, default=float(os.getenv("ELEVENLABS_SPEED", "1.0")),
                        help="Speech rate (1.0 = normal).")
    parser.add_argument(
        "--max-chars",
        type=int,
        default=int(os.getenv("ELEVENLABS_MAX_CHARS", "4500")),
        help=(
            "Chunk size for long inputs (default: 4500). ElevenLabs's newer "
            "models (eleven_v3 etc.) enforce a 5000-character cap per request, "
            "so chapters above that get split into multiple chunks and stitched "
            "back together. The script passes previous_text / next_text across "
            "chunk boundaries to keep prosody continuous. Override with "
            "ELEVENLABS_MAX_CHARS env var if a different model permits longer."
        ),
    )
    parser.add_argument("--retry", type=int, default=3)
    parser.add_argument("--rate-limit-sleep", type=float, default=2.0)
    parser.add_argument("--list-voices", action="store_true", help="List available voices and exit.")
    args = parser.parse_args()

    if not args.api_key:
        die("Missing ELEVENLABS_API_KEY (set it in .env or environment).")

    headers = {
        "xi-api-key": args.api_key,
        "accept": "audio/mpeg",
        "content-type": "application/json",
    }

    if args.list_voices:
        try:
            data = get_json("https://api.elevenlabs.io/v1/voices", headers={"xi-api-key": args.api_key})
        except Exception as e:
            die(str(e))
        for v in data.get("voices", []):
            voice_id = v.get("voice_id")
            name = v.get("name")
            if voice_id and name:
                print(f"{voice_id}\t{name}")
        return 0

    if not args.voice_id:
        die("Missing --voice-id (or set ELEVENLABS_VOICE_ID). Run with --list-voices to see options.")

    if not args.text_file or not args.out:
        die("Missing --text-file and/or --out (required unless using --list-voices).")

    text = Path(args.text_file).read_text(encoding="utf-8").strip()
    if not text:
        die(f"empty text: {args.text_file}")

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    voice_settings = {
        "stability": args.stability,
        "similarity_boost": args.similarity,
        "style": args.style,
        "use_speaker_boost": True,
        "speed": args.speed,
    }
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{args.voice_id}"

    # eleven_v3 doesn't yet support previous_text / next_text prosody-stitching
    # params. Other models (multilingual_v2, turbo_v2, etc.) do. Skip them on v3.
    supports_context = "v3" not in args.model_id

    def render(chunk_text_: str, previous_text: str = "", next_text: str = "") -> bytes:
        payload: dict[str, Any] = {
            "text": chunk_text_,
            "model_id": args.model_id,
            "voice_settings": voice_settings,
        }
        # `previous_text` / `next_text` keep prosody continuous across chunks.
        # Only useful when chunking; omit when there's only one piece or when
        # the model doesn't support these params.
        if supports_context:
            if previous_text:
                payload["previous_text"] = previous_text
            if next_text:
                payload["next_text"] = next_text

        last_err: Optional[Exception] = None
        for attempt in range(1, args.retry + 1):
            try:
                return post_json(url, headers=headers, payload=payload)
            except Exception as e:
                last_err = e
                # ElevenLabs rate-limits on bursts; back off geometrically.
                time.sleep(args.rate_limit_sleep * attempt)
        assert last_err is not None
        raise last_err

    chunks = chunk_text(text, args.max_chars)

    if len(chunks) == 1:
        audio = render(chunks[0])
        out_path.write_bytes(audio)
        print(str(out_path))
        return 0

    # Multi-chunk: write partNN.mp3 files + an .m3u playlist.
    stem = out_path.with_suffix("")
    part_paths: list[Path] = []

    for i, chunk in enumerate(chunks):
        previous_text = context_tail(chunks[i - 1]) if i > 0 else ""
        next_text = context_head(chunks[i + 1]) if i + 1 < len(chunks) else ""

        audio = render(chunk, previous_text=previous_text, next_text=next_text)
        part = out_path.with_name(f"{stem.name}.part{i + 1:02d}{out_path.suffix}")
        part.write_bytes(audio)
        part_paths.append(part)

    playlist = out_path.with_suffix(".m3u")
    playlist.write_text("\n".join(p.name for p in part_paths) + "\n", encoding="utf-8")

    print(str(playlist))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
