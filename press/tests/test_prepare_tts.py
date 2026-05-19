"""Tests for press/prepare_tts.py."""
from prepare_tts import (
    clean_markdown_for_tts,
    split_manuscript,
    _split_by_explicit_headings,
    _split_by_source_markers,
    _split_as_single,
    _slug_to_title,
)


# ── clean_markdown_for_tts ───────────────────────────────────────────────

class TestCleanMarkdownForTts:
    def test_strips_html_comments(self):
        text = "<!-- source: foo.md -->\nReal content."
        assert clean_markdown_for_tts(text) == "Real content."

    def test_strips_fenced_code_blocks(self):
        text = "Before.\n```python\nprint('x')\n```\nAfter."
        assert "print" not in clean_markdown_for_tts(text)
        assert "Before." in clean_markdown_for_tts(text)
        assert "After." in clean_markdown_for_tts(text)

    def test_strips_scene_break_dashes(self):
        text = "Para one.\n\n---\n\nPara two."
        out = clean_markdown_for_tts(text)
        assert "---" not in out
        assert "Para one." in out and "Para two." in out

    def test_strips_scene_break_stars(self):
        text = "Para one.\n\n* * *\n\nPara two."
        out = clean_markdown_for_tts(text)
        assert "*" not in out
        assert "Para one." in out and "Para two." in out

    def test_strips_blockquote_markers(self):
        text = "> Quoted line.\n> Another."
        out = clean_markdown_for_tts(text)
        assert ">" not in out
        assert "Quoted line." in out
        assert "Another." in out

    def test_strips_markdown_links(self):
        text = "Visit [the site](https://example.com) for details."
        out = clean_markdown_for_tts(text)
        assert "https://example.com" not in out
        assert "the site" in out

    def test_strips_image_markdown(self):
        text = "Look: ![alt text](image.png) here."
        out = clean_markdown_for_tts(text)
        assert "image.png" not in out
        assert "alt text" in out

    def test_strips_double_star_emphasis(self):
        text = "She was **calm** about it."
        out = clean_markdown_for_tts(text)
        assert "**" not in out
        assert "calm" in out

    def test_strips_single_star_emphasis(self):
        text = "The word *Sommerbild* hung in the air."
        out = clean_markdown_for_tts(text)
        assert "*" not in out
        assert "Sommerbild" in out

    def test_strips_underscore_emphasis(self):
        text = "It was _important_."
        out = clean_markdown_for_tts(text)
        assert "_" not in out
        assert "important" in out

    def test_strips_inline_code_backticks(self):
        text = "Run `npm test` first."
        out = clean_markdown_for_tts(text)
        assert "`" not in out
        assert "npm test" in out

    def test_collapses_multiple_blank_lines(self):
        text = "Para A.\n\n\n\n\nPara B."
        out = clean_markdown_for_tts(text)
        assert "Para A.\n\nPara B." == out

    def test_idempotent_on_clean_text(self):
        text = "Just a paragraph.\n\nAnother paragraph."
        assert clean_markdown_for_tts(text) == text


# ── split_manuscript: Format A (explicit chapter headings) ───────────────

class TestSplitFormatA:
    def test_explicit_headings_recognized(self):
        ms = (
            "# Chapter 1 — The Finding\n\n"
            "Body of chapter one.\n\n"
            "# Chapter 2 — The Interval\n\n"
            "Body of chapter two."
        )
        parts = split_manuscript(ms)
        assert len(parts) == 2
        assert parts[0]["kind"] == "chapter"
        assert parts[0]["number"] == 1
        assert parts[0]["title"] == "The Finding"
        assert "Body of chapter one." in parts[0]["body"]
        assert parts[1]["number"] == 2
        assert parts[1]["title"] == "The Interval"

    def test_prologue_recognized(self):
        ms = (
            "# Prologue — The Ruin\n\n"
            "Prologue body.\n\n"
            "# Chapter 1 — The Finding\n\n"
            "Chapter body."
        )
        parts = split_manuscript(ms)
        assert len(parts) == 2
        assert parts[0]["kind"] == "prologue"
        assert parts[0]["number"] == 0
        assert parts[0]["title"] == "The Ruin"
        assert parts[1]["number"] == 1

    def test_preamble_before_first_chapter_ignored(self):
        ms = (
            "Some preamble that should not appear in any chapter.\n\n"
            "# Chapter 1 — The Finding\n\n"
            "The actual chapter content."
        )
        parts = split_manuscript(ms)
        assert len(parts) == 1
        assert "preamble" not in parts[0]["body"]
        assert "actual chapter content" in parts[0]["body"]


