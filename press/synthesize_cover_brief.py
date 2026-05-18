#!/usr/bin/env python3
"""Synthesize a book-specific cover brief by passing canon through Claude.

Two-stage cover pipeline:
  1. (this script) canon → Claude → focused visual brief
  2. (generate_image.py) visual brief → OpenAI image model → cover.png

Stage 1 exists because image models are weaker at reading 10,000 chars of
literary canon and extracting "what this book's cover should be" than
they are at executing a tight, visually-loaded prompt. Claude reads the
canon, identifies the single strongest visual concept, and outputs a
brief the image model can render.

Cost: roughly $0.01–0.02 per synthesis at Sonnet 4.7 input/output rates.
Set ANTHROPIC_COVER_MODEL to override (e.g. claude-haiku-4-5 for cheaper,
claude-opus-4-7 for more literary nuance).
"""
import argparse
import os
import sys
from pathlib import Path

# Reuse canon extractors and helpers from build_cover_prompt.
PRESS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(PRESS_DIR))
from build_cover_prompt import (  # noqa: E402
    book_title_from_config,
    canon_pitch,
    canon_world,
    canon_characters,
    canon_themes,
    canon_continuity,
    cap,
    read_text,
)


SYNTHESIS_INSTRUCTIONS = """You are a senior book cover art director. Read the canon material below \
and write a focused visual brief for an illustrator who will pass it directly \
to an image generation model.

Your output will be sent verbatim to an image model. So:
- Be specific. Don't say "a Maine harbor" — say "a granite breakwater stained \
orange at the tide line, fog low over the water, gulls absent because it is October."
- Read THIS book. Don't write a "literary fiction cover" prompt; write a cover \
that could only be for THIS specific book.
- Prefer one strong image over a montage. Most books don't benefit from \
putting every element on the cover.
- Period accuracy matters. If the book is set in 1943, nothing in the image \
should be inconsistent with 1943.
- Most literary covers do NOT depict main characters as figures. Lean toward \
object, landscape, single architectural detail, or partial figure (a hand, a \
silhouette through a window, a back turned).

Output exactly this structure (Markdown, no preamble, no commentary, no \
trailing explanation):

# Cover brief: <book title>

**Genre and shelving**: <one short phrase, e.g. "Literary fiction, post-war American">

**Era**: <specific years or decade>

**Visual register**: <2–4 adjectives, e.g. "austere, restrained, period-accurate, cold-toned">

**Subject**:
<2–3 sentences describing the single dominant visual element. Be concrete.>

**Composition**:
<2–3 sentences. Vertical layout. Where the focal point sits, what is in shadow \
vs. light, what fills the frame, what is sky or negative space.>

**Palette**:
<2–3 dominant colors with rough weighting, e.g. "cold pewter sea 60%, warm \
wood-stove interior light 25%, oxidized iron orange 15%">

**Avoid**:
<2–4 bullets of what this cover should NOT do, specific to this book>
"""


COMPOSITION_RULES = """# Cover specifications (apply regardless of subject)

- Vertical book cover, front cover only.
- Strong silhouette and clear focal point.
- Period-accurate detail. No anachronistic objects.
- Leave breathing room near the top for the title and near the bottom for the author line.
- No visible brand logos, watermarks, signatures, or QR codes.
- No depiction of recognizable real persons."""


def build_canon_block(book_dir: Path, title: str, no_brief: bool) -> str:
    canon = book_dir / "canon"
    parts: list[str] = [f'Title: "{title}"']

    if not no_brief:
        brief = cap(read_text(book_dir / "brief.md"), 2000)
        if brief:
            parts.append("## Author brief\n\n" + brief)

    if (pitch := canon_pitch(canon)):
        parts.append("## Story (pitch)\n\n" + pitch)
    if (world := canon_world(canon)):
        parts.append("## World (setting, period, sensory register)\n\n" + world)
    if (characters := canon_characters(canon)):
        parts.append("## Point-of-view characters\n\n" + characters)
    if (themes := canon_themes(canon)):
        parts.append("## Themes\n\n" + themes)
    if (continuity := canon_continuity(canon)):
        parts.append("## Hard facts (do not contradict)\n\n" + continuity)

    return "\n\n".join(parts)


def call_claude(model: str, prompt: str) -> str:
    try:
        from anthropic import Anthropic  # type: ignore
    except ImportError as exc:
        raise SystemExit(
            "Missing dependency: anthropic.\n\n"
            "Install with:  python3 -m pip install --user anthropic\n"
        ) from exc

    if not os.getenv("ANTHROPIC_API_KEY"):
        raise SystemExit(
            "Missing env var ANTHROPIC_API_KEY.\n\n"
            "Set it in <repo_root>/.env or your shell environment.\n"
            "(Or pass --no-synthesis to generate_cover.sh to skip synthesis.)"
        )

    client = Anthropic()
    msg = client.messages.create(
        model=model,
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )

    blocks = []
    for block in msg.content:
        if getattr(block, "type", None) == "text":
            blocks.append(block.text)
        elif hasattr(block, "text"):
            blocks.append(block.text)
    return "".join(blocks).strip()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Synthesize a focused cover brief from a book's canon via Claude."
    )
    parser.add_argument("--book", required=True, help="Book slug under library/.")
    parser.add_argument(
        "--title",
        default=None,
        help="Override title (otherwise read from cdk.config.json, then book slug).",
    )
    parser.add_argument("--author", default="")
    parser.add_argument(
        "--art-direction",
        default="",
        help="Optional composition guidance appended after the synthesized brief.",
    )
    parser.add_argument(
        "--include-text",
        action="store_true",
        help="Ask the image model to render title/author on the cover (less reliable).",
    )
    parser.add_argument(
        "--no-brief",
        action="store_true",
        help="Skip the author brief.md inclusion (use canon only).",
    )
    parser.add_argument(
        "--model",
        default=os.getenv("ANTHROPIC_COVER_MODEL", "claude-sonnet-4-6"),
        help="Anthropic model for synthesis (default: claude-sonnet-4-6).",
    )
    parser.add_argument(
        "--brief-only",
        action="store_true",
        help="Print only Claude's brief, without wrapping composition rules.",
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    book_dir = repo_root / "library" / args.book
    if not book_dir.is_dir():
        raise SystemExit(f"error: book not found: {book_dir}")

    title = args.title or book_title_from_config(book_dir, args.book)
    canon_block = build_canon_block(book_dir, title, args.no_brief)

    synthesis_prompt = (
        SYNTHESIS_INSTRUCTIONS
        + "\n\n---\n\nCANON FOR "
        + title
        + ":\n\n"
        + canon_block
    )

    brief = call_claude(args.model, synthesis_prompt)

    if args.brief_only:
        print(brief)
        return 0

    parts = [brief, COMPOSITION_RULES]
    if args.art_direction:
        parts.append("# Additional art direction\n\n" + args.art_direction)
    if args.include_text:
        byline = f'by {args.author}' if args.author else ""
        typo = [
            "# Typography",
            "",
            f'Include the title: "{title}"',
        ]
        if byline:
            typo.append(f'Include the byline: "{byline}"')
        typo.extend([
            "Choose a type treatment appropriate to the book's period and tone.",
            "Keep text high contrast and legible at thumbnail size.",
        ])
        parts.append("\n".join(typo))

    print("\n\n".join(parts))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
