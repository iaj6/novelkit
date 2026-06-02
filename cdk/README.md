# CDK — the drafter

The Claude Drafting Kit. Turns a single human-written `brief.md` into a full
book — canon, outline, per-chapter prose, editorial passes, and a developmental
read — by orchestrating a sequence of Claude Agent SDK phases. Everything after
the brief is agent-produced.

Each book is its own self-contained CDK project under `library/<book>/`; CDK
reads and writes only inside that directory.

## Install

```bash
cd cdk
npm install
```

Requires Node ≥22 and `ANTHROPIC_API_KEY` in the repo-root `.env` (see
`../.env.example`).

## Commands

Run via `npm run cdk -- <command>` (or the `cdk` bin once linked):

```
cdk init <dir> [--title "..."]      scaffold a new book project from the template
cdk run <dir> [--force]             run the full pipeline; resumes from logs/.cdk-state.json
                                    by default, --force clears state for a clean run
cdk resume <dir>                    alias for `cdk run`
cdk review <dir>                    re-run only the Reader phase on an existing manuscript
cdk repair <dir> [--severity=<lvl>] apply repair agents to logs/findings.json
                                    (default severity=critical)
cdk phase <name> <dir>              run a single phase, ignoring state
cdk status <dir>                    show output files, completed-task state, cost so far
cdk publish <dir>                   set visibility=public  (book appears on the site)
cdk unpublish <dir>                 set visibility=private (default; hidden from the site)
```

`cdk run` is resumable: each completed phase/chapter is recorded in
`logs/.cdk-state.json`, so a re-run skips finished work. Use `--force` to start over.

## Pipeline phases

`cdk run` iterates these in order:

1. **researcher** — *opt-in.* Prepended only when `brief.md` has a `## Research scope`
   section or `cdk.config.json` sets `"research": true`. Produces `canon/research.md`
   from primary sources (uses the SDK's WebSearch/WebFetch, capped per run).
2. **architect** — builds world / characters / themes canon from the brief.
3. **plotter** — per-chapter outline.
4. **threads** — tracks the narrative threads to be woven and paid off.
5. **calibrate-drafter** — drafts a short sample of chapter 1, grades it against the
   brief's audience/exemplars, and tunes `canon/agent-guidance/drafter.md` before the
   real draft begins. Capped iterations; always proceeds eventually.
6. **drafter** — writes each chapter's prose, capturing per-chapter craft/continuity facets.
7. **editor** — runs four sub-passes in sequence: continuity, compression, pacing, voice.
8. **reader** — a developmental read of the whole manuscript; emits prose notes plus
   structured `logs/findings.json`.
9. **continuity-fact-audit** — cross-chapter fact check against the continuity log.

`repair-fact-normalize` is opt-in via `cdk repair` — it applies auto-repair-safe
continuity-fact findings into `revision-1/` without mutating the original drafts.

## Configuration

`cdk.config.json` in each book directory:

| field | meaning |
|---|---|
| `title` | book title |
| `model` | default Claude model for all phases |
| `visibility` | `"private"` (default) or `"public"` — gates the deployed site |
| `research` | `true` to force the researcher phase |
| `calibration` | `{ "enabled": bool, "max_iterations": number }` |
| `modelByPhase` | per-phase model overrides, e.g. `{ "reader": "claude-opus-4-8" }` |
| `maxTurnsPerPhase` | per-phase turn caps (sensible defaults built in) |

Anything other than the literal `"public"` is treated as private — a fail-safe
default for the publish gate.

## Agent sandbox

Phases talk to the model through a small MCP tool surface (file read/write/append,
scene/continuity/glossary/craft logs, findings) — no shell. Every path is jailed to
the book directory via `resolveInProject`. Filesystem settings are not loaded
(`settingSources: []`), so a run is hermetic and does not inherit machine-global hooks.

## Tests

```bash
npm test                # vitest — 106 tests
npm run typecheck       # tsc --noEmit
npm run test:coverage   # >80% on ansi, runlog, estimate, state
```
