# Site — *lantern &amp; page*

The reading room for the NovelKit library. An Astro static site that indexes the books in `../library/` and serves the publishing artifacts the press produces.

The imprint is *lantern & page*. The aesthetic is "reading room at dusk": warm cream paper, deep ink, a single brass-amber accent, italic Fraunces display + Newsreader editorial body.

## Quick start

```bash
cd site
npm install        # first time only
npm run dev        # serves at http://localhost:4321 (auto-syncs library/ first)
npm run build      # builds to dist/ (auto-syncs library/ first)
npm run preview    # serves the built site
npm run sync       # manually re-sync library/<slug>/build/ → public/books/<slug>/
```

The `predev` and `prebuild` hooks call `scripts/sync-library.sh` to copy each book's `build/` artifacts (cover, EPUB, PDF, HTML, audiobook MP3s) into `public/books/<slug>/`. This keeps the synced artifacts out of git (see `.gitignore`) while making them static-servable.

## Routes

| Path                | Source                              | Purpose                                              |
|---------------------|-------------------------------------|------------------------------------------------------|
| `/`                 | `src/pages/index.astro`             | landing — hero, catalogue grid                       |
| `/about`            | `src/pages/about.astro`             | how the books are made; honest framing               |
| `/book/<slug>/`     | `src/pages/book/[slug].astro`       | per-book — cover, blurb, downloads                   |

Each book is generated via `getStaticPaths` from `getBooks()` (see `src/lib/library.ts`).

## Layout

```
site/
├── public/
│   ├── favicon.{svg,ico}
│   └── books/                       # synced from ../library/<slug>/build/ (gitignored)
│       └── <slug>/
│           ├── <slug>.{html,epub,pdf}
│           ├── cover.png
│           ├── audiobook/*.mp3
│           └── audiobook-openai/*.mp3
├── scripts/
│   └── sync-library.sh              # copies library/<slug>/build/ → public/books/<slug>/
└── src/
    ├── components/
    │   ├── BaseLayout.astro
    │   ├── Header.astro
    │   ├── Footer.astro
    │   ├── Wordmark.astro
    │   ├── Ornament.astro
    │   └── BookCard.astro
    ├── lib/
    │   └── library.ts               # reads ../library/ at build time → Book[]
    ├── pages/
    │   ├── index.astro
    │   ├── about.astro
    │   └── book/[slug].astro
    └── styles/
        └── global.css               # design tokens, fonts, reset, base type
```

## Design system at a glance

```
--paper:        #F4EBD9   /* base warm cream */
--ink:          #1C140F   /* primary text */
--lantern:      #C99A4A   /* single accent — links and marks */
--cloth:        #5C6B5C   /* muted green, occasional secondary */

--font-display: Fraunces  /* italic, SOFT axis 50–100, opsz axis */
--font-body:    Newsreader /* editorial, opsz axis */
```

Component styles are scoped to each `.astro` file. Tokens, base type, and resets live in `src/styles/global.css`.

## Asset generation (deferred)

The current scaffold uses inline SVG (the lantern in the hero, the ornament between sections) and CSS placeholders for missing covers. Four asset slots remain to fill with generated images:

- **Wordmark / logo** — a refined type-led mark for header and social cards
- **Favicon** — derived from the wordmark
- **Hero background** — a *village bookstore at dusk* establishing image
- **Book covers** — generated per book via `press/generate_cover.sh <slug>`
- **Decorative spot elements** — optional; the inline lantern SVG works for now

Cover generation is already wired up via the press: `press/synthesize_cover_brief.py` (Claude) → `press/generate_image.py` (OpenAI gpt-image-1.5). After running it, re-run `npm run sync` and the new covers appear.
