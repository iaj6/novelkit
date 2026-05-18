#!/usr/bin/env python3
import argparse
import os
from pathlib import Path
import re


def die(msg: str) -> None:
    raise SystemExit(f"error: {msg}")

def chunk_text(text: str, max_chars: int) -> list[str]:
    text = text.strip()
    if len(text) <= max_chars:
        return [text]

    chunks: list[str] = []

    # First pass: paragraph-based chunking (keeps natural pauses).
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    current = ""
    for p in paragraphs:
        candidate = (current + "\n\n" + p).strip() if current else p
        if len(candidate) <= max_chars:
            current = candidate
        else:
            if current:
                chunks.append(current)
            # Paragraph itself too big: fall back to sentence splitting.
            if len(p) > max_chars:
                sentences = [s.strip() for s in re.split(r"(?<=[.!?])\\s+", p) if s.strip()]
                cur2 = ""
                for s in sentences:
                    cand2 = (cur2 + " " + s).strip() if cur2 else s
                    if len(cand2) <= max_chars:
                        cur2 = cand2
                    else:
                        if cur2:
                            chunks.append(cur2)
                        # Worst case: hard split.
                        if len(s) > max_chars:
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


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate audio via OpenAI TTS.")
    parser.add_argument("--text-file", required=True, help="Input UTF-8 text file.")
    parser.add_argument("--out", required=True, help="Output audio path (mp3 recommended).")
    parser.add_argument("--model", default=os.getenv("OPENAI_TTS_MODEL", "gpt-4o-mini-tts"))
    parser.add_argument("--voice", default=os.getenv("OPENAI_TTS_VOICE", "alloy"))
    parser.add_argument("--format", default=os.getenv("OPENAI_TTS_FORMAT", "mp3"))
    parser.add_argument(
        "--speed",
        type=float,
        default=float(os.getenv("OPENAI_TTS_SPEED", "1.0")),
        help="Playback speed hint (if supported by the API).",
    )
    parser.add_argument(
        "--max-chars",
        type=int,
        default=int(os.getenv("OPENAI_TTS_MAX_CHARS", "4500")),
        help="Chunk size for long inputs (default: 4500 chars).",
    )
    args = parser.parse_args()

    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        die("Missing OPENAI_API_KEY (set it in .env or environment).")

    text = Path(args.text_file).read_text(encoding="utf-8").strip()
    if not text:
        die(f"empty text: {args.text_file}")

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        from openai import OpenAI  # type: ignore
    except Exception as exc:
        raise SystemExit(
            "Missing dependency: openai. Install with:\n\n"
            "  python3 -m pip install --user openai\n"
        ) from exc

    client = OpenAI()

    # OpenAI Python SDK audio speech API returns binary audio.
    # Different SDK versions expose different return shapes; handle the common cases.
    chunks = chunk_text(text, args.max_chars)

    def is_length_error(exc: Exception) -> bool:
        msg = str(exc)
        return (
            "over the maximum input limit" in msg
            or "maximum input limit" in msg
            or "Please shorten your input" in msg
            or "Input of" in msg and "tokens is over the maximum input limit" in msg
        )

    def split_near_middle(s: str) -> tuple[str, str]:
        s = s.strip()
        if not s:
            return "", ""
        mid = len(s) // 2

        # Prefer paragraph boundaries, then sentence-ish boundaries, then whitespace.
        for pat in ["\n\n", ". ", "? ", "! ", "\n", " "]:
            left = s.rfind(pat, 0, mid)
            right = s.find(pat, mid)
            candidates = [i for i in [left, right] if i != -1]
            if not candidates:
                continue
            cut = min(candidates, key=lambda i: abs(i - mid))
            if pat.strip():
                cut += len(pat)
            a = s[:cut].strip()
            b = s[cut:].strip()
            if a and b:
                return a, b

        # Hard split fallback.
        a = s[:mid].strip()
        b = s[mid:].strip()
        return a, b

    def render_bytes(chunk: str) -> bytes:
        # Some API/client versions support additional parameters (like speed).
        # Try the "full" call first, then fall back by removing unsupported args.
        try:
            resp = client.audio.speech.create(
                model=args.model,
                voice=args.voice,
                input=chunk,
                response_format=args.format,
                speed=args.speed,
            )
        except TypeError:
            try:
                resp = client.audio.speech.create(
                    model=args.model,
                    voice=args.voice,
                    input=chunk,
                    speed=args.speed,
                )
            except TypeError:
                resp = client.audio.speech.create(
                    model=args.model,
                    voice=args.voice,
                    input=chunk,
                )

        if isinstance(resp, (bytes, bytearray)):
            return bytes(resp)
        if hasattr(resp, "read"):
            return resp.read()
        if hasattr(resp, "content"):
            return resp.content  # type: ignore[attr-defined]
        raise RuntimeError("unexpected TTS response; no audio bytes found")

    def synthesize(chunk: str, depth: int = 0) -> list[bytes]:
        chunk = chunk.strip()
        if not chunk:
            return []
        try:
            return [render_bytes(chunk)]
        except Exception as exc:
            if depth >= 12 or not is_length_error(exc):
                raise
            a, b = split_near_middle(chunk)
            if not a or not b:
                raise
            return synthesize(a, depth + 1) + synthesize(b, depth + 1)

    # Expand initial chunks into audio segments, with retry splitting if the API
    # rejects an input for being too long (token-based limit).
    segments: list[bytes] = []
    for ch in chunks:
        segments.extend(synthesize(ch))

    if len(segments) == 1:
        out_path.write_bytes(segments[0])
        print(str(out_path))
        return 0

    # Multi-part output: write sidecar parts and a playlist.
    stem = out_path.with_suffix("")
    part_paths = []
    for i, audio in enumerate(segments, start=1):
        part = out_path.with_name(f"{stem.name}.part{i:02d}{out_path.suffix}")
        part.write_bytes(audio)
        part_paths.append(part)

    playlist = out_path.with_suffix(".m3u")
    playlist.write_text("\n".join(p.name for p in part_paths) + "\n", encoding="utf-8")

    print(str(playlist))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
