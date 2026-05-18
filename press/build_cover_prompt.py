#!/usr/bin/env python3
"""Build an image-generation prompt for a book's cover.

Reads the brief and canon docs under library/<book>/ and synthesizes a
book-specific image prompt suitable for OpenAI's image API.

Design intent:
  Pull rich, visual material from the canon — pitch, world, POV characters,
  themes, continuity facts, mood/register — and structure the prompt as a
  visual brief. The image model is asked to infer the book's genre, era,
  and aesthetic register from the canon itself, then compose a cover that
  reflects THIS book specifically, not its genre's conventional packaging.
"""
import argparse
import json
import re
from pathlib import Path
from typing import Optional


# ----------------------------- file utilities -----------------------------

def read_text(path: Path) -> str:
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8").strip()


def strip_h1(md: str) -> str:
    """Drop a leading '# Title' line; canon docs usually start with one."""
    lines = md.splitlines()
    if lines and lines[0].lstrip().startswith("# ") and not lines[0].lstrip().startswith("## "):
        return "\n".join(lines[1:]).lstrip()
    return md


def cap(text: str, max_chars: int) -> str:
    """Return at most max_chars of text, ending at a paragraph or line break if possible."""
    text = text.strip()
    if len(text) <= max_chars:
        return text
    cut = text[:max_chars]
    # Prefer paragraph boundary
    last_para = cut.rfind("\n\n")
    if last_para > max_chars * 0.6:
        return cut[:last_para].rstrip()
    # Else line boundary
    last_line = cut.rfind("\n")
    if last_line > max_chars * 0.6:
        return cut[:last_line].rstrip()
    return cut.rstrip()


def extract_section(md: str, heading_match: str, max_chars: int = 2000) -> str:
    """Extract content under an H2 (## ) heading until the next H2 or EOF.

    heading_match is a substring matched case-insensitively against the
    heading text (after the '## '). Returns '' if not found.
    """
    target = heading_match.lower()
    out: list[str] = []
    in_section = False
    for line in md.splitlines():
        stripped = line.strip()
        is_h2 = stripped.startswith("## ") and not stripped.startswith("### ")
        if not in_section:
            if is_h2 and target in stripped[3:].strip().lower():
                in_section = True
            continue
        if is_h2:
            break
        out.append(line)
    content = "\n".join(out).strip()
    return cap(content, max_chars) if content else ""


# ----------------------------- canon readers -----------------------------

def canon_pitch(canon: Path) -> str:
    """Whole pitch — usually short and visually evocative."""
    return cap(strip_h1(read_text(canon / "pitch.md")), 1500)


def canon_world(canon: Path) -> str:
    """World, with sensory register if present, else first ~1500 chars."""
    md = strip_h1(read_text(canon / "world.md"))
    if not md:
        return ""
    # Prefer the sensory register section if it exists.
    sensory = extract_section(md, "sensory register", max_chars=1200)
    mood = extract_section(md, "mood", max_chars=600)
    period = extract_section(md, "period texture", max_chars=1000)
    if sensory or mood or period:
        parts = [p for p in (period, sensory, mood) if p]
        return "\n\n".join(parts)
    return cap(md, 1500)


def canon_characters(canon: Path) -> str:
    """POV characters — just the brief intro lines per character, not full bios."""
    md = strip_h1(read_text(canon / "characters.md"))
    if not md:
        return ""
    pov = extract_section(md, "pov characters", max_chars=3000)
    if not pov:
        return cap(md, 1500)

    # Strip deep detail: keep H3 headings + the **Age:** / **Role:** / first paragraph after each.
    out: list[str] = []
    capture_lines = 0
    for line in pov.splitlines():
        s = line.strip()
        if s.startswith("### "):
            out.append(s)
            capture_lines = 6  # keep next ~6 non-empty lines (age, role, brief)
            continue
        if capture_lines > 0 and s:
            # Skip "Inner drives:" and deeper sections — visual cover doesn't need them.
            if s.startswith("**Inner drives:") or s.startswith("**Relationships:"):
                capture_lines = 0
                continue
            out.append(s)
            capture_lines -= 1
    return cap("\n".join(out), 1500)


def canon_themes(canon: Path) -> str:
    """Themes — section headings and their first paragraph each."""
    md = strip_h1(read_text(canon / "themes.md"))
    if not md:
        return ""
    out: list[str] = []
    capture = False
    para_lines = 0
    for line in md.splitlines():
        s = line.strip()
        if s.startswith("## ") or re.match(r"^\d+\.\s", s):
            out.append(s)
            capture = True
            para_lines = 0
            continue
        if capture:
            if not s and para_lines > 0:
                capture = False
                continue
            if s:
                out.append(s)
                para_lines += 1
                if para_lines >= 3:
                    capture = False
    return cap("\n".join(out), 1500)


