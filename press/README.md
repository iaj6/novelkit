# Press

The publishing pipeline. Turns a book's per-chapter drafts (under `library/<book>/draft/`) into HTML, EPUB, PDF, cover art, and audiobook MP3s.

## Layout assumed

```
library/<book>/
├── brief.md
├── cdk.config.json     # title is read from here
├── canon/              # used by the cover prompt
├── draft/              # NN-*.md per chapter
└── build/              # produced by these scripts
    ├── <book>.html
    ├── <book>.epub
    ├── <book>.pdf
    ├── cover.png
    ├── tts/            # per-chapter cleaned text + manifest.json
    ├── audiobook/      # ElevenLabs MP3s
    └── audiobook-openai/  # OpenAI TTS MP3s
```

## Requirements

- `pandoc` (Homebrew: `brew install pandoc`)
- For PDF: `weasyprint` (preferred) or `wkhtmltopdf`, otherwise pandoc's `xelatex` fallback runs but won't honor the CSS
- For cover art: Python `openai` package, `OPENAI_API_KEY`
- For ElevenLabs audio: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`
- For OpenAI TTS audio: `OPENAI_API_KEY`

Install WeasyPrint with macOS dylib shims:

```bash
press/install_weasyprint.sh
```

## Quick start (one book)

```bash
# 1. Concatenate the drafts produced by cdk into a single manuscript.
press/concat_chapters.sh coldwater-reach

# 2. Build HTML, EPUB, and PDF.
press/build_book.sh coldwater-reach

# 3. (Optional) Generate cover art and rebuild so it embeds.
press/generate_cover.sh coldwater-reach
press/build_book.sh coldwater-reach

# 4. (Optional) Generate audiobook MP3s.
press/build_audiobook_openai.sh coldwater-reach    # OpenAI TTS, cheaper
press/build_audiobook.sh coldwater-reach           # ElevenLabs, premium
```

Outputs land under `library/coldwater-reach/build/`.

## All books at once

```bash
press/concat_chapters.sh                          # every book
press/build_all.sh                                # every book that has a manuscript.md
press/build_assets.sh [--with-text]               # covers for every book, then rebuild
press/build_audiobooks_all.sh [--openai]          # audiobooks for every book
```

`build_all.sh` and `build_audiobooks_all.sh` skip any book under `library/` that doesn't yet have a `manuscript.md`.

## Per-book overrides

The metadata in HTML/EPUB front matter is read from `library/<book>/cdk.config.json`'s `title`, with optional env-var overrides:

```bash
AUTHOR="Anonymous" \
DEDICATION="For the ones who stayed." \
EPIGRAPH="A door, then a road." \
EPIGRAPH_ATTRIBUTION="Old saying" \
press/build_book.sh coldwater-reach
```

Other env vars: `TITLE` (overrides config), `LANG` (default `en`).

## TTS knobs (OpenAI)

Override defaults via env vars:

- `OPENAI_TTS_MODEL` (default `gpt-4o-mini-tts`)
- `OPENAI_TTS_VOICE` (default `alloy`)
- `OPENAI_TTS_FORMAT` (default `mp3`)
- `OPENAI_TTS_SPEED` (default `1.0`)
- `OPENAI_TTS_MAX_CHARS` (default `4500`; auto-splits further if the API rejects)

Long chapters that exceed the API input limit produce `<slug>.partNN.mp3` files plus a `<slug>.m3u` playlist.

## TTS knobs (ElevenLabs)

- `ELEVENLABS_MODEL_ID` (default `eleven_v3` — latest, best emotional range)
  - Other valid models: `eleven_multilingual_v2`, `eleven_flash_v2_5`
- `ELEVENLABS_STABILITY` (default `0.35`)
- `ELEVENLABS_SIMILARITY` (default `0.75`)
- `ELEVENLABS_STYLE` (default `0.15`)
- `ELEVENLABS_SPEED` (default `1.0` — new field in voice_settings as of 2025)

List voices: `press/list_elevenlabs_voices.sh` writes `build/elevenlabs/voices.tsv`.

## Cover art

`press/generate_cover.sh <book> [--with-text]` reads `library/<book>/canon/{pitch,world,characters,themes,continuity,style}.md`, synthesizes a book-specific image prompt, and calls OpenAI's image API (default model `gpt-image-1.5`; override via `OPENAI_IMAGE_MODEL` env var). The prompt asks the image model to infer the book's genre, era, and visual register from the canon before composing — covers should reflect what the specific book is, not its genre's conventional packaging. Pass `--art-direction "..."` to `press/build_cover_prompt.py` directly to inject explicit composition guidance.

`--with-text` asks the model to render the title and author in the image. Less reliable than overlaying type yourself; use at your own risk.

## Customization

- `press/book.css` — typography for HTML and EPUB
- `press/templates/book.html` — pandoc title-page / TOC layout
- `press/filters/chapter_headings.lua` — turns `# Chapter N — Title` headings into structured HTML

## `.env` setup

Copy `.env.example` at the repo root to `.env` and fill in the keys you need. Scripts source it via `press/load_env.sh`.
