# Site

The reading room for the NovelKit library. A static site (Astro) that indexes the books in `../library/` and the artifacts the press produces alongside them.

**Status**: Empty scaffold. No actual storefront yet — that's the next layer of work.

## Quick start

```bash
cd site
npm install      # first time only
npm run dev      # serves at http://localhost:4321
npm run build    # builds to dist/
npm run preview  # preview the built site
```

## Layout (planned)

```
site/
├── public/               # static assets, favicon, etc.
├── src/
│   ├── pages/            # routes (Astro reads .astro and .md here)
│   ├── components/       # reusable pieces
│   ├── layouts/          # page templates
│   └── content/          # content collections (per-book metadata)
├── astro.config.mjs
└── package.json
```

## What it will read from `../library/`

For each book:
- `cdk.config.json` — title and metadata
- `brief.md` — the author's original input
- `canon/*.md` — pitch, world, characters, themes, threads, etc.
- `manuscript.md` — concatenated chapters (produced by `press/concat_chapters.sh`)
- `build/` — HTML/EPUB/PDF/cover/audio artifacts (produced by `press/`)

## Framework

Astro 6, TypeScript strict. Chosen because:
- Reads markdown directly (no MD-to-data conversion step)
- Generates static HTML (cheap to host on GitHub Pages, Netlify, etc.)
- Content collections give us typed access to per-book metadata
- Minimal client JS by default; ships less than 50KB on first load
