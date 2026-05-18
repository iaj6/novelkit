# Scripts

This folder contains local build utilities for converting the Markdown manuscripts into more book-like formats.

## Requirements
- `pandoc` (installed at `/opt/homebrew/bin/pandoc` in this environment)
- For PDF:
  - Preferred: `weasyprint` or `wkhtmltopdf` (HTML/CSS-based)
  - Fallback: a LaTeX engine (this environment has `xelatex`)

## Quick Start
- Install WeasyPrint (recommended for CSS-based PDFs):
  - `scripts/install_weasyprint.sh`
- Regenerate concatenated manuscripts (if you edit `draft/`):
  - `scripts/regen_manuscripts.sh`
- Scaffold a new project from this repo’s template:
  - `scripts/novelkit.sh init ../my-new-novel --title "My New Novel" --author "Your Name"`
- Build HTML/PDF/EPUB for a single book:
  - `scripts/build_book.sh book-one`
  - `scripts/build_book.sh book-two`
  - `scripts/build_book.sh book-three`
- Build all books:
  - `scripts/build_all.sh`
- Generate cover art (requires `OPENAI_API_KEY` + `pip install openai`):
  - `scripts/generate_cover.sh book-one`
  - Optional (requests rendered title/author text in the image; less reliable): `scripts/generate_cover.sh book-one --with-text`
- Generate all covers and rebuild everything:
  - `scripts/build_assets.sh`
  - Optional: `scripts/build_assets.sh --with-text`

## Audiobook (ElevenLabs)
- Single-narrator TTS pipeline that generates per-chapter MP3s.
- Requirements:
  - `ELEVENLABS_API_KEY` in `/.env`
  - `ELEVENLABS_VOICE_ID` in `/.env` (or pass `--voice-id` when testing)
- List voices:
  - `source scripts/load_env.sh .env && python3 scripts/tts_elevenlabs.py --list-voices`
  - or write to a file: `scripts/list_elevenlabs_voices.sh` (outputs `build/elevenlabs/voices.tsv`)
- Build one book:
  - `scripts/build_audiobook.sh book-one`
- Build all:
  - `scripts/build_audiobooks_all.sh`
- Outputs:
  - `build/audiobook/<book>/*.mp3`

## Audiobook (OpenAI TTS)
- Cheaper, good-quality single-narrator TTS (keeps ElevenLabs for “premium” later).
- Requirements:
  - `OPENAI_API_KEY` in `/.env`
  - `python3 -m pip install --user openai`
- Build one book:
  - `scripts/build_audiobook_openai.sh book-one`
- Outputs:
  - Usually: `build/audiobook-openai/<book>/*.mp3`
  - For long chapters (API input limit): `*.partNN.mp3` plus a `*.m3u` playlist listing the parts in order

### TTS knobs (optional env vars)
- `OPENAI_TTS_MODEL` (default: `gpt-4o-mini-tts`)
- `OPENAI_TTS_VOICE` (default: `alloy`)
- `OPENAI_TTS_FORMAT` (default: `mp3`)
- `OPENAI_TTS_MAX_CHARS` (default: `4500`; the script also auto-splits further if the API still rejects a chunk)
- `OPENAI_TTS_SPEED` (default: `1.0`; if supported, `0.95`–`1.0` often sounds more natural)

Outputs land in `build/<book>/`:
- `build/<book>/<book>.html`
- `build/<book>/<book>.pdf`
- `build/<book>/<book>.epub`
Cover art lands in `build/assets/`.

## Customization
- Edit `scripts/book.css` for HTML + EPUB styling.
- Edit `scripts/templates/book.html` for title page / TOC layout.
- Set metadata via env vars:
  - `TITLE`, `AUTHOR`, `LANG`
  - Optional: `DEDICATION`, `EPIGRAPH`, `EPIGRAPH_ATTRIBUTION`
  - Example: `AUTHOR="Ian" scripts/build_all.sh`

Default front matter (if not overridden):
- `DEDICATION`: `For the ones who ran.`
- `EPIGRAPH`: `Names are doors.`
- `EPIGRAPH_ATTRIBUTION`: `Old road saying`

## Image generation
- Requires: `python3 -m pip install --user openai`
- Requires: `OPENAI_API_KEY` (recommended via `.env`)
- `scripts/generate_image.py` is a general-purpose helper used by `scripts/generate_cover.sh`.
- The image API may return either base64 (`b64_json`) or a hosted `url`; the script handles both.
- If `build/assets/cover-<book>.png` exists, it is automatically embedded:
  - HTML: on the title page
  - EPUB: as the EPUB cover image

### `.env` setup
- Copy `/.env.example` to `/.env`
- Put your key in `OPENAI_API_KEY="..."`
