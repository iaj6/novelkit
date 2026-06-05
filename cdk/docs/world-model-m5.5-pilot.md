# M5.5 epistemic population pilot — `the-contingency`

**Question.** The M5.5 unit tests prove the `dramaticIrony` *query* works. This pilot asks the
other half: given the **real gated drafter prompt**, can an agent **populate** the who-knows-what
layer from real chapters well enough that the intended irony actually lands? (The mandate-B
equivalent of the M3.5 atomization probe.)

**Method.** 4 independent annotator agents each read the full 16-chapter draft of `the-contingency`
plus its brief, ran the verbatim `EPISTEMIC CAPTURE` instruction from `phases/drafter.ts`, and
emitted `record_knowledge` events (knower / prop / stance / asOfChapter). Measurement is
**deterministic and done locally**: each event set is projected with the real `project()` and
scored with the real `dramaticIrony()` — the agent-population question is isolated from
measurement noise. Workflow run `wf_c79a60c0-d5e`.

The book's load-bearing irony map (from the brief + chapter-map), used as ground truth:
- **(A) the president's son** — the reader learns the son is on the list at **Ch04** (Brandt POV,
  "Voluntary"); the president does not realize until **Ch14**, reading the name aloud before he
  understands it. A reader-ahead gap **live Ch04–13, dying at Ch14**.
- **(B) Brandt's belief** — Brandt earnestly believes the mission is humanity's last chance; the
  reader suspects from the opening roll-call-as-vanishing that nothing returns. Never recanted.
- **(C) negative control — the creature's intelligence** — deliberately unresolved; the reader and
  Reyes share the same unprovable suspicion. A good annotation must **not** manufacture an irony here.

## Results

| Annotator | events | invalid | @reader | (A) SON gap live@13 → closed@14 | (B) belief gap | (C) creature false-irony |
|---|---|---|---|---|---|---|
| A1 | 82 | 0 | 25 | ✗ — inverted (opens@14, never closes) | ✗ | ⚠ leaked one (reader↔president) |
| **A2** | 86 | 0 | 36 | **✓ correct arc** | ✗ | ✓ clean |
| A3 | 78 | 0 | 28 | ✗ — mis-stanced (`wrong_believes`) | ✗ | ✓ clean |
| A4 | 83 | 0 | 44 | ✗ — slug split, reader only `suspects`@4 | ✗ | ✓ clean |

**329/329 events were schema-valid (0 invalid).** The vocabulary is well understood; every failure
is *semantic/structural*, not syntactic.

### What worked
- **The query is proven on real material.** A2's events project to exactly the intended arc:
  `dramaticIrony` reports the president's-son gap as of Ch13 (reader **knows** the son is on the
  list, president **unaware**) and the gap is **gone at Ch14** (president learns). The capability
  is real; A2 is an existence proof end-to-end.
- **Negative control held 3/4.** No false reader-vs-Reyes irony on the creature — annotators
  consistently modelled Reyes as `believes`/`knows` (not "behind"), so no gap fired.
- **Perfect schema validity** across four independent passes and ~80 events each.

### What didn't
- **Capture is unreliable: 1/4 produced (A) as a queryable gap.** The three misses are all the
  same family the judge flagged:
  - **Slug non-sharing** — the reader-side anchor and the character-side unawareness land on
    *different* prop slugs (`presidents-son-on-the-contingency-list` vs
    `president-reading-his-own-sons-name`), so they are not machine-comparable. (A1)
  - **Unaware party not pinned across the live window** — the president's `unaware` is asserted
    only at Ch14 (the death chapter), never across Ch04–13, so during the window when the irony
    is live there is nothing to compare against. Only A2 asserted it across the window
    (president `unaware`@Ch12, `inferred`). (A1, A3, A4)
  - **Reading-order collapse** — the reader's *knowing* that Farrow **is** the son is deferred to
    Ch14 (A4 logs only `suspects`@Ch04), collapsing the reader-ahead window the brief requires.
  - **Mis-stance** — A3 marks the president `wrong_believes` at the reveal; he is **`unaware`**, not
    holding a false belief.
  - **One precision leak** — A1 modelled the president as `unaware` of the creature's intelligence,
    producing a low-value reader↔president "creature" gap; a stray annotation the prose doesn't
    support (Reyes told the president's office cognition was *unconfirmable*, not nothing).
- **Over-population.** ~80 events/book, much of it gapless self-knowledge (a character knowing a
  fact just narrated in their own POV) — noise that dilutes the load-bearing gaps.
- **Belief irony (B) is out of scope by design — 0/4, and that is correct.** `dramaticIrony`
  models **knowledge** asymmetry (X knows, Y doesn't). Brandt's belief is a **conviction**
  asymmetry about an *unresolved* question — to fire a gap you would have to assert Brandt
  `wrong_believes` the mission is futile, i.e. assert a truth the book deliberately withholds. The
  model correctly does not manufacture it. This is a real **boundary** of the feature, not a bug:
  who-knows ≠ who-believes-rightly.

## Verdict

**Augment-now, tighten-the-prompt-before-M6** — the same posture the M3.5 probe produced for fact
atomization. The capability is sound and proven; the *capture* prompt under-constrains the
structure a queryable irony needs.

### Prompt tightening shipped in this change set (4 disciplines, pilot-derived)
1. **Share one slug** — when the reader and a character sit on opposite sides of the same fact, use
   the *same* prop slug for both; resolve a renamed/aliased identity to one proposition.
2. **Pin the unaware party across the live window** — assert the character's `unaware` stance at the
   chapter the reader learns the thing (basis `inferred`), not only at the chapter they finally
   find out.
3. **Reading order** — the `@reader`'s stance changes in the chapter the prose reveals it; do not
   defer the reader's knowing to a later payoff chapter.
4. **Only gaps that matter** — record knowledge that opens/closes a gap between knowers (or that a
   later reveal depends on); skip a character's self-knowledge of a just-narrated fact.

### M6 gate (pre-registered)
Cutting nothing yet. Before M6 makes the store authoritative, **re-run this population pilot** on
the tightened prompt; the gate is **load-bearing-irony capture ≈ all annotators** (not 1/4) **∧
clean negative control ∧ no reading-order inversions**. The reassess is a re-run, not a vibe — same
discipline as the fact-atomization re-probe.