def canon_continuity(canon: Path) -> str:
    """Continuity — usually a short numbered list of hard facts."""
    return cap(strip_h1(read_text(canon / "continuity.md")), 2000)


def canon_style_register(canon: Path) -> str:
    """Style.md is intentionally NOT used for cover prompts.

    Canon style guides describe prose mechanics (POV, tense, dialogue tags) —
    information that has no useful visual analogue. Mood and register for
    covers come from world.md (sensory register) and pitch.md.

    Kept as a function for future extension if a book's style.md gains a
    dedicated visual-mood section.
    """
    return ""


def book_title_from_config(book_dir: Path, fallback: str) -> str:
    cfg = book_dir / "cdk.config.json"
    if not cfg.exists():
        return fallback
    try:
        data = json.loads(cfg.read_text(encoding="utf-8"))
    except Exception:
        return fallback
    return data.get("title") or fallback


# ----------------------------- prompt builder -----------------------------

def build_prompt(
    *,
    title: str,
    author: str,
    brief: str,
    pitch: str,
    world: str,
    characters: str,
    themes: str,
    continuity: str,
    style_register: str,
    art_direction: str,
    include_text: bool,
) -> str:
    sections: list[str] = []

    sections.append(
        "You are designing a cover for a novel. Read the canon material below "
        "and design a cover that visually expresses what THIS specific book is — "
        "not what its genre conventionally looks like."
    )

    sections.append(f'Title: "{title}"')

    if brief:
        sections.append("## Author brief (original intent)\n\n" + brief)
    if pitch:
        sections.append("## Story (pitch)\n\n" + pitch)
    if world:
        sections.append("## World (setting, period, sensory register)\n\n" + world)
    if characters:
        sections.append("## Point-of-view characters (brief)\n\n" + characters)
    if themes:
        sections.append("## Themes\n\n" + themes)
    if continuity:
        sections.append("## Hard facts (do not contradict)\n\n" + continuity)
    if style_register:
        sections.append("## Mood and register (from the prose itself)\n\n" + style_register)

    sections.append(
        "## Cover design\n\n"
        "Before composing, identify:\n"
        "- The book's genre and era.\n"
        "- One image, object, motif, or landscape from the canon that captures the book's central question.\n"
        "- The visual register the prose itself suggests (austere, lush, gritty, luminous, restrained, etc.).\n"
        "- The publishing aesthetic this book would inhabit on a bookstore shelf "
        "(literary fiction, genre fantasy, literary thriller, narrative non-fiction, etc.).\n\n"
        "Then compose:\n"
        "- Vertical book cover (front cover only).\n"
        "- Strong silhouette and a clear focal point.\n"
        "- Period-accurate detail. No anachronistic objects.\n"
        "- A visual register consistent with what the prose itself does — not its genre's conventional packaging.\n"
        "- Leave breathing room near the top for the title and near the bottom for the author line.\n"
        "- No visible brand logos, watermarks, signatures, or QR codes.\n"
        "- No depiction of recognizable real persons.\n"
    )

    if art_direction:
        sections.append("## Explicit art direction\n\n" + art_direction)

    if include_text:
        byline = f'by {author}' if author else ""
        sections.append(
            "## Typography\n\n"
            f'Include the title: "{title}"\n'
            + (f'Include the byline: "{byline}"\n' if byline else "")
            + "Choose a type treatment appropriate to the book's period and tone.\n"
            "Keep text high contrast and legible at thumbnail size."
        )

    return "\n\n".join(sections).strip()


# ----------------------------- main -----------------------------

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
    parser.add_argument(
        "--no-brief",
        action="store_true",
        help="Skip the brief.md inclusion (use canon only).",
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    book_dir = repo_root / "library" / args.book
    if not book_dir.is_dir():
        raise SystemExit(f"error: book not found: {book_dir}")

    canon = book_dir / "canon"
    title = args.title or book_title_from_config(book_dir, args.book)

    brief = "" if args.no_brief else cap(read_text(book_dir / "brief.md"), 2000)

    prompt = build_prompt(
        title=title,
        author=args.author,
        brief=brief,
        pitch=canon_pitch(canon),
        world=canon_world(canon),
        characters=canon_characters(canon),
        themes=canon_themes(canon),
        continuity=canon_continuity(canon),
        style_register=canon_style_register(canon),
        art_direction=args.art_direction,
        include_text=args.include_text,
    )

    print(prompt)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
