#!/usr/bin/env python3
import argparse
import base64
import os
from pathlib import Path
from typing import Optional
from urllib.request import urlopen


def read_prompt(prompt: Optional[str], prompt_file: Optional[str]) -> str:
    if prompt and prompt_file:
        raise ValueError("Provide either --prompt or --prompt-file, not both.")
    if prompt_file:
        return Path(prompt_file).read_text(encoding="utf-8").strip()
    if prompt:
        return prompt.strip()
    raise ValueError("Missing prompt. Provide --prompt or --prompt-file.")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate an image using the OpenAI image API and save it to disk."
    )
    parser.add_argument(
        "--prompt",
        help="Prompt text (use --prompt-file if you prefer a file).",
    )
    parser.add_argument(
        "--prompt-file",
        help="Path to a UTF-8 text file containing the prompt.",
    )
    parser.add_argument(
        "--out",
        required=True,
        help="Output image path (extension should match the requested --format).",
    )
    parser.add_argument(
        "--model",
        default=os.getenv("OPENAI_IMAGE_MODEL", "gpt-image-1.5"),
        help=(
            "Image model to use (default: gpt-image-1.5). "
            "Other valid options: gpt-image-1, gpt-image-1-mini, gpt-image-2."
        ),
    )
    parser.add_argument(
        "--format",
        default="png",
        choices=["png", "jpeg", "webp"],
        help="Output format (default: png).",
    )
    parser.add_argument(
        "--size",
        default="1024x1536",
        help="Requested size (default: 1024x1536).",
    )

    args = parser.parse_args()

    prompt_text = read_prompt(args.prompt, args.prompt_file)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        from openai import OpenAI  # type: ignore
    except Exception as exc:  # pragma: no cover
        raise SystemExit(
            "Missing dependency: openai. Install with:\n\n"
            "  python3 -m pip install --user openai\n"
        ) from exc

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit(
            "Missing env var OPENAI_API_KEY. Example:\n\n"
            "  export OPENAI_API_KEY='...'\n"
        )

    client = OpenAI()
    result = client.images.generate(
        model=args.model,
        prompt=prompt_text,
        size=args.size,
    )

    first = result.data[0]
    image_bytes: bytes

    # SDK/backends can return either base64 JSON or a URL.
    if getattr(first, "b64_json", None):
        image_bytes = base64.b64decode(first.b64_json)
    elif getattr(first, "url", None):
        with urlopen(first.url) as resp:
            image_bytes = resp.read()
    else:
        raise SystemExit("Image response contained neither b64_json nor url.")

    out_path.write_bytes(image_bytes)

    print(str(out_path))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
