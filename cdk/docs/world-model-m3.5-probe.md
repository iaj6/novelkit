# M3.5 — atomization probe

**Question.** Can the deterministic `find_contradictions` audit (M5) be trusted to **replace** the
LLM re-read continuity audit, or only **augment** it? It depends on whether the drafter reliably turns
real compound continuity prose into clean, *comparable* `entity.attribute = value` facts — if two
drafter invocations key the same real-world fact differently, a genuine cross-chapter contradiction never
shares a key and is silently missed.

**Method.** 5 independent atomizer agents (a proxy for cross-chapter drafter variance over a long run),
each given the real `assert_fact` contract + drafter guidance, atomized 20 real `library/coldwater-reach`
continuity facts (compound → hedged) plus 7 curated pairs (contradiction / restatement / distinct /
hedged-hard). Measurement is deterministic (string comparison of keys/values). Reproducible: workflow run
`wf_8aa3a4ee-410`.

## Results

| metric | value | meaning |
|---|---|---|
| clean-slot rate | **85%** (0 variance) | 15% of the real ledger does **not** reduce to `entity.attribute=value` — it falls to free-text the comparator is blind to. A hard recall floor. |
| contradiction detection | **75%** | 1 in 4 seeded hard contradictions missed even among atomized facts. |
| restatement false-positive | **0%** | precision is perfect — when it fires, it's right. |
| restatement-correct / distinct-correct | **100% / 100%** | no noise; equivalent phrasings and different attributes are handled. |
| cross-agent key agreement | **83% mean** | **the load-bearing number.** Tail: p4 (breakwater length) 80%, p5 (body date) **60%** — different agents chose different keys for the *same* fact (`distinctKeys:2`). p7.a (hedged "identity never confirmed") **0% — not atomized by one agent at all.** |

True recall against real cross-chapter contradictions ≈ detection × clean-slot × key-collision — **materially below 0.75**, and far below a re-read superset.

## Decision (gates M5/M6)

**`augment-now-reassess-later`.**

- **M5 ships `find_contradictions` as a PARALLEL deterministic augment** alongside the re-read audit. Precision 1.0 / FP 0 makes this strictly safe: it catches cheap exact-key contradictions instantly and noise-free; the re-read stays **authoritative**.
- **M6 may cut the re-read ONLY after a pre-registered RE-PROBE** shows: detection ≈ 1.0 **AND** clean-slot ≈ 1.0 **AND** cross-agent key agreement ≈ 1.0 with **no 0-atomization members** — *and* the deterministic audit covers relation + epistemic contradictions (currently out of frame). The reassess is a re-run of this probe, not a judgement call.

This honors the locked doctrine (augment, never regress; re-read retires only on proven superset). Replacing on these numbers would convert every key-disagreement and every free-text fact into a silent undetected contradiction over a 24h run — the exact mandate-(A) regression we forbid.

## Canonical-form rules (locked by M3.5)

To drive key agreement → 1.0 and clean-slot → 1.0 before the re-probe:

1. **Resolve-first entity ids** — `assert_fact` takes a *resolved* entity id (from `resolve_entity` / `upsert_entity`), never a free-typed name. Kills the dominant key-disagreement source ("Eira" vs "Eira Bowman" vs "eira-bowman"). *Implemented in M3.5 (warn-mode canonicalization); hard-reject at M6.*
2. **Per-kind suggested attribute vocabulary** — a canonical key list per `EntityKind` (character: `age`, `birth_year`, `role`, `origin_place`, `native_language`, `alive`; place: `located_between`, `fictional`, `construction`; event: `date`, `location`), with an `other` escape hatch that's logged. *Suggested in the prompt now; warn-on-off-vocab at M5.* Ship it suggested, not hard-reject, or a missing key pushes facts back into free-text.
3. **Value normalization at comparison time** — numbers → value+unit (already enforced); dates → canonical tokens; booleans → polarity, not free-text "dead"/"alive". *Comparison-time in M5's `find_contradictions`, preserving the discriminating component (season, the number) so normalization never manufactures a false negative — NOT aggressive write-time lowercasing (display fidelity).*
4. **Hedge/disjunction still atomizes** — "approximately 1891", "1935 or 1936" must still hit the canonical key with `confidence: provisional/inferred` and a normalized value/range token, NOT fall to free-text. The confidence tier lets the audit grade provisional-vs-established as "high" rather than dropping it. *Prompt rule now; the schema already carries `confidence`.*
5. **One fact per `assert_fact`** — decompose a compound sentence (fact 1 = age + as-of-date + birth_year) into one assertion per `(entity, attribute)`. The compound single-assert is the other path into free-text and the reason clean-slot caps at 0.85. *Prompt rule now.*

## Risks (carried forward)

- **Precision is noise, not coverage.** FP=0 is seductive but the contradictions that matter most never share a key, so true recall is below the headline 0.75. Precision must not drive a replace decision.
- **0.83 is an optimistic ceiling.** 5 fresh agents on one corpus have *less* entity-surface variance than a real 30-chapter multi-day drafter population — production agreement is likely lower.
- **Don't over-tighten / over-normalize.** Hard-reject vocab or aggressive value collapse re-creates free-text loss / manufactures false negatives. Suggest+warn; normalize at comparison preserving discriminators.
- **Relations + epistemic states are out of frame.** `find_contradictions` only compares `fact entity.attribute=value`. Relation flips and stance contradictions are uncovered — another reason the re-read stays until coverage (not just fact-precision) dominates.

## What M3.5 ships

- This report.
- `world-model.md`: the gate decision + re-probe thresholds + the canonical-form rules.
- Code: **resolve-first entity canonicalization** in `WorldSession` (warn-mode) — the #1 key-agreement lever — applied to `assert_fact` / `record_relation` / `record_knowledge`, with tests.
- Prompt/tool guidance: resolve-first, one-fact-per-assert, suggested attribute vocabulary, hedge-still-atomizes.

Deferred to M5 (with the audit that consumes them): vocab warn-on-off-vocab, comparison-time value normalization, and the live-run instrumentation (emit clean-slot / off-vocab / unresolved-entity counts) that turns the next re-probe into production evidence.
