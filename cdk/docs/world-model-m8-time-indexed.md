# M8 — Time-indexed attributes (temporal contradiction semantics)

*Status: DONE. Closes the false-positive class the M7 coldwater run surfaced.*

## The problem (from the m7 run)

The deterministic contradiction audit fired exactly twice on the m7 validation book, and **both were
false positives** — each from an attribute that legitimately changes over narrative time:

- `hannah-pfeiffer.age`: `17` vs `18`. The story spans ~9 years (1935→1945); Hannah aging 17→18 is
  *correct*. The store held `age` as a single live value with no time index, so two values that are
  each true at a different narrative moment read as a contradiction.
- `eira-bowman.role`: "Harbormaster… since November 1935" vs "harbormaster" — a role re-registering
  (also registration drift, but the temporal axis is the part M8 owns).

The relation audit (`findRelationConflicts`) had the **same gap, already documented in its comments**: a
character who legitimately relocates registers two live positive `located_in` and trips the check.

Root cause: `findContradictions` grouped live facts by `(entity, attribute)` and flagged ≥2 distinct
values **with no notion of time**, even though every fact already carries `provenance.chapter`.

## The fix

The store doesn't need a new "narrative time" model — **the chapter is already the clock.** What was
missing is knowing *which attributes are allowed to change.*

1. **Classify attributes** (`audit.ts: TIME_VARYING_ATTRIBUTES`). An attribute is either
   - **INVARIANT** — never legitimately changes; a clash is a real continuity bug. Full pre-M8
     strength: any ≥2 distinct live values flag. (birth_year, origin_place, native_language, an
     event/document date, recorded measurements, the place-fact `located_in`, …)
   - **TIME_VARYING** — `{age, role, marital_status, alive}`. May hold different values in different
     chapters.

   Classified by attribute **name** (semantics travel with the key). Default is INVARIANT, so the
   relaxation is **surgical** — only attributes we reasoned about lose strictness; no silent recall
   regression on the off-vocab tail — and the set grows from real demand like the canonical vocab.

2. **Time-aware comparison.**
   - **Facts** (`findContradictions`): a TIME_VARYING group clashes only when ≥2 distinct values land
     in **one chapter** (`sameChapterClash`). Across chapters = succession, no flag. *(With the
     per-chapter fact id `fact:chapter:entity:attribute`, a same-chapter re-assert overwrites, so for
     drafter facts this is the FP-0 floor; it stays correct if same-chapter distinct values ever
     arrive from a non-overwriting source, e.g. a backfill importer.)*
   - **Relations** (`findRelationConflicts`): all functional spatial slots are time-varying, so the
     conflict is evaluated **per chapter** — a cross-chapter relocation no longer flags; only a
     within-chapter multi-place (or present+absent) slot does. The relation id `rel:chapter:from:
     relType:to` carries `to`, so same-chapter clashes are genuinely representable (real teeth).

## Posture: SAFE / same-chapter only

The maintainer chose the conservative option. The stronger **monotonic** checks a fuller model would
add — `age` non-decreasing in chapter order, `alive` one-way (no resurrection) — are **deliberately
NOT done**, because they assume *manuscript order == chronology* and would false-positive on a
non-linear (flashback) narrative. FP-0 is the prime directive: an augment may MISS, it must not
false-positive. The recall we consciously give up: a time-varying attribute that *ping-pongs* across
chapters (a genuine age 40→17→40 error) won't flag. That's the accepted price.

## Why mechanical, not a prompt change

It would have been tempting to "fix" this by leaning on the drafter to pass `supersedes` whenever it
changes an established value. We did **not**, because the seed-then-enforce finding (M5.5) showed
agents reliably do bookkeeping but **not** the judgment of which change matters — and "am I changing
or contradicting?" is exactly that judgment. The fix lives in the deterministic audit, where it can't
regress on agent discretion. `supersedes` remains available and is still the tidier record (it keeps
the live set minimal), but the audit no longer **depends** on it for time-varying attributes.

## Naming note

The original roadmap table used "M8" for a low-priority *cleanup* milestone (drop shadow-diffing,
backfill importer). The audit comments, the m7 findings, and the team's usage had already attached
"M8" to **this** time-indexing work, so it takes the M8 slot; the cleanup moved to **M9**.

## Changed files

- `cdk/src/world/audit.ts` — `TIME_VARYING_ATTRIBUTES`, `sameChapterClash`, time-aware
  `findContradictions` + per-chapter `findRelationConflicts`.
- `cdk/tests/audit.test.ts` — generic-mechanism tests migrated to invariant stand-ins
  (`birth_year`/`native_language`/`fictional`); a dedicated M8 block (cross-chapter succession does
  not flag; invariants still flag; same-chapter clash still flags) + relation relocation tests.
- `cdk/docs/world-model.md` — M8 row rewritten; cleanup → M9.

## Validation status

Unit-level: 261 tests pass, typecheck clean. **Not yet validated on a live run** — the next coldwater
(or other long-form) run is the real test: the two m7 false positives should not recur, and no new
contradiction class should be silently suppressed. That run is the M8 sign-off.
