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
cdk coldread <dir> [--force]        independent brief-blind review panel over the finished
             [--lens=a,b]           manuscript; writes logs/cold-read/. Resumes by default.
cdk revise <dir> [--apply]          plan a revision from findings + cold-read into
                 [--approve-all]    logs/revision-plan.json; --apply executes approved items
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

## Cold read — independent evaluation

`cdk coldread` is an evaluation, not a pipeline phase, and is deliberately outside `cdk run`.

Every reviewing stage inside the pipeline reads `brief.md` first, so it grades *conformance to
intent*. The reader phase also works act-by-act and synthesizes from its own summaries, so nothing
in `cdk run` ever holds the whole manuscript at once. A cold read closes both gaps: a panel of
independent lenses reads the finished book — `draft/`, with `revision-1/` overriding per chapter —
and nothing else.

Blindness is enforced in code, not requested in a prompt: cold-read agents get a read-allowlist of
`draft/` and `revision-1/`, so `brief.md`, `canon/`, `outline/` and prior reviews are unreachable.
The same guard makes lens isolation structural — with `logs/` unreadable, no lens can see another's
report.

Stages: **lenses** (one agent each, independent) → **verification** (deterministic TypeScript, not
an agent — classifies every quote as exact / near / misattributed / absent against the manuscript)
→ **synthesis** (reports only) → **panel audit** (audits the *reviewers*, and gets the manuscript so
it can check their claims rather than trust them).

Outputs land in `logs/cold-read/`; `logs/findings.json` is never touched, so the pipeline's
self-assessment and the independent check stay separable.

`verification.json` carries a `panel_health` block of **book-independent** metrics — score spread,
fabrication rate, claim volume, and warnings such as a suspiciously narrow score band. These exist
so a run can be judged as a *harness* run: "did it rediscover the defects I already know about in
this manuscript" measures the book and does not transfer to the next one.

The default roster is seven lenses (`literary`, `airport`, `propulsion`, `authenticity`,
`comparative`, `verisimilitude`, `ordinary`), overridable per book via `coldRead.lenses` in
`cdk.config.json` or `--lens`. Lenses derive their frame from the book rather than presuming a
genre — `propulsion` asks what supplies this book's forward pull before judging whether it works,
and `verisimilitude` works out what the book claims fidelity to (a period, a place, a profession, or
in an invented world only its own rules) before checking it.

## Revision — the pipeline's one destructive phase

`cdk revise` is what closes the gap between a first draft and a book. The four editor passes work
line by line; nothing else acts on a developmental finding that needs judgment — compressing a
chapter, cashing a planted setup, reconciling a fact that drifted across a dozen chapters.

It runs in two steps with a human between them:

```
cdk revise <dir>            # propose  → logs/revision-plan.json (every item approved:false)
cdk revise <dir> --apply    # execute  → only items you set to approved:true
```

Every plan item must cite the findings it answers (`source_findings` is required and non-empty), so
revision is always traceable to a diagnosis rather than an agent rewriting prose it disliked. Items
declare a **blast radius**; an edit outside it aborts the whole run, because the radius is what you
approved. Two classes exist — `in-chapter` and `cross-chapter-fact` — and structural cut/merge/reorder
deliberately does not, since the world store keys facts and records to chapter ids.

**Every item is transactional.** Before it runs, the affected chapters are snapshotted; afterwards
these are checked *in code*:

- **Protected passages survive.** Items carry verbatim quotes that must still be present. This is the
  guard that matters: on a live run it preserved a legitimate `Strada Crișan` reference sitting in the
  same paragraph as one being corrected, where a blanket rename would have destroyed the book's
  address chain. Passages are verified against the manuscript at *plan* time too — a paraphrased quote
  makes the guard vacuous, and a vacuous guard is worse than none because it reports as a pass.
- **Brief invariants hold** (see below), judged against a per-item baseline so an item is never rolled
  back for a violation it inherited — books that already break their contract are exactly the ones
  needing revision.

Any failure rolls the item back to its exact pre-state, including deleting a `revision-1/` file that
did not exist before. Applied items are recorded in state, so re-running after editing the plan does
not revise an already-revised chapter on top of itself.

## Invariants

`cdk.config.json` may declare a book's structural contract:

```json
"invariants": { "minWordsPerChapter": 1900, "minTotalWords": 62000 }
```

These are re-checked after revision and reported at the end of `cdk run`. They exist because nothing
used to verify the brief's contract after a later phase mutated the text: on one book the drafter
honoured a stated 1,900-word floor in all thirty chapters and the compression pass then pushed three
under it, silently, because no code knew the floor existed. Invariants are **declared, not inferred** —
an inferred floor would be as unreliable as the drift it guards against. Omit the block for no constraint.

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
npm test                # vitest — 272 tests
npm run typecheck       # tsc --noEmit
npm run test:coverage   # >80% on ansi, runlog, estimate, state
```
