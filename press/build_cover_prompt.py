#!/usr/bin/env python3
import argparse
from pathlib import Path


def read_text(path: Path) -> str:
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8").strip()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Build a cover prompt from repo story docs + optional title/author."
    )
    parser.add_argument("--book", default="book-one", choices=["book-one", "book-two", "book-three"])
    parser.add_argument("--title", default="The Last Troll")
    parser.add_argument("--author", default="")
    parser.add_argument(
        "--include-text",
        action="store_true",
        help="Request that the model renders title/author text on the image (less reliable).",
    )
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    pitch = read_text(root / "docs/00-pitch.md")
    world = read_text(root / "docs/02-world.md")
    style = read_text(root / "docs/25-style-guide.md")
    continuity = read_text(root / "docs/07-continuity.md")

    # Keep prompt tight: lift the most useful bits (hook + contrasts + a few canon anchors).
    def extract_lines(md: str, max_lines: int) -> str:
        lines = []
        for line in md.splitlines():
            line = line.strip()
            if not line or line.startswith("```"):
                continue
            lines.append(line)
            if len(lines) >= max_lines:
                break
        return "\n".join(lines)

    pitch_snip = extract_lines(pitch, 22)
    world_snip = extract_lines(world, 18)
    style_snip = extract_lines(style, 18)
    canon_snip = extract_lines(continuity, 22)

    text_block = ""
    if args.include_text:
        byline = f"by {args.author}" if args.author else ""
        text_block = f"""
Typography:
- Include the title text: "{args.title}"
{f'- Include the author line: "{byline}"' if byline else ''}
- Use a readable, classic fantasy novel cover type treatment (not modern/techy).
- Keep text high contrast and legible at thumbnail size.
"""

    prompt = f"""
Create a high-quality fantasy novel cover illustration for a grounded, story-forward trilogy called "{args.title}".

Core concept (from story docs; use for imagery and tone):
{pitch_snip}

World cues:
{world_snip}

Style constraints:
{style_snip}

Canon anchors (do not contradict):
{canon_snip}

Cover composition requirements:
- Vertical book cover layout (front cover).
- Strong silhouette and clear focal point.
- Foreground: a young intelligent troll (not a cartoon; not grotesque; not cute), half in shadow, with a wary, observant expression.
- Background: split contrast of worlds: ruined troll stonework/geometry (ancient inlays, straight road-lines) fading into human order (city/keep, papers/seals, lantern-lit authority).
- Include subtle lantern motif (wax seal/pin/lantern glow) as a symbol of institutional control.
- No gore; implied menace is fine; hopeful undertone.
- Avoid high-magic spectacle (no spell explosions); keep it medium-magic, ritual/ancient.

Important:
- No modern objects, no firearms.
- No visible brand logos or watermarks.
- If you include any text, ensure it is spelled correctly and centered within safe margins.
{text_block}
""".strip()

    print(prompt)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

