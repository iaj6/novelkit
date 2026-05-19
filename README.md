# NovelKit

An end-to-end pipeline for drafting novels with AI agents, publishing them as books, and presenting them on the web.

Books drafted with this kit are not pretending to be human-authored. The brief is the only human input; everything else — canon, outline, draft, edits, cover, audiobook — is produced by agents from that brief. The repo is a demonstration of what becomes possible when you ask AI to do all of this, not most of it.

**Live site**: https://iaj6.github.io/novelkit/ — the reading room, branded as *lantern & page*.

## What's here

```
novelkit/
├── cdk/           # the drafter — Claude Agent SDK, TypeScript
├── press/         # the publisher — pandoc, WeasyPrint, OpenAI image, ElevenLabs/OpenAI TTS
├── site/          # the reading room — Astro static site (deployed)
└── library/       # the books — finished outputs (each is its own CDK project)
```

The three subsystems are deliberately independent. They communicate through the filesystem (`library/<book>/`) — no shared runtime, no shared types, no monorepo tooling. Each has its own README.

## End-to-end pipeline

```
brief.md                              ──┐
                                        │
  cdk: architect, plotter, threads,     │
       drafter, editor, reader,         │
       continuity-fact-audit            │
                                        ▼
library/<book>/
  ├── canon/                  ◄─── world, characters, themes, threads, continuity
  ├── outline/                ◄─── per-chapter plans
  ├── draft/                  ◄─── per-chapter prose
  └── logs/                   ◄─── continuity, scene log, run trace, findings
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
  cdk publish <book>                    │  ◄─── flips visibility in cdk.config.json
                                        │
                                        ▼
  site: Astro reads library/<book>/ for any book with visibility="public"
                                        │
                                        ▼
  the reading room — deployed to GitHub Pages
```

## Quick start (one book, end-to-end)

Requires Node ≥22, Python 3, pandoc, and `cwebp` (for image optimization).

```bash
# 1. Keys.
cp .env.example .env
# Fill in: ANTHROPIC_API_KEY (required), OPENAI_API_KEY (covers + TTS),
#         ELEVENLABS_API_KEY (premium audio, optional).

# 2. Scaffold a book and write your brief.
cd cdk
npm install
npm run cdk -- init ../library/my-book --title "My Book"
$EDITOR ../library/my-book/brief.md

# 3. Draft the book.
npm run cdk -- run ../library/my-book
# You'll see a pre-run plan with estimated cost + ETA before anything runs.
# Live cost tally on every result line. Coloured phase labels. Heartbeat
# during long thinking pauses.

# 4. Publish.
cd ../press
./concat_chapters.sh my-book              # → library/my-book/manuscript.md
./build_book.sh my-book                   # → HTML / EPUB / PDF
./generate_cover.sh my-book               # → cover.png (Claude synthesizes the brief,
                                          #   gpt-image-1.5 paints it)
./build_audiobook_openai.sh my-book       # → MP3s (optional, costs OpenAI TTS spend)

# 5. Mark it as public on the site.
cd ../cdk
npm run cdk -- publish ../library/my-book
# Local change to cdk.config.json — commit and push to deploy.

# 6. Serve the reading room locally.
cd ../site
npm install
npm run dev                               # → http://localhost:4321/novelkit/
```

Each subsystem has its own README with the full options:
- [cdk/README.md](cdk/README.md) — the drafter
- [press/README.md](press/README.md) — the publisher
- [site/README.md](site/README.md) — the reading room

## The publishing model

Books are private by default. Nothing in `library/` appears on the site until you flip the switch.

```bash
cdk publish <dir>     # set visibility: public
cdk unpublish <dir>   # set visibility: private (default)
```

This lives as a `"visibility"` field in `cdk.config.json`. The site filters `getBooks()` to `visibility === "public"` and ignores everything else — even if a book has chapters, a cover, and an audiobook, it won't show up until you publish it. After flipping the field, commit and push to deploy.

Why: CDK runs produce a lot of in-flight drafts. A draft you're iterating on shouldn't auto-appear on the public reading room.

## What's in `library/` already

```
coldwater-reach        published   30-chapter literary novel — 1943–45 coastal Maine
the-cold-signal        published   Antarctic isolation thriller — twelve days at Halvorsen Station
vilcabamba-expedition  published   1930s expedition into the eastern Cordillera Vilcabamba
tiny-toy-output        published   minimal 3-chapter demo — fastest end-to-end read
coldwater-reach-v031   private     in-progress sibling run
the-hollowback         private     in-progress YA fantasy
tiny-toy               private     brief only — superseded by tiny-toy-output
```

**Read order suggestion**: tiny-toy-output (5 minutes) → the-cold-signal (~40 minutes) → coldwater-reach (~3 hours, the headline output).

## Costs

Calibrated against real `run.jsonl` data from completed pipeline runs. Per ~80K-word novel on `claude-sonnet-4-6`:

| stage | spend | notes |
|---|---|---|
| Drafting + editor passes + reader | ~$4 fixed + ~$2/chapter | Pre-run banner shows a band before each run starts |
| Cover brief synthesis (Anthropic) | ~$0.01–0.02 | Claude reads the canon, writes a focused visual brief |
| Cover image (OpenAI gpt-image-1.5) | ~$0.04–0.20 | One call, ~30 seconds |
| Audiobook (OpenAI TTS, Flash) | ~$0.05/1K chars | ~$20 for a 30-chapter novel |
| Audiobook (ElevenLabs eleven_v3) | ~$0.30/1K chars | Higher quality; ~$120 for the same novel |

Skip what you don't need. Text outputs alone (no cover, no audio) are cheap.

## Deploying the site

GitHub Pages via `.github/workflows/deploy.yml`. After pushing the repo:

1. Enable Pages in repo settings (Source: GitHub Actions).
2. Push to `main`. The workflow builds `site/` and deploys.
3. Site lands at `https://<user>.github.io/novelkit/`.

See [site/README.md](site/README.md) for the custom-domain swap (drop the base path + add a CNAME).

## Tests

```bash
# cdk
cd cdk && npm test                     # vitest — 45 tests, ~150ms
cd cdk && npm run test:coverage        # >80% on ansi, runlog, estimate, state

# press
cd press && python3 -m pytest          # pytest — 78 tests, ~80ms
cd press && python3 -m pytest --cov    # 86% across modules

# site
cd site && npm test                    # vitest — 33 tests, ~150ms
cd site && npm run test:coverage       # 93% on library.ts
```

CI runs all three suites on every push and PR via `.github/workflows/test.yml`. Dependabot keeps npm packages, Python deps, and GitHub Actions versions up to date with weekly PRs.

## Security

See [SECURITY.md](SECURITY.md). TL;DR: no user data, no analytics, no third-party scripts on the deployed site. API keys live in a gitignored `.env` and never reach the repo. Secret scanning + push protection are enabled.

## Status

Showcase repo. Not productized. Not on a roadmap. Code is provided as-is for demonstration and for forking by anyone interested in the same approach.

## License

MIT. See [LICENSE](LICENSE).
