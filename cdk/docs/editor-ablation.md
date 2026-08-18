# Editor ablation — one pass removed, one pass saved by measurement

**Status: 2026-08-17. Removes editor-pacing's per-chapter loop. Keeps everything else.**

This began as a two-pass deletion and became a one-pass deletion, because the measurement contradicted
half of it. That reversal is the most useful thing in this document, so it is recorded first.

## What was removed

**`editor-pacing`'s per-chapter review loop** — $72.68 across ~328 lifetime calls, **7.4% of lifetime
project spend**. Null on three independent instruments:

1. **Blind put-down data.** Chapters it cut appear in cold-read panels' *weakest* lists at **53.1%**,
   versus **57.9%** for chapters it left alone. No detectable improvement.
2. **Selectivity.** Reconstructed from 241 pre/post pairs: it removes over-articulation tells at
   **0.97×** the rate it removes words. An enrichment ratio of 1.0 is what "indistinguishable from
   plain shortening" looks like as a single number.
3. **Blind forced choice.** Over 45 pairs, readers preferred its output **44.4%** of the time
   (95% CI 30.9–58.8%, p=0.55) — the only phase where the point estimate sits *below* chance, and the
   only one where content pushed against the post-edit version in both position conditions.

**`editor-pacing`'s macro arc assessment is KEPT** ($2.73 lifetime, prose-blind). Its per-chapter loop
and its macro block were always separate code; only the loop is gone.

## What was nearly removed, and why it was saved

**`editor-voice` stays.** An earlier revision of this branch deleted it, reasoning that a pass changing
a **median 0.31% of a chapter's words** for $81.07 could not be earning its keep, and that its edits
were "almost certainly below any judge's resolution."

That was wrong, and a blind forced-choice tournament over 90 reconstructed pairs proved it:

| phase | preference for post-edit | 95% CI | p |
|---|---|---|---|
| editor-compression | 66.7% | 56.4–75.5% | 0.0021 |
| **editor-voice** | **65.6%** | **55.3–74.6%** | **0.0042** |
| editor-continuity | 62.2% | 47.6–74.9% | 0.135 |
| editor-pacing | 44.4% | 30.9–58.8% | 0.55 |

Both significant results survive Bonferroni correction for four tests (α=0.0125). In the
position-disadvantaged half of the design, voice scored **55.1%** against compression's 52.1% — i.e.
voice's signal was, if anything, the more robust of the two.

**The lesson, stated generally: edit SIZE is a bad proxy for edit VALUE.** A pass that rewrites 0.31%
of a chapter can be as visible to a reader as one that cuts 5.3% of it. Any future ablation argued
from magnitude alone should be treated as unsupported until a preference measurement exists.

## The instrument, and why its own control matters more than its results

Each comparison presented the same chapter before and after **one** editor pass — thirty seconds
apart, so brief, register, plot, generator and model are all held fixed. That is the control that
re-running a brief can never provide: six re-runs of one identical brief in this project produced six
completely different novels (8-gram Jaccard ≈ 0.0000).

The set was 270 real comparisons plus **30 A/A controls presenting the same text twice**. The controls
found a serious artifact that would otherwise have been invisible:

- On identical texts, judges chose version A **29/30 (96.7%)**. There is a near-absolute
  **position default** when a forced choice has no basis.
- But 29 of those 30 reported **low confidence**, and only **1/30 (3.3%)** claimed a meaningful
  difference. The *perception* channel is honest; the default is a forced-choice artifact.
- On real pairs, chose-A collapses from 96.7% to **60.0%** — content overrides the habit.

Because post-image position was randomized (post in A for 137 of 270), the pooled estimates above are
position-balanced. **Without the A/A arm, a naive reading of this tournament would have been
uninterpretable**, and the residual per-condition gap (+23 to +31 points) would have gone unnoticed.
Any future use of this instrument must carry the control.

## Still unmeasured

**`editor-continuity`** — $99.90 / 326 calls, 62.2% preference but p=0.135 at n=45. Directionally
positive, underpowered. It is the last genuinely open question in the stack, and the pairs to settle it
already exist on disk; it needs n≈180, not a new experiment.

## Revert condition for what this change does remove

Restore the per-chapter pacing loop if a blind cold-read A/B shows the reduced arm degrading in **any**
book fifth, or a higher production-artifact or continuity-finding count, or a higher fabrication rate.
`editor-pacing` remains registered in `ALL_PHASE_NAMES`, so `cdk phase editor-pacing` still runs the
macro pass, and reinstating the loop is a local change to one file.

## What this does not claim

It does not claim readers would notice the pacing loop's absence — only that no instrument can detect
its presence, across three different methods, which is sufficient reason to stop paying for it. The
preference figures above are LLM judgments; an LLM judge's agreement with a human reader is itself
unvalidated. A human sub-sample of ~40 pairs is the next thing this evidence needs, and until it
exists, every percentage on this page should be read as "a strong judge prefers," not "a reader
prefers."
