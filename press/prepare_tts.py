#!/usr/bin/env python3
import argparse
import json
import re
from pathlib import Path


def clean_markdown_for_tts(text: str) -> str:
    # Remove HTML comments like <!-- source: ... -->
    text = re.sub(r"<!--.*?-->\n?", "", text, flags=re.DOTALL)
    # Strip fenced code blocks (shouldn't exist in manuscripts, but just in case)
    text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
    # Strip common scene-break markers so they don't get spoken (---, ***).
    text = re.sub(r"(?m)^\s*-{3,}\s*$", "", text)
    text = re.sub(r"(?m)^\s*(\*\s*){3,}\s*$", "", text)
    # Blockquote markers.
    text = re.sub(r"(?m)^\s*>\s?", "", text)
    # Markdown links/images -> visible text only.
    text = re.sub(r"!\[([^\]]*)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    # Emphasis markers.
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"\*([^*]+)\*", r"\1", text)
    text = re.sub(r"__([^_]+)__", r"\1", text)
    text = re.sub(r"_([^_]+)_", r"\1", text)
    # Inline code -> plain text
    text = text.replace("`", "")
    # Collapse multiple blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def split_manuscript(manuscript: str) -> list[dict]:
    """Split a manuscript into chapters.

    Supports two formats:

    A. **Source-comment markers** (what `concat_chapters.sh` emits for CDK):

       ```
       # Book Title

       <!-- source: /path/to/draft/01-the-finding.md -->

       # The Finding
       …body…

       <!-- source: /path/to/draft/02-the-interval.md -->

       # The Interval
       …body…
       ```

       Each `<!-- source: …NN-slug.md -->` opens a new chapter. The chapter
       number comes from the `NN-` prefix in the filename; the title comes
       from the next `# Heading` line (with the leading `# ` stripped).

    B. **Explicit chapter headings** (TLT-style):

       ```
       # Chapter 1 — The Finding
       …body…

       # Prologue — Something
       …body…
       ```

       This style ignores source markers and parses the headings directly.
    """
    # Pick parser based on what the manuscript actually contains.
    has_source_markers = bool(re.search(r"^<!--\s*source:.*?-->", manuscript, re.MULTILINE))
    explicit_chapter_pattern = re.compile(r"^#\s+Chapter\s+\d+\s+—\s+.+$", re.MULTILINE)
    has_explicit_headings = bool(explicit_chapter_pattern.search(manuscript))

    if has_explicit_headings:
        return _split_by_explicit_headings(manuscript)
    if has_source_markers:
        return _split_by_source_markers(manuscript)
    # Fallback: no chapter structure detected, treat the whole manuscript as one chapter.
    return _split_as_single(manuscript)


def _split_by_explicit_headings(manuscript: str) -> list[dict]:
    """Format A: # Chapter N — Title / # Prologue — Title."""
    parts: list[dict] = []
    current = None

    for line in manuscript.splitlines():
        m = re.match(r"^#\s+(Prologue)\s+—\s+(.+)$", line)
        if m:
            if current:
                parts.append(current)
            current = {"kind": "prologue", "number": 0, "title": m.group(2), "lines": []}
            continue

        m = re.match(r"^#\s+Chapter\s+(\d+)\s+—\s+(.+)$", line)
        if m:
            if current:
                parts.append(current)
            current = {"kind": "chapter", "number": int(m.group(1)), "title": m.group(2), "lines": []}
            continue

        if current is None:
            continue  # Pre-chapter preamble (book title, dedication, etc.).
        current["lines"].append(line)

    if current:
        parts.append(current)

    for p in parts:
        p["body"] = clean_markdown_for_tts("\n".join(p.pop("lines")))
    return parts


