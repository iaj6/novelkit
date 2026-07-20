# M10 (proposed) — Distinctiveness augment: self-repetition / attractor detection

*Status: SKETCH / proposed, and already through one adversarial design review (a 5-lens red-team,
`wf_99fb6b24-d61`) that corpus-verified two of its ship-blockers and corrected this doc's own
headline. Not built. M9 remains the final shipped milestone.*

M1–M9 optimized **consistency** — never contradict yourself. This milestone targets the orthogonal
axis M1–M9 was structurally blind to: **distinctiveness**. The FP-0 world-model audit will happily
certify "Eira the harbormaster tends the lighthouse as the war ends" as flawlessly self-consistent —
and say nothing about whether it is the same book every other model is writing.

## The honest reframe (what the red-team forced)

The first draft of this doc called itself a "mode-collapse detector" and cited an intra-corpus profile
of our own `library/` as proof that "the liminal-record-keeper archetype saturates our corpus"
(`threshold` 8/9 worlds, `keeper` 6/9, `ledger` 6/9). **Both claims failed review, and the failure is
instructive** — it is this project's signature failure mode (*a true positive of the machine is a false
positive of craft*) reappearing in the very tool meant to police it:

1. **The core metric does not measure the phenomenon in the title.** Mode collapse (per the cited
   preprint) is a *cross-system* property — all models independently fall into the same global basin
   (Elias/Elara/lighthouse). Intra-corpus "cross-world share" only measures *this pipeline against
   itself*. A corpus of `Elias / Elara / Silas / Mara / Eira` — every name a top-decile global
   attractor — scores 1/9 each and gets certified "diverse (good)." **A self-diverse corpus can be
   fully collapsed.** So v1 is honestly a **self-repetition / portfolio-monoculture** detector; the
   word "mode collapse" is only earned by a human-baseline tier (below), which the first draft wrongly
   deferred as optional.

