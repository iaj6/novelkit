#!/usr/bin/env python3
import argparse
import json
import os
import time
from pathlib import Path
from typing import Any, Optional
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def die(msg: str) -> None:
    raise SystemExit(f"error: {msg}")


def post_json(url: str, headers: dict[str, str], payload: dict[str, Any], timeout: int = 120) -> bytes:
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
                        help="Speech rate (1.0 = normal). Available in voice_settings since 2025.")
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

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{args.voice_id}"
    payload = {
        "text": text,
        "model_id": args.model_id,
        "voice_settings": {
            "stability": args.stability,
            "similarity_boost": args.similarity,
            "style": args.style,
            "use_speaker_boost": True,
            "speed": args.speed,
        },
    }

    last_err: Optional[Exception] = None
    for attempt in range(1, args.retry + 1):
        try:
            audio = post_json(url, headers=headers, payload=payload)
            out_path.write_bytes(audio)
            print(str(out_path))
            return 0
        except Exception as e:
            last_err = e
            # Back off a bit; ElevenLabs will rate limit on bursts.
            time.sleep(args.rate_limit_sleep * attempt)

    die(f"failed after {args.retry} attempts: {last_err}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
