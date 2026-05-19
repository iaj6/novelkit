"""Tests for press/tts_openai.py chunking logic."""
from tts_openai import chunk_text


class TestChunkText:
    def test_short_text_one_chunk(self):
        text = "A short paragraph."
        chunks = chunk_text(text, max_chars=100)
        assert chunks == [text]

    def test_text_exactly_at_limit_one_chunk(self):
        text = "x" * 100
        chunks = chunk_text(text, max_chars=100)
        assert len(chunks) == 1
        assert chunks[0] == text

    def test_splits_on_paragraph_boundary(self):
        para_a = "Paragraph one. " * 5
        para_b = "Paragraph two. " * 5
        text = para_a.strip() + "\n\n" + para_b.strip()
        chunks = chunk_text(text, max_chars=120)
        # Each paragraph fits in one chunk; should split between them.
        assert len(chunks) >= 2
        for c in chunks:
            assert len(c) <= 120

    def test_long_single_paragraph_falls_back_to_sentence_split(self):
        # One paragraph longer than max_chars, multiple sentences.
        text = "This is sentence one. " * 20  # ~440 chars
        chunks = chunk_text(text, max_chars=100)
        assert len(chunks) > 1
        for c in chunks:
            assert len(c) <= 100

    def test_super_long_sentence_hard_splits(self):
        text = "a" * 300  # no sentence boundaries
        chunks = chunk_text(text, max_chars=100)
        assert len(chunks) == 3
        for c in chunks:
            assert len(c) <= 100

    def test_all_chunks_non_empty(self):
        text = "Para A.\n\nPara B.\n\nPara C."
        chunks = chunk_text(text, max_chars=10)
        assert all(c.strip() for c in chunks)

    def test_strips_leading_trailing_whitespace_from_input(self):
        text = "\n\n   actual content.   \n\n"
        chunks = chunk_text(text, max_chars=100)
        assert chunks == ["actual content."]

    def test_reasonable_chunk_count_for_typical_chapter(self):
        # ~6K-char chapter at OpenAI's 4500-char cap should yield 2 chunks.
        chapter = ("This is a sentence in the chapter. " * 180).strip()
        assert 5500 < len(chapter) < 7500
        chunks = chunk_text(chapter, max_chars=4500)
        assert 2 <= len(chunks) <= 3
        for c in chunks:
            assert len(c) <= 4500
