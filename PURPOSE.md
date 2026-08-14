# What novelkit is for

**Status: draft, 2026-08-14. Written to be argued with.** Every factual claim below comes from the
project audit at `HEAD 6fd1a41`; every *recommendation* is marked as such. Nothing here is settled
until you edit it.

---

## The question that has never been answered

The project has been run as two different things at once, and the tension shows up in the numbers:

| Behaving like a **research instrument** | Behaving like a **press** |
|---|---|
| $344.79 (38.5% of all spend) re-running one brief six times | 11 published editions, 407,929 words live |
| $524.62 of spend on books never published | Covers, epubs, PDFs, a static reading room |
| Milestone arcs (M1–M9) aimed at capability, not output | `publish` / `unpublish` commands, colophons |

Neither is wrong. But nothing has ever declared which one wins when they conflict, and the symptom
is visible on the shelf right now: **the two runs that exercise the most machinery are private with
no build, while a 3-chapter toy is public with a full cover/epub/PDF/audiobook set.** That is not an
oversight. It is what happens when a project has no stated purpose to arbitrate.

**Every accretion in this codebase traces back to this gap.** With no purpose to judge against, every
gap looks worth filling — which is how you get 19 phases, 25 tools, 3.4× cost growth, and not one
deletion in fifteen months.

---

## What the evidence says it is actually good at

Not aspiration — measured, and where possible confirmed by reviewers who could not see the brief.

- **Sustained, distinct POV voice.** First item in "What's Working" in 12 of 15 reader letters *and*
  independently confirmed by both blind panels. The only strength verified by an apparatus that was
  structurally unable to flatter it.
- **Range.** 14 distinct stories from one unchanged pipeline: 1814 naval, WWII homefront, Antarctic
  SF, dungeon crawl, 1920s probate, YA fantasy, Ceaușescu-era Romania.
- **Finishing.** 16 retries in 1,873 calls, 2 max-turns failures ever, resumable across a crash.
- **Documentary fidelity when a brief is built around it.** 16 registered records, 16 verbatim-faithful.

And what it is reliably bad at: over-articulation (15/15 letters, never moved), under-writing its own
target (8/12 books), midbook sag, and judging its own output.

---

## Proposed purpose *(recommendation — argue with this line first)*

> **novelkit is a press that produces finished, register-disciplined novels across many genres, and
> proves what it produced is worth reading before it ships.**

Three commitments follow from that sentence, and each one kills something:

1. **Press, not laboratory.** A run exists to produce a book that ships. Capability experiments are
   permitted only when they are *paid for by a book that ships*. → Kills the re-run line.
2. **Range over depth.** The demonstrated strength is many kinds of book, not one perfect book. →
   Kills the impulse to keep re-polishing a single manuscript.
3. **Proof before shelf.** Nothing publishes without an independent judgment that could have said no.
   → Makes the blind panel a gate, not a report.

---

## The bar, stated so it can be checked

"The best novel that can be" is not a spec and cannot arbitrate anything. This can:

A book ships when **all** of these hold:

1. **Voice** — a blind panel confirms POV/register distinctness (the one strength worth protecting).
2. **No production artifacts** — zero unfilled placeholders, duplicated scenes, or notes-to-self.
   *Both are currently violated in published books.*
3. **Contract met** — declared `invariants` in `cdk.config.json` hold. Enforced, not warned.
4. **Record clean** — no open `critical` finding, and repairs verified applied.
   *Currently violated: a repaired address is still wrong on the live site.*
5. **Complete artifact** — manuscript, build, colophon, visibility `public`.

Note what is *not* on this list: a quality score. **The panel cannot discriminate** — 11 books, mean
7.39, sd 0.22, every book between 7.07 and 7.71. Until a metric separates books, the bar must be made
of things that are checkable. Adding an unmeasurable criterion is how this project got here.

---

## What it is explicitly NOT for

Stating this is what makes deletion possible.

- **Not a continuity-proving engine.** The deterministic detector produced 22 findings and 0 repairs
  corpus-wide; 6 of 7 sampled were false positives. Prevention (records read before re-quoting)
  works; detection does not.
- **Not an epistemic-reasoning demonstrator.** The pilot was falsified 1/4 → 0/4 by your own
  annotation. `dramatic_irony`: 67 calls, consumed by nothing.
- **Not an audiobook pipeline.** 42% of `press/`, seven mp3s ever, one documented path with zero
  output.
- **Not a benchmark harness.** Re-running one brief is not measurement; the control that would have
  made it measurement was never run.

---

## What follows immediately

In order, because each unblocks the next:

1. **Write down the negative results** — epistemic layer, deterministic detection. A negative result
   recorded is worth more than a subsystem left running to avoid admitting it.
2. **Fix instrumentation, not behaviour** — provenance stamping, mutation logs, `findings.json`
   status field, snapshots. Cheap, mechanical, and the prerequisite for any judgment about a phase.
3. **Then, and only then, ablate.** Remove a phase, measure the artifact. The editor stack is 41.6%
   of all spend and has never been measured; that is where the answer is worth the most.
4. **Make the bar a gate.** Every criterion above already has code or is a day's work.

**Deliberately not next:** a per-piece conformance audit. It would produce a gap list, and a gap list
gets filled — which is the loop that produced this document's existence.

---

## The line to hold

*Judge the pipeline, not the book.* A fix aimed at one novel's defect does not count. Every criterion
above is book-independent by construction, and if a proposal cannot be stated without naming a
particular manuscript, it is not a pipeline change.