2. **The headline numbers were tokenization artifacts.** KWIC inspection of the real corpus (verified):
   - `threshold` is almost entirely the *literal* word — "boots on the barn threshold," "stopped in
     the threshold with his cap," "lilacs at their threshold," a "temperature threshold." Not a liminal
     archetype. You cannot write a doorway-heavy domestic scene without it.
   - `keeper` is **11 innkeeper / 2 gatekeeper / 2 bookkeeper / 25 bare** — occupational nouns any
     village/road/heist narrative needs, not lore-keepers.
   - `ledger` 6/9 is largely genre-composition: our library is heavy on heist / fair-play-mystery /
     procedural worlds, and a ledger is the *engine* of those genres (the-long-tenant's probate record
     is its load-bearing document; the-courier-job's ledger is the score). Genre-clustered ≠ collapsed.

   **What actually survives verification:**
   - **Self-collapse of attention is real:** the `coldwater` world is 6 of 16 real dirs (37%) — we
     re-ran one town six times. (Though even this needs care — see the dedup problem below.)
   - **Register drift is real and frequency-invisible:** unpinned fantasy/literary books drift to an
     invented-liquid-soft name register (`Sela, Corvin, Evren, Iri, Sable`), while register-*pinned*
     historical books stay grounded (`James, Klaus, Hannah, Albrecht`). This is the pipeline's genuine
     dominant name failure — and cross-world token share is *blind* to it (every fresh name scores
     1/9 = "diverse").
   - **Mild global-attractor touch:** `Elias` appears in 2 independent worlds.

The lesson is the doc's own thesis, one level up: a confident deterministic statistic ("8/9!") was a
false positive of craft. The design below is rebuilt around not trusting itself.

## Why a named blocklist is still the wrong mechanism

(The one part of the first draft that survived intact.) A blocklist tests *set membership*; the
phenomenon is a *distribution*. It fails three ways: **whack-a-mole** (ban `Elias`, get `Silas`/`Eira`
— you move the peak, not the curve), **drift** (the attractor set is fed by the loop; a hand-list is
stale on arrival — *and this applies to M10's own seed list too*), and **only-knowns** (it can't catch
the next attractor). Keep `Elias/Elara/Mara/lighthouse/clockmaker` **only as a warm-start prior**, not
the mechanism.

## Design

Posture unchanged: **pure, deterministic, flag-only, FP-0, never edits/blocks, a human confirms.** An
augment may MISS; it must not false-positive. But v1 must be *named honestly* for what it measures.

### Detect — three tiers, and only the third earns the word "collapse"

1. **Self-repetition / portfolio-monoculture (v1 core).** Over the library, per name/motif, cross-**world**
   share — with three hard corrections the red-team made mandatory:
   - **`worldId`, not directory-prefix, is the dedup key.** The first profile deduped by stripping
     directory-name prefixes, which cannot tell a re-run from a companion book from a series. Proof in
     our own corpus: `Asa Beckwith` appears in 21 files of *each* Plattsburgh book — two deliberate
     companion novels — merged into "one world" *only* because they share a `plattsburgh-` prefix; a
     title-named series (`the-silkworm` / `career-of-evil`) would be split into N worlds and every
     recurring character flagged as a maximal attractor. Require an explicit `worldId`/`seriesId` in the
     brief/config; deliberate reuse within a `seriesId` is expected and excluded from the tail.
   - **KWIC is mandatory before any "motif/archetype" claim.** Cross-world share over surface strings is
     sense-blind (see `threshold`/`keeper`). No count may be narrated as a motif until keyword-in-context
     lines show the hits are one sense. Whole-word match; print the compound/sense breakdown beside every
     number.
   - **Genre-stratified baseline.** A motif is a candidate only if its share is high *within a genre
     stratum* (a lighthouse in a heist) or crosses genres that don't share it — never for a
     genre-mandatory element (ledger in a heist). Report raw *and* net-of-genre-expected; only the net is
     a candidate.
   - **Small-N honesty.** At 9 worlds the "tail" is a near-tie inside sampling noise (one book reshuffles
     the ranking). The profile is a *portfolio descriptor with error bars*, not a ranked tail, below an
     N-floor an order of magnitude above 9.
   - **Also report a non-deduped concentration index** (dir→world), so the 37% self-collapse the
     motivation leads with does not vanish into the dedup.

2. **Register-clustering (v1, first-class — not prose).** Because token frequency is blind to the
   pipeline's *actual* dominant failure (fresh-but-same-register names), promote a phonotactic/register
   measure (short / vowel-or-liquid / soft-ending; source-language morphology) to a real detector
   component. This is what catches `Sela/Evren/Iri`, which cross-world share scores as "maximally diverse."

3. **Human-baseline divergence (the tier that earns "mode collapse" — REQUIRED for that claim, not
   optional).** Compare against a versioned human-fiction name+motif frequency table; flag tokens N× over
   baseline. This is the *only* tier that measures the cross-system construct, and the only answer to
   drift and to inherited/novel attractors the corpus has used 0–1 times. **Gate the vocabulary:** v1
   without this tier may claim only "self-repetition / portfolio monoculture"; "mode collapse / global
   attractor" is unlocked only once the baseline exists. Caveat: exclude series-declared coined proper
   nouns (near-zero in any human corpus by construction) from this tier.

### Prevent — positive register-pinning, structured, and honestly limited

"If you'd reach for X, don't" is weak (the M5.5 lesson: the model can't reliably introspect its own
generation; negative prompting shifts the peak). The lever is **positive**: pin names/motifs to the
story's concrete constraints so the drafter samples the constrained sub-distribution. But the red-team
sharpened this into three requirements:

- **Structured, not prose.** Today the register lives in free `## Voice` paragraphs — a deterministic
  enforcer has nothing to iterate over. Require a per-slot schema (`{slot, register-id, name-pool/source,
  pinned | cross-register | unset}`) in config/front-matter.
- **Three-state, so craft isn't punished.** An *intended* off-register name is a first-class
  characterization move (the outsider whose name is wrong for the room). The enforcement flag fires only
  on `unset` (a slot the architect *forgot*), never on a declared `cross-register` choice.
- **Pinning relocates collapse; it can re-collapse — so profile within the register.** A period+place
  label alone peaks on the stock-period cluster (pin "1940s German" → every book gets Klaus/Hans/Greta).
  Proof: the two Plattsburgh worlds, pinned to the same 1814-naval register, *independently* reproduced
  `Asa Beckwith`. So the register field must specify a *pool width* ("draw from the census tail, not the
  top decile"), and the detector must measure cross-world share *within each register cohort*. And honor
  is only deterministically checkable against a closed name-slate; for open/fantasy registers, honor is
  advisory, not enforced (don't reintroduce the M5.5 judgment problem by pretending otherwise).

## The sharpest open question

Even fully built, does this detect the phenomenon the study names? The core tiers measure *us against
us*. Only Tier-3 measures *us against humanity*, and even that measures tokens, not the concept
("a keeper of a ledger at a threshold" spread across `archivist/registrar/tally` shows low share on
every surface token while the *concept* is 900× over human base rate). Concept-level collapse may be
beyond a deterministic detector entirely. That is the honest ceiling: M10 can make **self-repetition**
and **register monoculture** visible and can flag **known** global attractors; it cannot, by itself,
certify a book is not sitting in a basin no one has named yet.

## Honest limits

- Detection makes collapse **visible**; positive register-pinning **reduces** it; neither eliminates it
  — collapse lives in the weights and the sampler.
- v1 (tiers 1–2) is a **self-repetition / portfolio-monoculture** tool. The "mode-collapse" claim is
  gated on Tier-3.
- The detector's own headline output is subject to the craft-vs-machine false positive it exists to
  catch (see the corrected profile). KWIC + genre-net + human confirmation are not polish; they are the
  FP-0 floor.

## If pursued

- `world/collapse.ts` — pure profiler: `worldId`-keyed dedup; whole-word + KWIC output; genre-stratified
  net share; register-cohort share; a non-deduped concentration index. (The `scratchpad/collapse_profile.py`
  prototype is the *naive* version whose overclaims this review corrected — do not port it as-is.)
- A register-clustering component (phonotactic/morphology), not token frequency, for name drift.
- A versioned human-fiction baseline table — the deliverable that unlocks the "mode-collapse" claim.
- A structured, three-state register schema in the brief/config + an enforcement flag on `unset` slots only.
- A multi-archetype FP probe (series / genre-motif / authorial-signature) as a **blocking** ship gate —
  the same gate every prior deterministic augment passed.
- Add a roadmap M10 row only on a decision to build; M9 stands as the final shipped milestone.

---

*Design-review provenance: 5-lens red-team (`wf_99fb6b24-d61`) — series/shared-universe, genre-necessary
motif, metric soundness, register-pinning, construct validity. Corpus-verified corrections folded in:
`keeper` = 11 innkeeper / 2 gatekeeper / 2 bookkeeper / 25 bare; `threshold` predominantly literal
doorways; `Asa Beckwith` in 21 files of each Plattsburgh book. Verdict: prevention leg sound-with-
amendments; detection leg required a reframe (self-repetition, not mode-collapse) before it is credible.*
