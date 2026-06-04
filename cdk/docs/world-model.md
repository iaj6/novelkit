# The epistemic world-model

Status: **M1 in progress** (substrate). This doc is the execution checklist for replacing
the append-only markdown world-state logs with a queryable, epistemic, event-sourced store.

## Why

Two mandates, one mechanism:

- **(A) Robustness over 24h+ runs** — kill cross-chapter drift; make the continuity audit a
  consistency *check* instead of "re-read everything and hope"; give resume a verified source of
  truth; bound the unbounded growth of re-read prose logs.
- **(B) Machine-native creative unlock** — an **epistemic layer** (who knows/believes/suspects what,
  as of which chapter, incl. the `@reader`) makes dramatic irony, foreshadow/payoff, unreliable
  narration, and braided-POV reveal-order *queryable and auditable*. A prose log cannot represent
  this; it's the "only an agent pipeline could do it" payoff.

## Shape

- **Store**: append-only JSONL event log at `library/<book>/logs/world/events.jsonl`.
- **Projector**: a *pure* function `events[] → tables` (entities, facts, relations, knowledge,
  chapters). Replaying the same events yields byte-identical tables — the basis for resume
  fingerprints and tests. Supersession/retraction resolve on read; the log is never rewritten.
- **Tools** (M3+): the agent reads/writes only through schema-validated MCP tools; it never touches
  raw JSONL. Path access stays behind the shared `resolveInProject` jail.
- **Markdown views**: the legacy logs become *exported views* (M2), so `press/` and `site/` need
  zero changes. Storage = JSONL (zero new deps; git-diffable; SQLite rejected).

## Locked decisions

- Two-axis timeline (story-time vs. reading-order) + anachronism detection: **opt-in per brief**.
  `discourseIndex` is always mechanical (the `NN-` filename prefix); `storyTime*` only set when a
  brief declares itself non-linear.
- Epistemic layer: **early parallel pilot** on one braided/ironic book (`the-contingency`) before it
  becomes a standard drafter obligation — it's the unproven bet (could be empty/noisy if the drafter
  under-populates it).
- New deterministic audit (`find_contradictions`): **augment, never regress** — runs alongside the
  existing re-read audit; the re-read retires only after it provably catches a superset. It's a
  floor (only catches contradictions that atomize into clean `entity.attribute=value` slots), not a
  ceiling.
- `events.jsonl` is git-committed (like `run.jsonl`); keep the cheap human-readable views
  post-cutover for debugging.

## Milestones

| # | Milestone | Mandate |
|---|---|---|
| **M1** | Store substrate: `schema.ts` + `store.ts` + `project.ts` + determinism tests. **Zero pipeline change.** | foundation |
| M2 | Exporters (`renderCanonContinuity` = load-bearing for press) + legacy importer + press-parity test. | foundation |
| M3 | Dual-write **shadow**: additive structured tools + `open_chapter`/`close_chapter` frame in **warn-mode**; legacy logs authoritative; divergence logged. + chaos/resume kill-test. | A |
| M3.5 | **Atomization probe — DONE** (run `wf_8aa3a4ee-410`): decision **augment-now-reassess-later**; canonical-form rules locked + resolve-first canonicalization shipped. See [world-model-m3.5-probe.md](world-model-m3.5-probe.md). | de-risk |
| M4 | Checkpoint integrity: state v2 (eventOffset/artifacts/hashes), `verify_chapter` event-coverage on resume, internal retract self-heal. | A |
| M5 | Audit **augment** (per M3.5 verdict): `find_contradictions` ships as a PARALLEL deterministic pass (precision 1.0 / FP 0); the re-read stays authoritative. Also lands vocab warn-on-off-vocab, comparison-time value normalization, and live-run instrumentation (clean-slot / off-vocab / unresolved-entity counts). | A |
| M5.5 | **Epistemic pilot** on `the-contingency`: `learn()` + `who_knows` + `dramatic_irony`; prove the irony lands. (Also fix the deferred `who_knows` latest-wins collapse — see the marker in `session.ts`.) | B |
| M6 | Store becomes authoritative; drafter checklist collapses; `close_chapter` → refuse-mode; vocab/resolve hard-reject. Cutting the re-read audit is **GATED on a re-probe** hitting detection≈1.0 ∧ clean-slot≈1.0 ∧ key-agreement≈1.0 (no 0-atomization members) ∧ relation/epistemic coverage. | A |
| M7 | Generalize the epistemic layer — only if the pilot proved out. | B |
| M8 | Cleanup: drop shadow-diffing, document, backfill importer on `cdk run`. | — |

