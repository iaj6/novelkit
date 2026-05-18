# CDK — Claude Drafting Kit

Autonomously draft a book from a single markdown brief, using the Claude Agent SDK.

## Quick start

```bash
npm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
npm run cdk -- init ./my-book --title "My Book"
# Edit my-book/brief.md
npm run cdk -- run ./my-book
```

## Pipeline

A book project has this layout:

```
my-book/
  brief.md            # input — the only thing you write
  cdk.config.json     # target length, chapter count, model
  canon/              # generated: world, characters, style, continuity, glossary
  outline/            # generated: per-chapter outlines
  draft/              # generated: per-chapter prose
  logs/
    continuity.md
    scene-log.md
    run.jsonl
```

The agent runs in four phases:

1. **Architect** — `brief.md` → `canon/*`
2. **Plotter** — `canon/*` → `outline/*`
3. **Drafter** — one invocation per chapter → `draft/*` (+ updates continuity & scene log)
4. **Editor** — focused passes (continuity, tone, prose tightening)

## Commands

```bash
cdk init <dir> [--title "..."]   # scaffold a new book project
cdk run <dir>                    # full pipeline, autonomous
cdk phase <name> <dir>           # run one phase only
cdk status <dir>                 # print pipeline state
```

Add `--max-chapters N`, `--model <id>`, `--dry-run` as needed.