# ── split_manuscript: Format B (source-marker style, CDK default) ───────

class TestSplitFormatB:
    def test_source_markers_split_chapters(self):
        ms = (
            "# The Book Title\n\n"
            "<!-- source: /draft/01-the-finding.md -->\n\n"
            "# The Finding\n\n"
            "Body one.\n\n"
            "<!-- source: /draft/02-the-interval.md -->\n\n"
            "# The Interval\n\n"
            "Body two."
        )
        parts = split_manuscript(ms)
        assert len(parts) == 2
        assert parts[0]["number"] == 1
        assert parts[0]["title"] == "The Finding"
        assert "Body one." in parts[0]["body"]
        assert "Body Title" not in parts[0]["body"]  # book title shouldn't leak in
        assert parts[1]["number"] == 2
        assert parts[1]["title"] == "The Interval"

    def test_source_marker_with_prologue_number_zero(self):
        ms = (
            "# Book\n\n"
            "<!-- source: /draft/00-prologue.md -->\n\n"
            "# A Prologue\n\n"
            "Pro body.\n\n"
            "<!-- source: /draft/01-first.md -->\n\n"
            "# First Chapter\n\n"
            "Body one."
        )
        parts = split_manuscript(ms)
        assert len(parts) == 2
        assert parts[0]["kind"] == "prologue"
        assert parts[0]["number"] == 0
        assert parts[0]["title"] == "A Prologue"

    def test_source_marker_with_underscore_slug(self):
        # Some draft files might use underscore separators.
        ms = (
            "# Book\n\n"
            "<!-- source: /draft/03_chapter_name.md -->\n\n"
            "# Chapter Name\n\n"
            "Body."
        )
        parts = split_manuscript(ms)
        assert len(parts) == 1
        assert parts[0]["number"] == 3
        assert parts[0]["title"] == "Chapter Name"


# ── split_manuscript: single-chapter fallback ───────────────────────────

class TestSplitSingleFallback:
    def test_unstructured_manuscript_becomes_one_chapter(self):
        ms = "# Single Title\n\nJust a body of text without any chapter markers."
        parts = split_manuscript(ms)
        assert len(parts) == 1
        assert parts[0]["kind"] == "chapter"
        assert parts[0]["number"] == 1
        assert parts[0]["title"] == "Single Title"

    def test_no_heading_falls_back_to_untitled(self):
        ms = "Plain text with no heading at all."
        parts = split_manuscript(ms)
        assert len(parts) == 1
        assert parts[0]["title"] == "Untitled"

    def test_empty_manuscript_returns_no_parts(self):
        assert split_manuscript("") == []
        assert split_manuscript("   \n  \n") == []


# ── _slug_to_title ──────────────────────────────────────────────────────

class TestSlugToTitle:
    def test_simple_kebab(self):
        assert _slug_to_title("the-bottle") == "The Bottle"

    def test_underscore_separators(self):
        assert _slug_to_title("the_bottle") == "The Bottle"

    def test_mixed_separators(self):
        assert _slug_to_title("the_cold-signal") == "The Cold Signal"

    def test_single_word(self):
        assert _slug_to_title("untitled") == "Untitled"

    def test_strips_empty_segments(self):
        assert _slug_to_title("--double") == "Double"
