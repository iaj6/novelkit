# What novelkit is for

**Status: revised 2026-08-18. Written to be argued with.** Every factual claim below was
claim-audited against `main` at `daa4b3a` — each one re-derived from the repo, not carried forward
from the previous draft. Claims that changed are marked ⟳ with the old value, so the drift is
visible rather than silently overwritten. The purpose line itself is still **unratified**.

---

## The question that has never been answered

The project has been run as two different things at once, and the tension shows up in the numbers:

| Behaving like a **research instrument** | Behaving like a **press** |
|---|---|
| $353.89 (36.3% of all spend) re-running one brief ⟳ *was $344.79 / 38.5%* | 11 published editions, 407,990 words live |
| **$536.44 — 55.1% of all spend — on books never published** ⟳ *was $524.62* | Covers, epubs, PDFs, a static reading room |
| Milestone arcs (M1–M9) aimed at capability, not output | `publish` / `unpublish` commands, colophons |

⟳ Correction worth keeping: only **five** of those six runs share a brief. `coldwater-reach`,
`-v031`, `-m6`, `-m7`, `-fm4` are byte-identical; `-mech` is a different brief. The strict
same-brief subtotal is $329.88.

Nothing has ever declared which of these wins when they conflict, and the symptom is still visible
on the shelf: **the two runs that exercise the most machinery are private with no build, while a
3-chapter toy is public with a full cover/epub/PDF/audiobook set.**

**Every accretion in this codebase traces back to that gap.** With no purpose to judge against,
every hole looks worth filling — which is how you get 19 phases, 25 tools, and 2.7× cost growth on
an unchanged model ⟳ *was "3.4× … and not one deletion in fifteen months"*.

Two corrections to that sentence, both of which make the project look better and the lesson sharper:

- **It is three months, not fifteen.** Repo history runs 2026-05-18 → 2026-08-18. The accretion is
  real; the timescale was wrong by 5×.
- **The growth multiplier was not like-for-like.** $1.25/ch → $4.23/ch compared a 2026-05 run against
  one that also paid for cold-read and revise. Core generate-and-edit pipeline only: **$1.25 → $3.49,
  2.8×**. Still real, still unexplained by any measured per-phase benefit.

---

## What the evidence says it is actually good at

Measured, and where possible confirmed by reviewers who could not see the brief.

- **Sustained, distinct POV voice.** First item in "What's Working" in 12 of 15 reader letters.
  ⟳ **The panel half of this claim was overstated.** Blind cold-read panels name it a consensus
  strength in **4 of 13** books — and in **4 others the authenticity lens found the POVs *not*
  distinguishable.** This is still the best-evidenced strength, but it is contested, not confirmed.
  *(Previous draft: "independently confirmed by both blind panels … the only strength verified by an
  apparatus structurally unable to flatter it." That was true of the two books then panelled and did
  not survive the other eleven.)*
- **Range.** 14 distinct stories: 1814 naval, WWII homefront, Antarctic SF, dungeon crawl, 1920s
  probate, YA fantasy, Ceaușescu-era Romania. ⟳ Not "from one unchanged pipeline" — they came from
  **six pipeline generations**, and as of `daa4b3a` from a pipeline that no longer exists in the form
  that produced them.
- **Finishing.** 19 retries in 1,971 calls (0.96%), **2 max-turns failures ever**, resumable across a
  crash. Every retry succeeded on attempt 2; none exhausted the budget. ⟳ *was 16 in 1,873.*
- **Documentary fidelity when a brief is built around it.** 16 registered records, 16
  verbatim-faithful.

And what it is reliably bad at: under-writing its stated target (8/12 books), midbook sag, and
judging its own output. ⟳ **Over-articulation has moved off this list as an unmoved defect.** The
tally survives — 15/15 letters at concept level, 13/14 books with an explicit finding — but "never
moved" was an artifact of *when the letters are written*: they are produced **after** compression
runs, so 15/15 measures **residual**, not untouched. The pass that targets it wins a blind forced
choice 66.7% of the time (p=0.0021).

---

## Proposed purpose *(recommendation — still unratified; argue with this line first)*

> **novelkit is a press that produces finished, register-disciplined novels across many genres, and
> proves what it produced is worth reading before it ships.**

Three commitments follow, and each one kills something:

1. **Press, not laboratory.** A run exists to produce a book that ships. Capability experiments are
   permitted only when *paid for by a book that ships*.
