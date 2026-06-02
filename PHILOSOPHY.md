# NovelKit Philosophy

This document captures the project's stance on what the pipeline is *trying to produce* and how its phases should reason about rules. It exists so that future changes to the pipeline — by humans or by agents reading this file — don't accrete rigor at the expense of voice.

## The principle

**The pipeline produces drafts, not finished products.** A draft that reads like a competent human first draft revised once is the target. Some imperfections are texture and should be left alone. The closest analogue is a working-writer manuscript before line edit, not a copyedited final.

Every rule the pipeline enforces closes off a possible voice. Every finding category we add gives the editor and reader phases another lever to over-correct toward sterility. Hyper-edited prose reads as edited. That is the failure mode this pipeline is designed to avoid.

## What this means in practice

**Some "rule violations" are voice, not failure.**

- A recurring construction across three or four chapters might be a stylistic tic, or it might be the cadence of a particular section of the book. If it does not pervasively damage the manuscript, leave it.
- A literary fade following another literary fade might be ending-mode uniformity, or it might be the briefed register doing what it was asked to do. If it appears across most of the book AND the brief asked for varied endings AND the substance does not justify the repetition, flag it. Otherwise, leave it.
- A POV character using a simile that "belongs to" another POV's vocabulary is a single-passage reach, not a register break. A register collapse across an act is.
- A character estimating someone's age wrong, counting under obstructed view, or recalling secondhand information is a character moment, not a continuity error.

The pipeline's instinct should bias toward "this is voice; leave it alone."

## Where to be strict, and where to restrain

**Be strict on binary problems.** Continuity facts that contradict across chapters, dropped narrative threads that the brief promised, structural failures that break the book's shape — these are problems regardless of voice. The audit phase is rigorous on facts; the reader phase is rigorous on threads and structure. These are showstoppers.

**Be restrained on judgment problems.** Style, register, pacing, individual word choice, the rhythm of how a chapter ends — these are matters of taste. The editor sub-passes have a chance per-chapter to tighten; after that, what's there is what's there. Don't ask the reader to re-litigate craft judgments that have already been made and committed to the page.

## For agents reading this file

If you are an editor or reader phase deciding whether to flag a finding, the default is **do not flag**. The cost of a missed problem is a finding that surfaces in the next read; the cost of a false-positive finding is noise that erodes trust in the pipeline and triggers unnecessary human review or, worse, mechanical "fixes" that sand away the prose.

If you are a drafter phase deciding whether to write a chapter that maintains a pattern (a third consecutive quiet ending, a recurring construction the reader will spot), the default is **write what the chapter's substance asks for**. Patterns can be voice or drift; the substance of *this* chapter is the only authority that can decide.

If you are the architect phase deciding what to put in `canon/style.md`'s `## Lean-into patterns` section, be generous. A pattern named as a lean-into is one the reader will leave alone, even when it superficially matches a failure-mode category. Generosity here protects the briefed register.

## For humans modifying this pipeline

Adding restraint is harder than adding rigor. Rigor feels like progress — another category caught, another rule enforced. Restraint feels like doing less. Default toward the harder choice.

Before adding a new finding category, ask: would a casual reader feel this? If the answer is "only a reader specifically looking for it," the category does not belong in `findings.json` — it belongs in a human's reading notes, not the pipeline.

Before tightening a prompt to catch more cases, ask: what voices does this prompt change close off? If the answer is "registers we want to support," tighten differently or do not tighten.

Before adding a new editor sub-pass, ask: does the existing per-chapter editor coverage already have a chance to do this work? If so, that's the right place for the fix, not a new pass.

## What this document is not

This is not a complete style guide. It is not a comprehensive theory of writing. It is a stance — a position the project has taken about what kind of artifact it is trying to produce and how its automation should reason about uncertainty. The stance was arrived at by observing the pipeline's outputs across multiple books and noting where it consistently over-corrected. Future iterations may sharpen it, but the direction (toward restraint, away from rigor) should not be casually reversed.
