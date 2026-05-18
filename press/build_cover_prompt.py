#!/usr/bin/env python3
"""Build an image-generation prompt for a book's cover.

Reads canon docs from library/<book>/canon/ (pitch, world, style, continuity)
and synthesizes a cover-illustration prompt suitable for OpenAI's image API.

The prompt is genre-neutral — period, mood, and visual register are inferred
from the canon snippets. Pass --art-direction to inject explicit composition
guidance if the canon alone produces weak results.
"""
import argparse
import json
from pathlib import Path
from typing import Optional


def read_text(path: Path) -> str:
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8").strip()


def extract_lines(md: str, max_lines: int) -> str:
    """Pull the first `max_lines` non-empty, non-fence lines from a markdown file."""
    out = []
    for line in md.splitlines():
        line = line.strip()
        if not line or line.startswith("```"):
            continue
        out.append(line)
        if len(out) >= max_lines:
            break
    return "\n".join(out)


def book_title_from_config(book_dir: Path, fallback: str) -> str:
    cfg = book_dir / "cdk.config.json"
    if not cfg.exists():
        return fallback
    try:
        data = json.loads(cfg.read_text(encoding="utf-8"))
    except Exception:
        return fallback
    return data.get("title") or fallback


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Build a cover prompt from a book's canon docs."
    )
    parser.add_argument(
        "--book",
        required=True,
        help="Book slug (must exist as library/<book>/).",
    )
    parser.add_argument(
        "--title",
        default=None,
        help="Override title (otherwise read from cdk.config.json, then book slug).",
    )
    parser.add_argument("--author", default="")
    parser.add_argument(
        "--art-direction",
        default="",
        help="Optional composition guidance to inject into the prompt.",
    )
    parser.add_argument(
        "--include-text",
        action="store_true",
        help="Ask the model to render title/author text on the image (less reliable).",
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    book_dir = repo_root / "library" / args.book
    if not book_dir.is_dir():
        raise SystemExit(f"error: book not found: {book_dir}")

    canon = book_dir / "canon"
    pitch = extract_lines(read_text(canon / "pitch.md"), 22)
    world = extract_lines(read_text(canon / "world.md"), 18)
    style = extract_lines(read_text(canon / "style.md"), 18)
    continuity = extract_lines(read_text(canon / "continuity.md"), 22)

    title = args.title or book_title_from_config(book_dir, args.book)

    text_block = ""
    if args.include_text:
        byline = f"by {args.author}" if args.author else ""
        text_block = f"""
Typography:
- Include the title text: "{title}"
{f'- Include the author line: "{byline}"' if byline else ''}
- Choose a type treatment appropriate to the book's period and tone.
- Keep text high contrast and legible at thumbnail size.
"""

    art_block = ""
    if args.art_direction:
        art_block = f"\nArt direction:\n{args.art_direction}\n"

    prompt = f"""
Create a high-quality novel cover illustration for a book titled "{title}".

The cover's period, mood, and visual register should be inferred from the
following canon excerpts. Do not impose a generic genre aesthetic; let the
material itself dictate the look.

Pitch (story core; use for imagery and tone):
{pitch}

World cues (setting, period, texture):
{world}

Style cues (register, mood, what to avoid):
{style}

Canon anchors (facts that must not be contradicted in the image):
{continuity}
{art_block}
Cover composition requirements:
- Vertical book cover layout (front cover).
- Strong silhouette and a clear focal point.
- Leave breathing room for title/author placement near the top and bottom.
- No visible brand logos or watermarks.
- No anachronistic objects relative to the book's period.
{text_block}
""".strip()

    print(prompt)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