2. **Range over depth.** The demonstrated strength is many kinds of book, not one perfect book.
3. **Proof before shelf.** Nothing publishes without an independent judgment that could have said no.

**The honest counter-argument, which has strengthened and should be settled before this line is
ratified:** 55.1% of all spend has gone to books that never shipped, and the most valuable outputs
of the last week were *instruments and findings*, not novels — a reconstructor that recovered every
edit ever made for $0, a forced-choice harness with a working control, and a set of transferable
negative results. That is a laboratory's output, and it was worth more than the book it came from.
Adopting "press" means deciding those were a detour. Adopting "instrument" means the shelf stops
being the scoreboard. **Pick one in writing.**

---

## The bar, stated so it can be checked

A book ships when **all** of these hold:

1. **Voice** — a blind panel confirms POV/register distinctness.
2. **No production artifacts** — ~~zero unfilled placeholders, duplicated scenes, or notes-to-self~~
   → **zero build machinery in the reader's copy.** ⟳ **All three originally named types were wrong,
   and the real one was unnamed.** Zero unfilled placeholders and zero notes-to-self exist in any
   published manuscript. **Duplicated scenes do not occur either** — an evidence pass over all 21
   books found 6 candidates and all 6 were *registered documents being deliberately re-quoted*, which
   is the record layer's designed behaviour; the earlier "2 of 11 books" was that same false
   positive, twice. What *was* present, in all 11 published books: **178 build-provenance comments
   leaking an absolute home directory path into the deployed site.**
   **Now fixed at source and gated** — `cdk publish` refuses on any absolute path or build comment in
   a shipped artifact (`cdk/src/artifacts.ts`), 11/11 books pass, and the defect class is measured at
   **0.86 panel points**, larger than the entire between-book spread of the corpus. This is the first
   criterion on this list to actually become a gate.
3. **Contract met** — declared `invariants` in `cdk.config.json` hold, enforced not warned.
   ⟳ **Currently vacuous: 0 of 21 books declare an `invariants` block on main.** `checkProjectInvariants`
   is a `console.log` at the tail of `runAll` — no throw, no exit code. The criterion gates nothing.
4. **Record clean** — no open `critical` finding, repairs verified applied.
   ⟳ **Not checkable as written.** `findings.json` has no `status` field anywhere in the corpus, so
   "open" is not representable and no finding can ever be closed. Read as "present," the violation is
   far wider than the one address previously cited: **7 of 11 published books carry a `critical`
   finding, and only 2 of those 7 have a repair log at all.**
5. **Complete artifact** — manuscript, build, colophon, visibility `public`.

Not on this list: a quality score. **The panel still cannot discriminate books** — 11 books, mean
7.39, sd 0.22, range 7.07–7.71, and test-retest sd 0.236 on an *unchanged* manuscript, i.e. its noise
equals its entire between-book signal.

**But that conclusion needs qualifying rather than reversing.** A forced-choice instrument *does*
discriminate — between **versions of the same artifact**, at p<0.005. Absolute rating of whole books
fails; paired comparison of a controlled edit works. Those are different instruments answering
different questions, and the bar should use each where it applies.

---

## What it is explicitly NOT for

- **Not a continuity-proving engine.** The deterministic detector produced 22 findings and 0 repairs
  corpus-wide; 6 of 7 sampled were false positives. Prevention (records read before re-quoting)
  works; detection does not. Note also that `auto_repair_safe: false` is a **hardcoded literal at
  four emission sites** — "0 auto-repairable" was a design input reported for months as a result.
- **Not an epistemic-reasoning demonstrator.** The pilot was falsified 1/4 → 0/4 against its own
  pre-registered gate. `dramatic_irony`: 67 calls, consumed by nothing downstream.
- **Not a benchmark harness.** Re-running one brief is not measurement; the control that would have
  made it measurement was never run.

⟳ **"Not an audiobook pipeline" has been removed from this list.** The facts behind it hold — audio is
~38–44% of `press/`, seven mp3s ever, and **two** documented paths with zero output ⟳ *was one*. But
this section exists so that "stating it is what makes deletion possible," and audio is **deliberately
retained** by decision of 2026-08-17: it is opt-in, never in the pipeline's hot path, costs nothing
per run, and a future book may warrant a full ElevenLabs audiobook. **Line count is not a cost
argument for dormant, isolated, optional code.** What matters for deletion is whether something runs
on the hot path — which is why `query_relations` (in the drafter's tool schema on every call, invoked
zero times ever) is a better deletion candidate than 1,255 lines of shell script nobody runs.

