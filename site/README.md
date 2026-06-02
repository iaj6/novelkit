# Site — *lantern &amp; page*

The reading room for the NovelKit library. An Astro static site that indexes the books in `../library/` and serves the publishing artifacts the press produces.

The imprint is *lantern & page*. The aesthetic is "reading room at dusk": warm cream paper, deep ink, a single brass-amber accent, italic Fraunces display + Newsreader editorial body.

## Quick start (local)

```bash
cd site
npm install        # first time only
npm run dev        # serves at http://localhost:4321/novelkit/ (auto-syncs library/ first)
npm run build      # builds to dist/ (auto-syncs library/ first)
npm run preview    # serves the built site
npm run sync       # manually re-sync library/<slug>/build/ → public/books/<slug>/
```

The site is configured for GitHub Pages at `username.github.io/novelkit/` — `npm run dev` serves at the same path locally so internal links exercise the production URL shape.

The `predev` and `prebuild` hooks call `scripts/sync-library.sh` to copy each book's `build/` artifacts (cover, EPUB, PDF, HTML) into `public/books/<slug>/` and generate optimized WebP versions. `public/books/` IS tracked in git (the deployed source of truth); audio subdirectories and `cover-prompt.md` files are gitignored.

The sync is **visibility-aware**: it only copies books whose `cdk.config.json` is `visibility: "public"`, and it **prunes** any `public/books/<slug>/` whose book is private or no longer exists. This mirrors `getBooks()` (which filters the *pages* the same way), so the deployed files and the rendered pages always agree — a private book never leaks its downloads, and `cdk unpublish` + sync retracts a book's files, not just its page. Because CI builds only the Astro site (never the press), `public/books/` must be synced and committed for a published book's downloads to appear — see the root README's publishing model.

## Deploying to GitHub Pages

1. Push the repo to GitHub at `github.com/<your-user>/novelkit`.
2. In repo settings → Pages, set **Source** to **GitHub Actions**.
3. Push to `main`. The workflow at `.github/workflows/deploy.yml` runs `npm ci && npm run build` in `site/`, uploads `dist/`, and deploys.
4. The site appears at `https://<your-user>.github.io/novelkit/`.

The workflow only triggers on changes under `site/`, `library/`, or `.github/workflows/deploy.yml` to avoid redeploying for cdk/press-only changes.

### Switching to a custom domain

Two edits when you're ready:
- `site/astro.config.mjs`: drop the `base` line and update `site` to your domain.
- Add `site/public/CNAME` containing your domain (one line, no protocol).

The `url()` helper picks up the new BASE_URL automatically — no other code changes needed.

## Routes

| Path                    | Source                               | Purpose                                          |
|-------------------------|--------------------------------------|--------------------------------------------------|
| `/`                     | `src/pages/index.astro`              | landing — hero, catalogue grid                   |
| `/about`                | `src/pages/about.astro`              | how the books are made; honest framing           |
| `/book/<slug>/`         | `src/pages/book/[slug].astro`        | per-book — cover, blurb, downloads               |
| `/book/<slug>/listen/`  | `src/pages/book/[slug]/listen.astro` | per-book audiobook — one player per track        |

Each book page is generated via `getStaticPaths` from `getBooks()`. The `/listen/`
page is generated **only** for books with a synced audiobook (`getAudiobook()`), so it
stays in lockstep with the book page's audiobook link. See `src/lib/library.ts`.

## Layout

```
site/
├── public/
│   ├── favicon.{svg,ico}
│   └── books/                       # tracked; public books only, synced from ../library/<slug>/build/
│       └── <slug>/                  #   (visibility=public; private books are skipped + pruned)
│           ├── <slug>.{html,epub,pdf}
│           ├── cover.png             # + cover.webp, cover-thumb.webp (generated)
│           ├── audiobook/*.mp3        # gitignored (regenerable, large)
│           └── audiobook-openai/*.mp3 # gitignored
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
