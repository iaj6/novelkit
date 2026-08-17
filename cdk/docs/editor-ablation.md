# Editor ablation — removing two passes on measured nulls

**Status: shipped 2026-08-17. Reversible in one line. Carries a pre-registered revert condition.**

This is the project's first subtraction. It is recorded here rather than in a commit message because
the whole reason the editor stack survived fifteen months unexamined is that no phase ever had a
written statement of what it claimed to do and what would retire it.

## What was removed

| removed | lifetime cost | calls | why |
|---|---|---|---|
| `editor-voice`, from the default `editor` expansion | $81.07 | 327 | changed a **median 0.31%** of a chapter's words (p90 1.8%); **172 mutations left no changelog record**; no effect ever measured by any instrument that could have said no |
| `editor-pacing`'s per-chapter review loop | $72.68 | ~328 | **measured null** against the only external instrument available |

Together **~$153 — 15.7% of lifetime project spend.**

The null for pacing's per-chapter loop is the load-bearing number: chapters it cut appear in blind
cold-read panels' *weakest* lists at **53.1%**, versus **57.9%** for chapters it left alone. No
detectable improvement, and it removed over-articulation at only 1.19× a random-deletion baseline.

## What was deliberately KEPT

- **`editor-pacing`'s macro arc assessment** ($2.73 lifetime, prose-blind by construction). It is the
  inverse case: the only pipeline-internal judgment that survives contact with independent data — its
  named sag ranges track where blind readers stop (χ²=6.62, p≈0.010). See the caveat below.
- **`editor-compression`** ($116.17 / 299 calls) — the only pass in the project's history with a
  *measured positive* effect on a confirmed weakness: 22.79% removal of the class it targets against
  5.31% of words (4.3× enrichment), z=23.7 against a random-deletion null over 200 reps, **162
  chapters improved and zero regressed** across 295.
- **`editor-continuity`** ($99.90 / 326 calls) — genuinely unmeasured, in neither direction. Not
  removed. It is the next thing to price with the instrument this change establishes.

## The caveat on the macro pass, recorded honestly

The macro diagnosis was tested against a stricter bar than the one it passed: does its *declared* sag
zone predict blind-panel weakness better than an equal-shape zone placed by rule in the same book's
middle third? Result: lift 1.201 vs 1.096 (+9.6%), **7 win / 2 lose / 1 tie**, sign p=0.18;
within-book placement null Stouffer p=0.20. Both pre-registered criteria failed.

**But with 9 decisive books the sign test needs 8/9 to reach p<0.05.** This is *not demonstrated at
this sample size* — not *demonstrated absent* — and the direction favours the macro. It is also
answering a leading question: `prompts/editor-pacing.md:12` tells it *"In the middle third of the
book, does pressure stall? This is the most common novel failure."*

The pass is kept because it costs $2.73 and its removal was not what this change measured. It does
**not** license an actuator. Any design that acts on the diagnosis needs the test above to pass first.

## Pre-registered revert condition

Restore both passes if, on a blind cold-read A/B of the same brief across two arms:

1. the reduced arm's **weak:strong citation ratio degrades in ANY book fifth**, or
2. the reduced arm shows a higher **production-artifact** or **continuity-finding** count, or
3. fabrication rate rises in the reduced arm.

Reverting is one line in `cdk/src/phases/editor.ts` (re-add `runEditorVoice`) and reinstating the
loop in `cdk/src/phases/editor-pacing.ts`. Both phases remain registered in `ALL_PHASE_NAMES`, so
`cdk phase editor-voice` and `cdk phase editor-pacing` continue to work unchanged, and neither is
deleted from the codebase.

## Why this shipped ALONE

The A/B is the point. Bundling any other change — especially anything touching the drafter's tool
surface, which alters the token stream and therefore generation — would confound the arms. The other
vetted deletions (`query_relations`, the epistemic layer, `press/` audio, the orphaned world-view
renderers) are queued as separate changes for exactly this reason.

**The saved $153 is not a budget for new machinery.** The failure mode this project has demonstrated
19 times is that freed capacity becomes a new phase.

## What this does not claim

It does not claim the removed passes made books worse, and it does not claim a reader would notice
their absence. It claims they had no measurable effect for $153, which is a sufficient reason to stop
paying, and an insufficient reason to believe anything about the artifact. The experiment that would
reach the artifact is a blind forced-choice over the 295 recovered pre/post chapter pairs — including
a human sub-sample, because an LLM judge's preference is itself unvalidated.