---

## What the measurement loop found *(new — this section did not exist, and it invalidates the last one's plan)*

The previous draft's plan was: write down the negatives → **fix instrumentation** → *then, and only
then*, ablate, because "the editor stack is 41.6% of all spend and **has never been measured**."

**That premise was false.** The instrumentation already existed. `run.jsonl` logs every `write_file`
call with its **full content**, so every editor mutation's before/after image was recoverable all
along: 1,388 draft writes, 25.9 MB, 99.8% complete, **cost $0**. Four separate analyses had declared
that data lost and proposed buying it back for $30–55.

What the ablation then found, over 300 blind comparisons (270 real + 30 A/A controls):

| pass | preference for the edited version | verdict |
|---|---|---|
| `editor-compression` | **66.7%** (p=0.0021) | earns its keep |
| `editor-voice` | **65.6%** (p=0.0042) | earns its keep — **deletion reversed** |
| `editor-continuity` | 62.2% (p=0.135, n=45) | underpowered, still open |
| `editor-pacing` per-chapter | 44.4% (p=0.55) | null on three instruments → **deleted** |

The editor stack is now **38.3%** of spend ⟳ *was 41.6% — the dollars are unchanged at $372.75; the
denominator grew*. It is also mostly **vindicated**, which is the opposite of what this document
predicted.

Four things learned that should outlive any of the above:

1. **Edit size is a bad proxy for edit value.** `editor-voice` changes a median 0.31% of a chapter's
   words and was deleted for it — then measured indistinguishable from a pass cutting 5.3%.
2. **Every preference instrument needs an A/A control.** On *identical* texts judges chose version A
   **29/30 (96.7%)**. Without that arm the whole tournament would have been uninterpretable. (The
   perception channel is honest: only 1/30 claimed a difference, and 29/30 reported low confidence.)
3. **Never report a null without a power check.** The proposed midbook-sag fix died on a render-density
   metric that is a *true* null — the instrument detects a 15% injected trough at p=0.002, and the
   real corpus sits at p=0.14. And the metric's raw correlation with the sag was r = −0.74, of which
   **all** was set-cumulation arithmetic; a permutation control is mandatory for any "things not seen
   before" measure.
4. **Subtraction is harder than it looks even when you are trying.** The commit billed as this
   project's first deletion is **net +146/−32**. Removing 23 lines of code required 78 lines of
   written record. That is the correct trade, and it is why deletion will never happen by itself.

---

## What follows immediately

⟳ The previous list is superseded: steps 1–3 are done, invalidated, or were never necessary.

1. **Close out `editor-continuity`** — the last unmeasured phase in the largest layer, 62.2% at
   p=0.135. The pairs already exist on disk; it needs n≈180, not a new experiment. ~$25.
2. **Validate the judge against a human** — ~40 pairs. Every preference figure above currently reads
   "a strong LLM judge prefers," not "a reader prefers," and nothing distinguishes those yet.
3. **Make the rest of the bar a gate.** ⟳ Criterion 2 is now done — `cdk publish` refuses on build
   machinery in a shipped artifact, and the leak it was built for is fixed at source. The remaining
   two are blocked on *representation*, not on checking: `invariants` is vacuous until a book
   declares one (0 of 21 do, and `checkProjectInvariants` is a `console.log` with no throw), and
   "no open `critical` finding" is not expressible until `findings.json` gains a `status` field.
   Fix the representations before writing the checks. The pattern criterion 2 established is the one
   to copy: **hand-check precision across the corpus before wiring anything to an exit code** — that
   pass is what revealed two of the three originally-named artifact types do not occur at all.
4. **Correct the shelf** — the machinery-exercising runs are private, the toy is public.

**Deliberately not next:** a per-piece conformance audit. It produces a gap list, and a gap list gets
filled — which is the loop that produced this document.

---

## The line to hold

*Judge the pipeline, not the book.* A fix aimed at one novel's defect does not count.

And the line this revision adds, learned by getting it wrong three times in one week:
**no deletion without a measurement, and no measurement without a control.** Three deletions proposed
in the last days were stopped not by argument but by evidence — `editor-voice` by a forced choice,
the `renders:` contract by a power check, `press/` audio by noticing that line count is not cost.
Being talked out of a change by your own instrument is the loop working. It is also the only thing
here that has ever reliably prevented an accretion.
