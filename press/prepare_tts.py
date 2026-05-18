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
    """
    Splits on H1 headings used in manuscripts:
      # Prologue — Title
      # Chapter N — Title
    """
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
            # Ignore any preamble.
            continue
        current["lines"].append(line)

    if current:
        parts.append(current)

    for p in parts:
        p["body"] = clean_markdown_for_tts("\n".join(p.pop("lines")))
    return parts


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
