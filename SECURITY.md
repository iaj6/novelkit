# Security

NovelKit is a personal showcase repository, not a production project. It runs locally and ships a static site to GitHub Pages. There is no server, no database, no user data, no authentication.

## Reporting a vulnerability

If you find something that looks like a security issue — accidentally committed credentials, a way that the build process could be tricked into exfiltrating local files, anything along those lines — please open a [private security advisory](https://github.com/iaj6/novelkit/security/advisories/new) rather than a public issue.

For everything else (bugs, design questions, etc.), regular [issues](https://github.com/iaj6/novelkit/issues) are fine.

## What this repo handles

- **API keys** (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `GOOGLE_GEMINI_API_KEY`) are read from a local `.env` file. The `.env` file is gitignored and `.env.example` is the only env file tracked.
- **Generated content** in `library/<slug>/` is committed as showcase output. No personal data, no PII.
- **Deployed artifacts** under `site/public/books/` are book covers, EPUBs, PDFs, and HTML — public by design. Audio is excluded by gitignore.

## What this repo does NOT do

- No code in this repository transmits anything except to the APIs you explicitly invoke (Anthropic, OpenAI, ElevenLabs).
- No analytics, no tracking pixels, no third-party scripts on the deployed site.
- No user authentication; the deployed site is purely static HTML.

## Dependencies

Dependabot monitors npm packages in `cdk/` and `site/`, plus GitHub Actions used by the deploy workflow. Security updates are auto-applied; routine version bumps come as weekly PRs.