**Cut from v1** (gold-plating): `@narrator` tracking, a separate `foreshadow_ledger` tool, the
user-facing `cdk rollback` CLI (keep the internal retract mechanism), 4 of 6 exporters, numeric
`storyTimeOrdinal`, the structured-supersession repair variant.

## Canonical-form rules (locked by M3.5)

The atomization probe (`wf_8aa3a4ee-410`; full report in [world-model-m3.5-probe.md](world-model-m3.5-probe.md))
found `find_contradictions` is precision-perfect (FP 0) but recall-incomplete (85% clean-slot, 75%
detection, 83% cross-agent key agreement with a 60% tail and one non-atomizing fact). Hence the M5/M6 gate
above. To drive recall toward parity, these rules are locked:

1. **Resolve-first entity ids** — `assert_fact`/`record_relation`/`record_knowledge` take a *resolved*
   entity id; the session canonicalizes a known name/alias to its id. **Shipped (warn-mode) in M3.5**;
   hard-reject at M6. *(The #1 key-agreement lever — collapses "Eira"/"Eira Bowman"/"eira-bowman".)*
2. **Per-kind suggested attribute vocabulary** — canonical keys per `EntityKind` (character `age`,
   `birth_year`, `role`, `origin_place`, `native_language`, `alive`; place `located_in`, `fictional`,
   `construction`; event `date`, `location`), `other` escape hatch logged. Suggested in the prompt now;
   **warn-on-off-vocab in M5**, hard-reject at M6.
3. **One fact per `assert_fact`** — decompose compound prose. Prompt rule now.
4. **Hedged/disjunctive facts still atomize** with `confidence: provisional|inferred` (not free-text).
   Prompt rule now; the audit grades provisional-vs-established as "high" not "critical".
5. **Comparison-time value normalization** (numbers→value+unit, dates→canonical tokens, booleans→polarity)
   that PRESERVES the discriminating component — lands in M5's `find_contradictions`, NOT as aggressive
   write-time lowercasing (display fidelity). 

**Re-probe before any M6 cut**: re-run the probe; only detection≈1.0 ∧ clean-slot≈1.0 ∧ key-agreement≈1.0
(no 0-atomization members) unlocks retiring the re-read audit. The reassess is a re-run, not a vibe.

## M1 contents (this PR)

- `cdk/src/world/schema.ts` — zod event vocabulary (entity/fact/relation/knowledge/chapter
  open+close/retract) + write-time invariants (numeric facts require a unit). Every event carries a
  `v` schema-version (the upgrade-on-read hinge — can't be backfilled onto committed logs later);
  proposition unions are `.strict()` so a both-keys object can't silently drop a key into the log.
- `cdk/src/world/store.ts` — append-one-event-per-line writer through `resolveInProject`; a reader
  that tolerates a torn final line (chaos resilience).
- `cdk/src/world/project.ts` — the pure deterministic projector + live-fact helpers. Returned records
  are immutable snapshots (carried-through containers are copied, so mutating a projection can't
  corrupt replay); `tablesToJSON` sorts by UTF-16 codepoint (NOT `localeCompare`) so replay is
  byte-identical across machines/locales.
- `cdk/src/paths.ts` — `resolveInProject` moved here (SDK-free) so the store shares the jail;
  re-exported from `tools.ts` for existing callers.
- `cdk/tests/world.test.ts` — schema, store/parse (incl. torn-line), and projector
  (supersession, retraction, epistemic, determinism, prefix-replay) tests.

Nothing in the running pipeline references the store yet — M1 is substrate only.

Full design analysis: workflow run `wf_4f7bfdec-abb`.
