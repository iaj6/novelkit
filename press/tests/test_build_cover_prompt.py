"""Tests for press/build_cover_prompt.py (pure helpers — canon reading and prompt assembly)."""
from pathlib import Path
import tempfile
import json

import build_cover_prompt as bcp


# ── cap (text capping at boundary) ──────────────────────────────────────

class TestCap:
    def test_short_text_unchanged(self):
        assert bcp.cap("short", 100) == "short"

    def test_caps_at_paragraph_boundary_when_available(self):
        # max_chars=22 puts the paragraph break (pos 14) in the latter 60%
        # of the cut, which is the threshold the function uses to prefer
        # a paragraph boundary over a hard cut.
        text = "Paragraph one.\n\nParagraph two with extra content that runs long."
        out = bcp.cap(text, 22)
        assert out == "Paragraph one."

    def test_caps_at_line_boundary_when_no_paragraph_boundary(self):
        text = "Line one\nLine two\nLine three line three line three line three"
        out = bcp.cap(text, 20)
        # Prefers line boundary in the latter 40% of the cut.
        assert "\n" in out or len(out) <= 20

    def test_hard_caps_when_no_boundaries(self):
        text = "no-spaces-or-newlines-just-a-long-string-of-chars"
        out = bcp.cap(text, 20)
        assert len(out) <= 20

    def test_strips_input_first(self):
        out = bcp.cap("   x   ", 10)
        assert out == "x"


# ── strip_h1 ────────────────────────────────────────────────────────────

class TestStripH1:
    def test_drops_leading_h1(self):
        text = "# Pitch\n\nThe rest of the document."
        assert bcp.strip_h1(text) == "The rest of the document."

    def test_does_not_drop_h2(self):
        text = "## Section\n\nContent."
        assert bcp.strip_h1(text) == text

    def test_returns_unchanged_when_no_leading_h1(self):
        text = "Just content, no heading."
        assert bcp.strip_h1(text) == text


# ── extract_section (## heading-based) ──────────────────────────────────

class TestExtractSection:
    def test_extracts_matching_section_until_next_h2(self):
        md = (
            "## Mood\n\n"
            "Quiet and austere.\n\n"
            "## Plot\n\n"
            "Something else."
        )
        out = bcp.extract_section(md, "mood", max_chars=1000)
        assert "Quiet and austere." in out
        assert "Something else." not in out

    def test_case_insensitive_match(self):
        md = "## MOOD\n\nContent here."
        assert "Content here." in bcp.extract_section(md, "mood")

    def test_returns_empty_when_heading_not_found(self):
        md = "## Other\n\nStuff."
        assert bcp.extract_section(md, "mood") == ""

    def test_does_not_match_h3(self):
        md = "### Mood\n\nNested under something."
        assert bcp.extract_section(md, "mood") == ""

    def test_substring_match_in_heading_works(self):
        md = "## Sensory Register\n\nSmell of diesel and rope.\n\n## Other\n\nIgnored."
        out = bcp.extract_section(md, "sensory")
        assert "diesel" in out
        assert "Ignored" not in out


# ── canon_* readers (filesystem fixtures) ───────────────────────────────

