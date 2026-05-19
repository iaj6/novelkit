"""Tests for press/tts_elevenlabs.py chunking + context helpers."""
from tts_elevenlabs import chunk_text, context_tail, context_head, CONTEXT_WINDOW_CHARS


class TestChunkText:
    def test_short_text_one_chunk(self):
        text = "A short chapter."
        assert chunk_text(text, max_chars=38000) == [text]

    def test_text_exactly_at_limit_one_chunk(self):
        text = "x" * 100
        assert chunk_text(text, max_chars=100) == [text]

    def test_splits_long_text_on_paragraph_boundaries(self):
        para = ("word " * 2000).strip()  # ~10K chars per paragraph
        text = "\n\n".join([para] * 5)  # ~50K total
        chunks = chunk_text(text, max_chars=38000)
        assert len(chunks) >= 2
        for c in chunks:
            assert len(c) <= 38000

    def test_typical_chapter_does_not_chunk_at_38k_cap(self):
        # ~6K-char chapter (typical for the library) under 38K cap = no split.
        chapter = ("This is a sentence in the chapter. " * 180).strip()
        chunks = chunk_text(chapter, max_chars=38000)
        assert len(chunks) == 1

    def test_chunk_text_handles_empty_input(self):
        # chunk_text strips and returns [text]; for empty input it returns [""].
        result = chunk_text("   ", max_chars=100)
        assert result == [""]


class TestContextTail:
    def test_returns_full_text_when_shorter_than_window(self):
        assert context_tail("hello", 50) == "hello"

    def test_returns_last_n_chars_snapped_to_word_boundary(self):
        text = "the quick brown fox jumped over a lazy dog"
        out = context_tail(text, 15)
        # Should be the last ~15 chars but starting at a word boundary.
        assert len(out) <= 15
        assert text.endswith(out)
        # First char should not be mid-word — should be either the start
        # of the slice or the char after a space.
        assert out[0] != " "

    def test_uses_default_window_size(self):
        text = "x" * 1000
        out = context_tail(text)
        assert len(out) == CONTEXT_WINDOW_CHARS

    def test_no_spaces_returns_raw_tail(self):
        text = "a" * 50
        out = context_tail(text, 10)
        # No word boundary to snap to, so returns the raw slice.
        assert out == "a" * 10


class TestContextHead:
    def test_returns_full_text_when_shorter_than_window(self):
        assert context_head("hello", 50) == "hello"

    def test_returns_first_n_chars_snapped_to_word_boundary(self):
        text = "the quick brown fox jumped over a lazy dog"
        out = context_head(text, 15)
        assert len(out) <= 15
        assert text.startswith(out)
        # Last char should not be mid-word.
        assert out[-1] != " "

    def test_no_spaces_returns_raw_head(self):
        text = "a" * 50
        out = context_head(text, 10)
        assert out == "a" * 10
