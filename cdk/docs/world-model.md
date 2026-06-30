# The epistemic world-model

Status: **M5.5 — epistemic layer live** (M1–M5 merged). This doc is the execution checklist for
replacing the append-only markdown world-state logs with a queryable, epistemic, event-sourced store.

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
| M4 | **Checkpoint integrity — DONE.** state v2 (per-key `entries` with artifacts+hashes+eventOffset; v1 auto-migrates; `completed` stays a string list so `cli` is untouched). The drafter VERIFIES a completed chapter on resume: artifact present + hash matches → skip; missing/truncated/changed → roll back its store events + re-draft (never trust `completed=good`). World-store coverage (and a draft-file hash change, the editor-rewrite case) is advisory only — never re-drafts a present, non-empty chapter. `--force` clears state + the world event stream (the append-only markdown logs are not reset). | A |
| M5 | **Audit augment — DONE.** `find_contradictions` (pure, `world/audit.ts`) runs in continuity-fact-audit ALONGSIDE the LLM re-read (authoritative), appending deterministic fact-conflict + dangling-supersedes findings; comparison-time value normalization (preserves discriminators); store instrumentation (clean-slot / off-vocab / unresolved-entity, logged). Off-vocab is REPORTED (`CANONICAL_ATTRIBUTES`); write-time vocab warn/reject deferred to M6. | A |
| M5.5 | **Epistemic layer live — DONE (capability).** `who_knows` now collapses to the LATEST stance per proposition (the deferred latest-wins fix); new pure `dramaticIrony` query (`world/epistemic.ts`) + `dramatic_irony` MCP tool surface the propositions the `@reader` knows/suspects that a character is unaware of (or wrong about), using each knower's latest stance so a character who catches up no longer shows a gap; an opt-in `epistemic` config flag gates the drafter's `record_knowledge` capture (off for linear books). **Population pilot** (`wf_c79a60c0-d5e`, 4 annotators over the real drafts + deterministic scoring): the **query is proven** (one annotator reproduces the president's-son gap live through the approach and closing exactly at the Ch14 reveal; clean negative control; 329/329 events schema-valid), but **capture is unreliable** — 1/4 produced the load-bearing irony as a queryable gap (failures: slug-splitting, unaware-party-not-pinned, reading-order). Verdict **augment-now, tighten-the-prompt**; 4 pilot-derived disciplines shipped in the drafter prompt, gated on an M6 re-probe. **Re-probe (`wf_7cea7ec1-5a2`): gate NOT met** — the load-bearing president's-son irony went 1/4 → **0/4** (the disciplines improved hygiene 82→58 events/book and the off-page-unaware technique, but "share one slug" made all four converge on the *public identity* rather than the *enrollment secret*). The finding: the machine nails the **bookkeeping**, not the **authorial judgment of which proposition the irony turns on**. Pivot → **seed-then-enforce** (M5.6). See [world-model-m5.5-pilot.md](world-model-m5.5-pilot.md). | B |
| **M5.6** | **Irony-ledger seed (the pilot's pivot).** The high-judgment act (naming each load-bearing irony's canonical proposition + who's-ahead / who's-behind / reveal-chapter) moves UP-FRONT to the architect/plotter (which already emits the chapter-map's irony beats) as a small per-book **irony ledger**. The drafter/audit then does the mechanical part it's proven good at: track those seeded propositions across the braid, pin the unaware parties, and enforce via `dramaticIrony` that each seeded gap stays live until its reveal and closes at it — flagging any chapter that violates the intended irony. Opt-in `epistemic` capture + the tightened disciplines remain as the *enforcement substrate*, not an autonomous oracle. | B |
| M6 | Store becomes authoritative; drafter checklist collapses; `close_chapter` → refuse-mode; vocab/resolve hard-reject. Cutting the re-read audit is **GATED on a re-probe** hitting detection≈1.0 ∧ clean-slot≈1.0 ∧ key-agreement≈1.0 (no 0-atomization members) ∧ relation/epistemic coverage. Epistemic capture does **NOT** go store-authoritative on autonomous population (M5.5 re-probe failed that gate, 0/4). Instead it is gated on the **M5.6 seed-then-enforce re-probe**: every architect-seeded irony queryable as a live→close arc across ~all annotators ∧ clean negative control. Belief/conviction asymmetry stays out of scope (who-knows ≠ who-believes-rightly). **Shipped as ROBUSTNESS CORE** (store-authoritative reads #31, drafter hygiene #32, resolve-first hard-reject #33); **cutting the re-read is deferred indefinitely** — the 3-run review showed the LLM re-read catches the real continuity errors the deterministic fact-audit can't. | A |
| **M7** | **Canonical-record layer (verbatim consistency) — the 3-run review's redirect.** Capture the EXACT TEXT of load-bearing documents (a log entry, a letter, a form) + the recurring scene's anchor facts; the drafter reads the canonical version BEFORE re-quoting/re-narrating; an EXACT-MATCH audit flags divergence. This is the deterministic audit's *sweet spot* (exact strings — no normalization ceiling, unlike fact-contradiction at 0/4 real on the m6 run). The fact-graph itself is effectively done (derived facts were flawless); the real errors live in this layer. Sketch below; see [three-run review] (`three-run-review-redirection` memory). | A |
| **M8** | **Time-indexed attributes (temporal contradiction semantics) — DONE.** The m7 run's only two deterministic "contradictions" were both false positives from an attribute that legitimately changes over narrative time (Hannah's `age` 17→18 across 9 years; Eira's `role` re-registering). Fix: classify attributes as INVARIANT vs TIME_VARYING (`audit.ts`), and make `findContradictions`/`findRelationConflicts` time-aware — a cross-chapter value change on a time-varying attr is SUCCESSION, not a contradiction; a clash flags only WITHIN one chapter. Invariants (birth_year, origin, dates, recorded measurements) keep full pre-M8 strength. **Posture: SAFE / same-chapter only** — the monotonic one-way checks (age never decreases, the dead don't revive) are deferred because they assume manuscript order == chronology and would FP on non-linear narratives. Mechanical, not agent-judgment-dependent (does NOT lean on the drafter to `supersedes` — the seed-then-enforce lesson). See [world-model-m8-time-indexed.md](world-model-m8-time-indexed.md). | A |
| M9 | Cleanup: drop shadow-diffing, document, backfill importer on `cdk run`. | — |

**Cut from v1** (gold-plating): `@narrator` tracking, a separate `foreshadow_ledger` tool, the
user-facing `cdk rollback` CLI (keep the internal retract mechanism), 4 of 6 exporters, numeric
`storyTimeOrdinal`, the structured-supersession repair variant.

## M7 — Canonical records (sketch): the 3-run review's redirect

An independent literary review of three coldwater-reach runs (baseline / v031 / m6 — see the
`three-run-review-redirection` memory) found m6 the **best-written** (won both head-to-heads, sharpest
voice separation, best architecture) but **NOT the continuity champion it was built to be**: on verified
evidence v031 (un-hardened) was cleaner, and m6's confirmed errors cluster in the record-layer M6 hardened.

The diagnosis: **the fact-graph hardened the layer that already worked.** m6's *derived* facts were
flawless across 30 chapters (elapsed-time arithmetic, postmark/dinghy locks, the POW farm-clock). The real
errors live in three layers the fact-graph never touches.

**Why this is the next target — the deterministic audit's sweet spot.** Fact-contradiction detection hit
the M3.5 normalization ceiling (0/4 real on the m6 run — fuzzy values don't compare). **Verbatim text is an
exact string match**: no normalization, no FP ceiling, no judgment. Point the deterministic audit at
verbatim records and it finally does what it's good at.

**The three gaps M7 addresses** (general pattern first; the coldwater-reach m6 run is the evidence, not
shared context — a future builder needs the pattern, not the book):
1. **Verbatim documents** — when a fixed document (a log entry, a letter, a form) is quoted in the prose
   and then re-quoted in a later chapter, the re-quote drifts: different details each time. The store locks
   the atomized *facts* but never the document's *exact text*. *(m6 evidence: a harbor-log entry was quoted
   two different ways — every timestamp and the weather differed.)*
2. **Capture-completeness on load-bearing anchors** — the drafter atomizes the easy/obvious facts but
   misses the central recurring ones the whole book returns to, so the single most load-bearing fact is the
   one most likely to drift. **Capture is biased toward easy facts, not load-bearing ones.** *(m6 evidence:
   a trivial character age was captured; the crime-night date — referenced in five chapters — was not, and
   it flip-flopped.)*
3. **Re-narrated scenes** — the most-returned-to scene gets re-improvised from scratch each time instead of
   re-read, so its details diverge. *(m6 evidence: all three runs broke their single most-repeated scene
   this way — a pipeline failure mode, not one book's quirk.)*

**Design (sketch):**
- **Artifact — `record`**: a registered load-bearing verbatim text with a stable id + the EXACT string
  (a log entry, a letter, a form). Distinct from `fact` (normalized/atomized) — a record is byte-exact.
  New event (`record.upsert`) or an entity carrying a `verbatim` field.
- **Capture — `register_record(id, label, text)`**: the drafter registers a document's canonical text the
  chapter it first writes it. The architect can pre-seed the obvious ones (the harbor log) to fight the
  same easy-vs-load-bearing capture bias seen with facts.
- **Read-before-re-quote — `read_record(id)`** + a drafter discipline: before re-quoting/re-narrating a
  registered record in a later chapter, READ it and reproduce verbatim. (Same move fixes the re-improvised
  scene: re-read the anchor before re-narrating.)
- **Exact-match audit**: flag any chapter that references a registered record but does not reproduce its
  canonical text. The COMPARE is exact (no FP ceiling); only LOCATING the quotation in prose is fuzzy.
- **Capture-completeness nudge**: push the drafter to atomize the recurring load-bearing facts (the central
  date), not just the cheap ones.

**Open questions / risks (resolve during build):**
- **Locating a quotation in prose** is the audit's hard part: (a) exact-substring search per chapter
  (simple, brittle to embedding/line-breaks), (b) drafter re-registers each quotation + diff
  (capture-reliant), (c) LLM-assisted locate-then-diff (robust backstop). Likely (a)+discipline first,
  (c) as the net.
- **Under-registration** (same bias as fact capture) — mitigate with architect pre-seeding.
- **Always-on vs opt-in** — verbatim records help any book with quoted documents; lean always-on.

**Adjacent re-frames (separate milestones, NOT M7):**
- **Epistemic → knowledge-anachronism audit** (re-purpose M5.5/M5.6): a deterministic "acts on info before
  acquiring it" check over recorded knowledge + discourse order. The review found 2 real ones (Marcus
  knowing the photograph / the dinghy date early). Reframe the `epistemic` flag from dramatic-irony (too
  judgment-heavy) to knowledge-continuity.
- **Prose-calibration axis (NOT robustness):** the consistent 80k→66k shortfall (plotter plans ~2,500/ch,
  drafter writes ~2,190), the under-written adolescent register (Hannah), the withholding-tic vocabulary
  now a pipeline mannerism. A drafter/calibration concern, tracked separately.

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
