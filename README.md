# NovelKit

An end-to-end pipeline for drafting novels with AI agents, publishing them as books, and presenting them on the web.

Books drafted with this kit are not pretending to be human-authored. The brief is the only human input; everything else — canon, outline, draft, edits, cover, audiobook — is produced by agents from that brief. The repo is a demonstration of what becomes possible when you ask AI to do all of this, not most of it.

## What's here

```
novelkit/
├── cdk/           # the drafter — Claude Agent SDK, TypeScript
├── press/         # the publisher — pandoc, WeasyPrint, OpenAI image, ElevenLabs/OpenAI TTS
├── site/          # the reading room — Astro static site (empty scaffold)
└── library/       # the books — finished outputs (each is its own CDK project)
```

The three subsystems are deliberately independent. They communicate through the filesystem (`library/<book>/`) — no shared runtime, no shared types, no monorepo tooling. Each has its own README.

## End-to-end pipeline

```
brief.md                              ──┐
                                        │
  cdk: architect, plotter, drafter,     │
       editor, reader                   │
                                        ▼
library/<book>/
  ├── canon/                  ◄─── world, characters, themes, threads, …
  ├── outline/                ◄─── per-chapter plans
  ├── draft/                  ◄─── per-chapter prose
  └── logs/                   ◄─── continuity, scene log, run trace
                                        │
                                        │
  press: concat_chapters, md_to_html,   │
         md_to_epub, html_to_pdf,       │
         synthesize_cover_brief,        │
         generate_image, prepare_tts,   │
         tts_openai / tts_elevenlabs    │
                                        ▼
library/<book>/
  ├── manuscript.md           ◄─── concatenated drafts
  └── build/
      ├── <book>.html
      ├── <book>.epub
      ├── <book>.pdf
      ├── cover.png
      ├── cover-prompt.md     ◄─── the synthesized brief Claude wrote for the image model
      ├── tts/                ◄─── per-chapter cleaned text + manifest.json
      ├── audiobook/          ◄─── ElevenLabs MP3s
      └── audiobook-openai/   ◄─── OpenAI TTS MP3s
                                        │
                                        │
  site: Astro reads library/<book>/     │
                                        ▼
  the reading room
```

## Quick start (one book, end-to-end)

Requires Node ≥22, Python 3, and pandoc.

```bash
# 1. Copy keys.
cp .env.example .env       # fill in ANTHROPIC_API_KEY at minimum;
                           # OPENAI_API_KEY for covers/TTS;
                           # ELEVENLABS_API_KEY for premium audiobooks

# 2. Scaffold a book and write your brief.
cd cdk
npm install
npm run cdk -- init ../library/my-book --title "My Book"
$EDITOR ../library/my-book/brief.md

# 3. Draft the book (autonomous, costs Anthropic spend).
npm run cdk -- run ../library/my-book

# 4. Publish.
cd ../press
./concat_chapters.sh my-book        # → library/my-book/manuscript.md
./build_book.sh my-book             # → HTML / EPUB / PDF
./generate_cover.sh my-book         # → cover.png (synthesizes brief via Claude first)
./build_audiobook_openai.sh my-book # → MP3s (optional, costs OpenAI spend)

# 5. Serve the reading room.
cd ../site
npm install
npm run dev                         # → http://localhost:4321
```

Each subsystem has its own README with the full options:
- [cdk/README.md](cdk/README.md) — the drafter
- [press/README.md](press/README.md) — the publisher
- [site/README.md](site/README.md) — the reading room

## What's in `library/` already

Demo books drafted with earlier and current versions of CDK. Read order suggestion:

- **coldwater-reach** — 30-chapter literary novel (~65,000 words). 1943–45 coastal Maine. Three POV characters; deliberately unresolved spine question. The headline output.
- **the-cold-signal** — Antarctic isolation thriller. Twelve days at Halvorsen Station.
- **vilcabamba-expedition** — 1930s expedition into the eastern Cordillera Vilcabamba.
- **tiny-toy-output** — minimal 3-chapter demo; fastest to read end-to-end.

## Costs

The pipeline incurs API spend at multiple stages. Rough order of magnitude per ~80K-word novel:

- Drafting (Anthropic): single dollars to tens of dollars depending on model
- Cover brief synthesis (Anthropic): ~$0.01–0.02
- Cover image (OpenAI): ~$0.04–0.20
- Audiobook (OpenAI TTS): ~$1–2 per hour of audio
- Audiobook (ElevenLabs): ~$10–20 per hour of audio at premium voice

Skip what you don't need. The text outputs alone (no cover, no audio) are cheap to read.

## Deploying the site

The reading room deploys to GitHub Pages via `.github/workflows/deploy.yml`. After pushing the repo to `github.com/<user>/novelkit`:

1. Enable Pages in repo settings (Source: GitHub Actions).
2. Push to `main`. The workflow builds `site/` and deploys.
3. Site lands at `https://<user>.github.io/novelkit/`.

See [site/README.md](site/README.md) for custom-domain instructions.

## Status

Showcase repo. Not productized. Not on a roadmap. Code is provided as-is for demonstration and for forking by anyone interested in the same approach.

## License

MIT. See [LICENSE](LICENSE).