def _split_by_source_markers(manuscript: str) -> list[dict]:
    """Format B: <!-- source: …NN-slug.md --> opens each chapter."""
    parts: list[dict] = []
    current = None

    source_re = re.compile(r"^<!--\s*source:\s*.*?/(\d{2})[-_](.+?)\.md\s*-->\s*$")

    for line in manuscript.splitlines():
        m = source_re.match(line.strip())
        if m:
            if current:
                parts.append(current)
            number = int(m.group(1))
            kind = "prologue" if number == 0 else "chapter"
            # Title comes from the next `# ` line; placeholder until we see one.
            current = {
                "kind": kind,
                "number": number,
                "title": "",
                "lines": [],
                "_awaiting_title": True,
            }
            continue

        if current is None:
            continue  # Pre-chapter preamble (book title, etc.).

        # First `# Heading` after a source marker is the chapter title.
        if current.get("_awaiting_title"):
            stripped = line.strip()
            if stripped.startswith("# ") and not stripped.startswith("## "):
                current["title"] = stripped[2:].strip()
                current["_awaiting_title"] = False
                continue
            # Skip blank lines while waiting for the title.
            if not stripped:
                continue
            # Anything else: the chapter has no `# heading` of its own.
            # Synthesize a title from the slug (e.g. "the-finding" → "The Finding").
            current["title"] = _slug_to_title("untitled")
            current["_awaiting_title"] = False
            # Fall through and include this line in the body.

        current["lines"].append(line)

    if current:
        parts.append(current)

    for p in parts:
        p.pop("_awaiting_title", None)
        p["body"] = clean_markdown_for_tts("\n".join(p.pop("lines")))
    return parts


def _split_as_single(manuscript: str) -> list[dict]:
    """Fallback: no chapter structure detected — treat the whole thing as one chapter."""
    body = clean_markdown_for_tts(manuscript)
    if not body:
        return []
    # Try to pull a title from a leading `# Title` line.
    first_line = body.splitlines()[0] if body else ""
    title = first_line[2:].strip() if first_line.startswith("# ") else "Untitled"
    return [{"kind": "chapter", "number": 1, "title": title, "body": body}]


def _slug_to_title(slug: str) -> str:
    """Convert a kebab-case slug to Title Case."""
    return " ".join(part.capitalize() for part in slug.replace("_", "-").split("-") if part)


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare per-chapter TTS text files from a manuscript.")
    parser.add_argument("--book", required=True, help="Book slug (must exist as library/<book>/).")
    parser.add_argument(
        "--out-dir",
        default=None,
        help="Output directory (default: library/<book>/build/tts).",
    )
    parser.add_argument(
        "--speak-headings",
        action="store_true",
        help="Prefix each chapter with a spoken heading like 'Chapter 1: ...'.",
    )
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    book_dir = root / "library" / args.book
    if not book_dir.is_dir():
        raise SystemExit(f"Missing book directory: {book_dir}")

    manuscript_path = book_dir / "manuscript.md"
    if not manuscript_path.exists():
        raise SystemExit(
            f"Missing manuscript: {manuscript_path}\n"
            f"(Run press/concat_chapters.sh {args.book} first.)"
        )

    out_root = Path(args.out_dir) if args.out_dir else (book_dir / "build" / "tts")
    out_root.mkdir(parents=True, exist_ok=True)

    parts = split_manuscript(manuscript_path.read_text(encoding="utf-8"))
    manifest = {"book": args.book, "chapters": []}

    for p in parts:
        if p["kind"] == "prologue":
            slug = "00-prologue"
            heading = f"Prologue. {p['title']}."
        else:
            slug = f"{p['number']:02d}-chapter"
            heading = f"Chapter {p['number']}. {p['title']}."

        tts_text = p["body"].strip()
        if args.speak_headings:
            tts_text = f"{heading}\n\n{tts_text}"

        out_txt = out_root / f"{slug}.txt"
        out_txt.write_text(tts_text + "\n", encoding="utf-8")

        manifest["chapters"].append(
            {
                "kind": p["kind"],
                "number": p["number"],
                "title": p["title"],
                "slug": slug,
                "text_file": str(out_txt.relative_to(root)),
            }
        )

    (out_root / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(str((out_root / "manifest.json").relative_to(root)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