class TestCanonReaders:
    def test_canon_pitch_strips_h1_and_caps(self):
        with tempfile.TemporaryDirectory() as tmp:
            canon = Path(tmp)
            (canon / "pitch.md").write_text("# Pitch\n\nA literary novel set in 1943 Maine.")
            out = bcp.canon_pitch(canon)
            assert out.startswith("A literary novel")

    def test_canon_pitch_empty_when_file_missing(self):
        with tempfile.TemporaryDirectory() as tmp:
            assert bcp.canon_pitch(Path(tmp)) == ""

    def test_canon_world_prefers_sensory_register_section(self):
        with tempfile.TemporaryDirectory() as tmp:
            canon = Path(tmp)
            (canon / "world.md").write_text(
                "# World\n\n"
                "## Geography\n\nGeneric overview content.\n\n"
                "## Sensory Register\n\nDiesel, rope, salt brine.\n\n"
                "## Period Texture\n\nRation books, dimout regulations.\n"
            )
            out = bcp.canon_world(canon)
            # All three of period/sensory/mood are concatenated if they exist;
            # at minimum the sensory section must appear.
            assert "Diesel, rope, salt brine." in out

    def test_canon_world_falls_back_to_first_chars_when_no_section_matches(self):
        with tempfile.TemporaryDirectory() as tmp:
            canon = Path(tmp)
            (canon / "world.md").write_text("# World\n\nJust plain content with no sections.")
            out = bcp.canon_world(canon)
            assert "Just plain content" in out

    def test_canon_characters_extracts_pov_section(self):
        with tempfile.TemporaryDirectory() as tmp:
            canon = Path(tmp)
            (canon / "characters.md").write_text(
                "# Characters\n\n"
                "## POV Characters\n\n"
                "### Eira Bowman\n"
                "**Age:** 52\n"
                "**Role:** Harbormaster\n\n"
                "## Secondary Characters\n\n"
                "Henry Crow, Lillian Crow."
            )
            out = bcp.canon_characters(canon)
            assert "Eira Bowman" in out
            assert "Harbormaster" in out
            assert "Henry Crow" not in out  # Secondary section excluded.

    def test_canon_characters_strips_inner_drives_and_relationships(self):
        with tempfile.TemporaryDirectory() as tmp:
            canon = Path(tmp)
            (canon / "characters.md").write_text(
                "## POV Characters\n\n"
                "### Eira\n"
                "**Age:** 52\n"
                "**Role:** Harbormaster\n"
                "**Inner drives:** Wants to be unremarkable.\n"
                "**Relationships:** Various.\n"
            )
            out = bcp.canon_characters(canon)
            assert "Eira" in out
            assert "Harbormaster" in out
            assert "Inner drives" not in out
            assert "Relationships" not in out

    def test_canon_themes_pulls_headings_and_paragraphs(self):
        with tempfile.TemporaryDirectory() as tmp:
            canon = Path(tmp)
            (canon / "themes.md").write_text(
                "# Themes\n\n"
                "## 1. Authority and the Body\n\n"
                "First paragraph about authority.\n\n"
                "Second paragraph.\n\n"
                "## 2. Displacement\n\n"
                "Paragraph about displacement."
            )
            out = bcp.canon_themes(canon)
            assert "Authority" in out
            assert "Displacement" in out

    def test_canon_continuity_returns_capped_text(self):
        with tempfile.TemporaryDirectory() as tmp:
            canon = Path(tmp)
            (canon / "continuity.md").write_text(
                "# Continuity\n\n"
                "1. First fact.\n"
                "2. Second fact.\n"
            )
            out = bcp.canon_continuity(canon)
            assert "First fact." in out
            assert "Second fact." in out

    def test_canon_style_register_intentionally_returns_empty(self):
        # Per the rewrite comment: style.md is prose-mechanics, not visual mood.
        with tempfile.TemporaryDirectory() as tmp:
            canon = Path(tmp)
            (canon / "style.md").write_text("## Mood\n\nAtmospheric and quiet.")
            assert bcp.canon_style_register(canon) == ""


# ── book_title_from_config ──────────────────────────────────────────────

class TestBookTitleFromConfig:
    def test_reads_title_from_cdk_config(self):
        with tempfile.TemporaryDirectory() as tmp:
            book = Path(tmp)
            (book / "cdk.config.json").write_text(json.dumps({"title": "Coldwater Reach"}))
            assert bcp.book_title_from_config(book, "fallback") == "Coldwater Reach"

    def test_falls_back_when_config_missing(self):
        with tempfile.TemporaryDirectory() as tmp:
            assert bcp.book_title_from_config(Path(tmp), "fallback") == "fallback"

    def test_falls_back_when_title_empty_or_absent(self):
        with tempfile.TemporaryDirectory() as tmp:
            book = Path(tmp)
            (book / "cdk.config.json").write_text(json.dumps({"model": "x"}))
            assert bcp.book_title_from_config(book, "fallback") == "fallback"

    def test_falls_back_on_malformed_json(self):
        with tempfile.TemporaryDirectory() as tmp:
            book = Path(tmp)
            (book / "cdk.config.json").write_text("{not json")
            assert bcp.book_title_from_config(book, "fallback") == "fallback"


# ── build_prompt (final prompt assembly) ────────────────────────────────

class TestBuildPrompt:
    def _base_kwargs(self):
        return dict(
            title="Coldwater Reach",
            author="",
            brief="",
            pitch="",
            world="",
            characters="",
            themes="",
            continuity="",
            style_register="",
            art_direction="",
            include_text=False,
        )

    def test_minimal_prompt_contains_title(self):
        out = bcp.build_prompt(**self._base_kwargs())
        assert "Coldwater Reach" in out
        assert "Cover design" in out  # composition rules section always appears

    def test_omits_empty_sections(self):
        out = bcp.build_prompt(**self._base_kwargs())
        assert "## Story (pitch)" not in out
        assert "## World" not in out

    def test_includes_sections_with_content(self):
        kw = self._base_kwargs()
        kw["pitch"] = "A literary novel."
        kw["world"] = "Coastal Maine, 1943."
        out = bcp.build_prompt(**kw)
        assert "## Story (pitch)" in out
        assert "## World" in out
        assert "Coastal Maine, 1943." in out

    def test_art_direction_section_appears_when_provided(self):
        kw = self._base_kwargs()
        kw["art_direction"] = "Specific palette: warm cream and brass."
        out = bcp.build_prompt(**kw)
        assert "Explicit art direction" in out
        assert "warm cream" in out

    def test_typography_section_only_when_include_text_true(self):
        kw = self._base_kwargs()
        kw["include_text"] = False
        assert "Typography" not in bcp.build_prompt(**kw)

        kw["include_text"] = True
        kw["author"] = "Author Name"
        out = bcp.build_prompt(**kw)
        assert "Typography" in out
        assert "Author Name" in out
