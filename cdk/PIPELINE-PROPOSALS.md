# NovelKit (cdk) — Pipeline Change Proposals

*Derived from the Long Tenant run (coldwater-reach-m7) and its 8-reader review, then vetted against the live checkout. Every file/line below was confirmed against `src/` on `main`.*

These are the surviving proposals from seven investigator findings, ranked by the maintainer's priority. The through-line is restraint: each change is either a **detector/flag** (surfaced to a human, `repair_agent: null`, never an auto-fix) or a **brief/prompt reframe** that removes accreted rigor. No proposal mints a new `FINDING_CATEGORIES` entry (the enum at `reader.md:53` is untouched), and none auto-edits prose. Where a finding split into a cheap brief-side fix and a heavier code change, the brief-side fix ships first and the code is gated on a re-probe.

> **Update (generality probe, 2026-06-23):** these proposals were derived from ONE experimental book, so all seven were stress-tested against 5 diverse archetypes (single-POV romance, multi-POV epic fantasy, propulsive thriller, comic novel, cozy/fair-play mystery) + an adversarial harm-hunt. The verified verdict is folded in below — a summary matrix here, and a **Generality** line in each section. **Fewer than half generalize cleanly.**

## Generality verdict (probe-verified)

The governing failure mode the probe surfaced:

> **A deterministic style detector aimed at a genre whose *engine is the pattern* flags the genre's best move as a defect** — comedy's running gags, the cozy's narrator-culprit, the epic's braid cadence, the thriller's withheld plan, fair-play's re-quoted clue. *A true positive of the machine is a false positive of craft*, and only a multi-archetype probe surfaces it, because no single book exhibits it.

| # | proposal | verdict | action |
|---|---|---|---|
| **8** | **Compounding-mechanism brief field + two-gate tension check** | **✅ VALIDATED** | **ship now — the only experimentally-proven item** |
| 3 | Auth/billing banner | **UNIVERSAL** | ship now |
| 2 | `findRelationConflicts` (Part B) | **UNIVERSAL** | ship now |
| 1 | Length padding **flag** | **UNIVERSAL** | ship now |
| 1 | Length **prompt reframe** | **HARM-RISK** | ship only with a structural-contract floor (under-builds epics) |
| 7 | Cross-POV convergence | **CONDITIONAL** | ship last, probationary; pull on noise |
| 4 | Verbatim re-quote governor | **OVERFIT** | redesign — its contact surface is deliberate craft |
| 6 | POV-concealment detector | **OVERFIT** | hold for a 2nd, non-source-book sighting |
| 5 | Stride/motif detector | **HARM-RISK** | redesign — would flag a comic's best joke |

Net: **ship #8 (validated), #3, #2 (Part B), and #1's one-directional flag now.** Everything else needs a guardrail, a redesign, or a second book first. Per-proposal guardrails are in each section's **Generality** line below.

> **Update (middle-sag experiments, 2026-06-25):** Proposal **#8** was added and is the only **experimentally validated** item here — two controlled re-runs on the pipeline's hard quiet-literary case (a clock re-specified to gate an irreversible action; a braid with an evolving displacement object per withholding chapter) each improved their saggy middle and confirmed the fix. See §8.

---

## 1. Length target is a hard word FLOOR that forces padding  →  reframe to ceiling
**Priority 9 (highest leverage) · verdict: keep · effort S · impact high**

**Generality (5-archetype probe): SPLIT — the one-directional padding FLAG is UNIVERSAL (ship now); the PROMPT REFRAME is HARM-RISK.** *Refines* my a-priori "universal" call. In contract-length genres (epic fantasy; any book with a required act or clue structure) "the book may come in shorter; allocate fewer chapters" has no lower guardrail and invites *under-building* — an epic dropping a planned POV thread to ship a truncated 110k "epic." 4 of 5 archetype editors missed this; only the epic editor caught it. **Guardrail:** ship the flag as-is; for the reframe, require the architect to honor the brief's STRUCTURAL contract — *"come in shorter only if the material genuinely does not sustain the length; never drop a planned POV thread, act, or clue-chain to hit a lower number"* — and exclude convergent-payoff chapters (a back-half chapter re-invoking a prophecy/lineage/clue as PAYOFF is not dilation) from the padding question.

**Problem.** The brief's `Target length: ~N words` becomes an inviolable per-chapter floor. Verified pattern (the courier-job book that scored pacing 4.6): the architect agent writes `"Chapter count is 12. Target word count is ~42,000 (~3,500/chapter)"` into `continuity.md`, a `"Do not let any chapter run below 2,500"` rule into `agent-guidance/plotter.md`, and per-chapter `~3,500` word cells into the chapter map. The only downstream length lever, the pacing editor, is forbidden from restructuring (`editor-pacing.md:37` "Cutting is acceptable. Restructuring is not."). There is no downward path; padding is the only way to satisfy the contract — manufacturing the exact restate-to-hit-a-number sterility the project exists to prevent.

**Root cause (corrected).** The floor is **not** hardcoded. `src/prompts/architect.md:171-174` ships only an empty `## Chapter target words` template ("Are all chapters roughly the same length?"). The architect AGENT authors the floor per-book into canon. So the load-bearing fix is what the architect is *told to write*, not pipeline code.

**Change.**
1. `src/prompts/architect.md` — in the length-handling instruction, direct the architect to record length as a CEILING + chapter-count CAP, never a quota: e.g. *"Target ~42,000 words / up to 12 chapters; the book may come in shorter if the material does not sustain the length — DO NOT pad to reach the target."*
2. `src/prompts/architect.md:171-174` `## Chapter target words` template — replace the floor prompt with: *"Chapters may run short when the beat is thin; there is no minimum. The plotter MAY allocate fewer chapters than the brief's number if the beats do not fill them — note this in the chapter map."*
3. `src/prompts/plotter.md` quality bar — one clause: *"Length is a ceiling, not a quota — never invent beats or stretch scenes to hit a word number; a shorter true book beats a padded long one."*
4. **No standalone code check.** Fold the padding detector into the EXISTING `editor-pacing` macro pass and `reader` synthesis as ONE binary question: *"Does the back half restate/dilate to reach the word target?"* On a clear yes only, emit a single `structural-failure` finding titled `length-driven padding` citing the 2-3 restating chapters, `suggested_action: "consider collapsing to ~N chapters"`, `repair_agent: null`.

**Layer.** architect-prompt + plotter-prompt + reuse existing `structural-failure` category (no new category, no new code).

**Restraint check.** This REMOVES a hard quantitative rule. The one new signal is a flag, never an auto-collapse (collapsing chapters is irreversible aesthetic surgery the pipeline must not auto-do), reuses `structural-failure`, and is strictly **one-directional**: flag padding, NEVER flag brevity — so it can only ever bias toward the project's preferred restraint.

**Validation.** Re-run the architect on the courier-job brief; confirm `continuity.md` reads as a ceiling and `agent-guidance/plotter.md` has no "do not run below" floor. Cheap unit check: a fixture brief + assertion that no generated continuity fact contains a per-chapter minimum. Positive control: run the padding question against an already-padded draft (expect the flag); negative control against a tight book (expect zero — no "too short" nag).

---

## 2. Audit blind to relational/spatial conflicts (PART B)  →  add `findRelationConflicts`
**Priority 8 · verdict: keep PART B / defer PART A · effort M (B alone: S–M) · impact high**

**Generality (5-archetype probe): UNIVERSAL — *confirms* a-priori. Ship now.** Highest-value win for epic fantasy, thriller, and cozy mystery (load-bearing geography); inert-harmless elsewhere. **One correction the editors all under-weighted:** "FP-0" is over-claimed — because the store can't time-index attributes (the M8 gap), a character who LEGITIMATELY relocates registers two locations and trips a false "contradiction" (acute in travel-dense epic/thriller). Still ship (flag-only, human-triaged), but **label the finding text:** *"possible spatial contradiction OR legitimate relocation — store cannot time-index attributes; verify against the timeline."* PART A (`asserts` field) is OVERFIT to this book's spine-document-number conceit — keep deferred.

**Problem.** `findContradictions` (`src/world/audit.ts:85-139`) iterates only `tables.facts.values()` (confirmed) — it never reads `tables.relations`. The coldwater-m7 store holds functional spatial relations (`lives_at` ×4, `located_in` ×4, `boards_at` ×2, `holds_adjacency_to` ×2) alongside high-cardinality social ones (`knows_of` ×20). A witness captured as simultaneously "three-houses-north" and "across-and-one-south" passes the audit silently.

**Root cause.** `audit.ts:85` `for (const f of tables.facts.values())` — relations are a separate table that no detector groups or compares.

**Change (PART B, pure code, no schema migration).** Add `findRelationConflicts(tables)` to `src/world/audit.ts`, wired into `src/phases/continuity-fact-audit.ts` exactly like the existing `findContradictions`/`findRecordDivergences` appends (the phase already imports both at line 7 and `appendFindings`-only-if-non-empty at lines 69-80). Group live relations by `JSON.stringify([from, relType])`; flag when one functional slot holds ≥2 distinct `to` values (or contradictory `value` booleans). Emit existing `continuity-fact`, `repair_agent: null`. **Hardcode the functional-relType allow-list as a top-of-file constant:** `{ lives_at, located_in, boards_at, holds_adjacency_to }`. relTypes are free-typed strings in the store (`boards_with`, `brings_document_to` appear ad hoc), so the allow-list will only ever catch the canonical few — acceptable, since FP-0 is the priority and `knows_of` ×20 must never be flagged.

**PART A (`asserts` schema field) — DEFERRED.** Add an optional `asserts?: {entity,attribute,value,unit?}[]` to `RecordUpsert` (`src/world/schema.ts:176-201`) + `findRecordCanonConflicts(tables)`, so a wrong house number sealed in a faithfully-reproduced document ("14 Verrill" vs canonical "412 Verrill") is checkable. Purely additive (records without `asserts` behave as today, FP-0). BUT its payoff is gated on the architect actually annotating spine-document numbers — brief/seed discipline that MEMORY (seed-then-enforce) shows agents do unreliably. Ship the field paired with an explicit architect-prompt instruction, then **re-probe whether agents populate it before relying on it.** Do not let PART A block PART B.

**Layer.** PART B: `src/world/audit.ts` (new pure detector) + `src/phases/continuity-fact-audit.ts` (wire). PART A: `src/world/schema.ts` + architect-prompt (deferred).

**Restraint check.** This is the rigor PHILOSOPHY explicitly SANCTIONS ("be strict on binary problems… the audit phase is rigorous on facts"). A witness simultaneously north and south is a pure binary contradiction. No new category (emits `continuity-fact`), flag-only, FP-0 by the hardcoded allow-list. Character-estimating-wrong is preserved because those are never registered as functional canon relations.

**Validation.** Unit test `findRelationConflicts`: two live `located_in` relations from the same entity to different `to` → one finding; two `knows_of` relations to different people → zero (not on the allow-list). Determinism: call twice, expect equal ids. Re-run probe on the coldwater-m7 store; confirm no new false positives across the ~19 existing relations.

---

## 3. Auth/billing path never surfaced; stray `ANTHROPIC_API_KEY` billed pay-as-you-go
**Priority 8 · verdict: keep · effort S · impact high**

**Generality (5-archetype probe): UNIVERSAL — *confirms* a-priori. The cleanest of the seven (zero craft contact surface). Ship now, no guardrail.** Matters MOST on the epic (longest, most expensive run — the burn it prevents scales with run length). Keep the pre-flight line labeled a heuristic; the SDK `apiKeySource` init message is ground truth; never auto-unset the key.

**Problem.** The pre-run banner prints book/chapters/model/estimate/eta and **nothing** about credential or billing mode (confirmed `src/conductor.ts:121-145`). A stray `ANTHROPIC_API_KEY` (the SDK ranks an env key above subscription OAuth) silently routed a 13.5h run onto pay-as-you-go credits and burned ~$74 before "Credit balance is too low" killed it mid-run. The SDK reports the answer in the `{type:'system', subtype:'init', apiKeySource}` message it emits first — but the agent loop (`src/agentRunner.ts`) branches only on `message.type==='assistant'` (line 341) and `'result'` (line 363), so the init message is silently dropped.

**Root cause.** `agentRunner.ts:341,363` — no `system`/`init` branch. `conductor.ts:printPreRunBanner` — no billing line.

**Change (two-part detector, no auto-fix).**
1. **Pre-flight heuristic** — new `src/billing.ts` `detectBillingMode()` checks `process.env.ANTHROPIC_API_KEY` / `CLAUDE_CODE_USE_BEDROCK` / `CLAUDE_CODE_USE_VERTEX` against the presence of `~/.claude/.credentials.json`. Add a banner line `billing: <mode>`. When an env key is set AND OAuth creds exist, append a yellow `WARNING: ANTHROPIC_API_KEY in env will override your Claude subscription and bill pay-as-you-go. Unset it to use the subscription.` **Label this line as a heuristic** — it cannot know what the SDK will actually resolve.
2. **SDK ground truth** — in `runQueryOnce`, add `else if (message.type === 'system' && message.subtype === 'init')` that reads `apiKeySource`, logs `ctx.log.event('auth', {apiKeySource, model})`, and prints `auth: apiKeySource=<oauth|user|project|org|temporary>` once (`oauth` = subscription; anything else = an API key). This is essentially free to add and is the authoritative answer.
3. **tee-masking (separable nice-to-have)** — in `cli.ts main().catch` (line 205-207), before `process.exit(1)` print one unmistakable marker (e.g. `=== CDK RUN FAILED (exit 1) ===` in red) so a human scrolling a `tee`'d log can grep the real failure. Land #2 first; this is lower value.

**Layer.** cli-banner / agent-loop (operational only — touches zero prose/findings path).

**Restraint check.** No PHILOSOPHY tension — this is the operational analogue of "surface to a human, never auto-fix." It warns and **never unsets the key**, never blocks the run, never alters a token. Both the hard-fail gate and the silent env-strip were correctly rejected as too paternalistic / the auto-fix the philosophy warns against.

**Validation.** Probe 1 (no spend): set `ANTHROPIC_API_KEY=sk-test` with creds present → banner shows the API-key line + warning; unset → `subscription (OAuth)`, no warning. Probe 2: run one real phase, assert `auth: apiKeySource=…` prints, matches env state, and lands an `auth` event in `logs/run.jsonl`. Unit test `detectBillingMode()` across the four key/creds combos.

---

## 4. M7 verbatim-record layer has no re-quote QUANTITY governor
**Priority 6 · verdict: sharpen · effort: prompt S / detector M · impact high (prompt) / medium (detector)**

**Generality (5-archetype probe): OVERFIT — *confirms* a-priori, and worse than flagged. Redesign before shipping the caution.** Only applies to books with registered documents — and in the two genres where it DOES apply (thriller, cozy mystery), the recurring verbatim document is a DELIBERATE device, so its entire contact surface is *legitimate craft*: the thriller's intercept re-quoted after the antagonist's chapter so every clause flips (dramatic irony); the cozy's exact will-clause re-quoted at the drawing-room reveal (fair-play REQUIRES it). The soft caution would prime paraphrase and kill the recognition beat. **Redesign the caution** to target UNDIFFERENTIATED re-paste only: *"do not re-paste a registered document in full UNLESS the second quotation lands new meaning (dramatic irony, fair-play verification) — re-paste for emphasis alone is the tell."* Keep the detector deferred and have it suppress when the re-quote sits in a new epistemic context.

**Problem.** `register_record`/`read_record` guarantee a re-quote reproduces canonical text verbatim; `findRecordDivergences` (`audit.ts:150-175`) only fires when a record carries ≥2 *distinct* texts (`set.size >= 2`). A record re-pasted verbatim 5× is `set.size==1` → silent by design. The fidelity rail thus made full re-quotation cheap and exact; readers named the climactic-ledger and chimney-physics repetition the book's worst flaw and an AI-tell. **Empirical correction from the maintainer's store probe:** only `owen-last-log-entry`'s head reproduces across 2 chapters in coldwater-m7, none at 3+. The "4×/5×" the humans felt is partly re-paste AND partly a load-bearing-LINE repeated with varied framing — which a body-match detector will NOT catch.

**Root cause.** `audit.ts:150` (set.size guard, silent on `==1`) + `src/prompts/drafter.md:65` ("reproduce its text VERBATIM… only the surrounding prose frame is yours to vary") reads as a license to paste, with no quote-once caution.

**Change.**
- **Primary (ship now):** one line in `drafter.md:65` "Verbatim documents" bullet — *"`read_record` guarantees fidelity WHEN you re-quote; it is not a license to re-paste — a load-bearing document earns one full quotation; later chapters should reference or quote only the load-bearing line."* Restraint-safe guidance, near-zero risk, captures most of the value.
- **Detector (deferred, re-probe-gated):** if built, `findRecordOverQuotes` in `audit.ts` must count **exact normalized full-body reproductions** (collapse whitespace, strip `>` and quote punctuation) of records ≥120 chars across ≥3 chapters → ONE `other`/`low` finding, constants at top. **Do NOT attempt the fuzzy ≥60% contiguous match** — `audit.ts:146` already declined fuzzy prose-locate on principle ("shares no anchor to locate deterministically"); exact-substring preserves the layer's FP-0 mandate. The ≥120-char floor ensures a one-line refrain never trips it.

**Layer.** drafter-prompt (primary) + new exact-substring audit check (deferred).

**Restraint check.** The repetition passes the casual-reader-felt test (named the book's worst flaw). No new category (`other`), `severity low`, `repair_agent: null` — never auto-cuts a deliberately incantatory repetition. The exact-substring + ≥120-char + 3-chapter gates keep FP-0; an intentional single re-quote never trips it.

**Validation.** Prompt: re-run a drafter on a re-quote-heavy chapter, confirm it references rather than re-pastes. Detector (if built): unit test — body pasted verbatim in 3 chapters → one finding; ≤2 → `[]`; a single load-bearing line repeated → `[]`. Re-probe coldwater-m7; cross-check flagged chapters against the human review notes before lowering the threshold.

---

## 5. No INTERVAL-REGULARITY (stride) detector for codas/leitmotifs
**Priority 5 · verdict: sharpen · effort M · impact medium**

**Generality (5-archetype probe): HARM-RISK — *OVERTURNS* my "mostly-generic" a-priori. The single most dangerous proposal; redesign before any part ships.** A chapter-ending running gag on a regular rhythm IS the joke (comic: HIGH severity); a per-POV ending signature IS the rotating-braid form (epic); a rising emotional drumbeat IS the romance — in each, a true positive of the machine is a false positive of craft. And the reader-prompt "mechanical-timer" sentence ships UNCONDITIONALLY, so it harms *even if the detector code is killed*. Its only escape hatch (style.md lean-into enumeration) is the seed-then-enforce judgment agents do unreliably. **Guardrail:** gate BOTH halves (detector AND the reader sentence) behind a repetition-forward suppressor — consult `canon/style.md ## Lean-into patterns` before surfacing; auto-suppress when the brief/genre is declared repetition-forward (comic, voice-forward, refrain-driven); require the cadence to be UNDECLARED to fire. This keeps the genuine catch (an undeclared metronomic "and then the phone rang") while neutralizing the comic/epic/romance false positives.

**Problem.** Both gates test COUNT or CONSECUTIVE runs, never INTERVAL REGULARITY — readers' #1 machine tell. `reader.md:73` scores `stylistic-tic` high only at "8+ chapters of a 16-chapter book" (count); `drafter.md:45` tests only "3+ consecutive" / "2+ of prior 3" (runs). A coda on a near-mechanical timer (every other chapter) is in only 6/12 and skips chapters, so it trips neither. `audit.ts` never reads the craft log at all.

**Root cause.** `reader.md:73` (count-only), `drafter.md:45` (consecutive-only), and no consumer of the whole-book ordered craft-log stride (`read_recent_craft` hands the drafter only the last 3 entries — `drafter.md:90`).

**Change (sharpened — raise the evidentiary bar; prefer reader-helper over a new audit parser).**
- Add the one sentence to `reader.md`'s `stylistic-tic` rubric **regardless** (cheap, restraint-safe): interval-regularity, not just count, can justify escalating an otherwise-medium tic.
- If a detector is built: require **n≥5** occurrences AND **mean-gap ≥2** (real skips, not a solid run — that's the existing `ending-mode-uniformity` case) AND **stdev/mean ≤0.2**, restricted to **`ending_mode` values only** (the closed vocab — verbatim `recurring_construction` strings are too noisy to stride-match). Implement as a pure helper the READER synthesis consults rather than a fresh markdown parser inside `audit.ts` (which today reads only the world store, never `logs/` — adding a parse contract there is real coupling cost). Skip any value in `canon/style.md` `## Lean-into patterns` (mirroring `reader.md:84-88`). **Gate the code behind a re-probe** on the book that exhibited the scheduled-coda tell; if it false-positives on 4-5-point sequences, kill the code and keep only the reader-prompt sentence.

**Layer.** reader-prompt (ship) + optional pure helper consulted by reader synthesis (re-probe-gated).

**Restraint check.** No new category (reuses `stylistic-tic`), `low`, flag-only, lean-into-respecting. The raised bar (n≥5, stdev/mean ≤0.2, ending_mode-only) guards against the statistical fragility of striding over a handful of points in a 12-16 chapter book — which the philosophy rates worse than a miss.

**Validation.** Pure-function unit tests: `coda` at 2,4,6,8,10,12 → flag; at 1,2,3,4 (solid run) → no flag; at 2,5,11 (irregular) → no flag; a lean-into value → no flag. End-to-end: confirm a clean no-op on a legacy project with no `logs/chapter-craft.md`.

---

## 6. No detector for a POV-narrator concealing the engine proposition
**Priority 5 · verdict: sharpen · effort S (detector) · impact medium (contingent on seeding)**

**Generality (5-archetype probe): OVERFIT (narrowest) — *confirms* a-priori. Hold for a 2nd, non-source-book sighting.** This is the source book's exact conceit; inert until `epistemic=true` AND a `concealing` stance is seeded (which agents do unreliably). When it DOES fire it lands on the GENRE ENGINE, not a defect — the cozy's Ackroyd-narrator-is-culprit, the epic's withheld-lineage slow-burn, the romance's unconfessed-love slow-burn — and it cannot distinguish a *working* concealment from a *broken* one. Cheap + `repair_agent: null`, so little harm if shipped, but **hold until a SECOND non-source-book run independently exhibits an over-operated concealer.** If shipped early, harden the finding text: *"verify reads as psychology, not machinery — a well-built concealment is the genre engine, not a defect."*

**Problem.** A first-person POV who holds the book's central answer the whole time (stance `concealing`) is the most fragile reveal there is — the narrator must perform not-saying-it, which collapses into on-the-nose stage directions ("I hold the sentence"). Readers felt it as "a magician narrating keeping a card face-down."

**Root cause.** The schema has the exact discriminator — `STANCES` (`schema.ts:42-43`) defines `concealing` distinct from `wrong_believes`/`unaware`, and `epistemic.ts:49-52` *deliberately* excludes `concealing` from `CHARACTER_BEHIND` (a concealer KNOWS, so it never shows as an irony gap). `ProjectedEntity.pov` and `ProjectedChapter.pov` exist (`project.ts:24,75`). But `dramaticIrony()` only surfaces reader-ahead-of-character, structurally blind to the reader-IS-the-concealer case. And `architect.md` has **zero** epistemic seeding (confirmed: `grep -c record_knowledge|concealing|@reader` = 0).

**Change (sharpened — keep the cheap detector, demote the seed).**
- **Detector (keep):** `findPovConcealment(tables): Finding[]` in `audit.ts`, wired into `continuity-fact-audit.ts` like the others. Collect POV entity ids (`pov===true` ∪ any chapter's `pov[]`); for each, find propositions whose latest live stance is `concealing`; emit ONE `other`/`low` finding per (pov-character, proposition), `repair_agent: null`, framed purely as a structural heads-up: *"a close-POV narrator who holds <prop> must perform withholding — verify the concealment reads as psychology, not a device being operated."* Cheap, FP-0-ish, and **self-silencing**: fires only when `epistemic=true` AND the stance is actually in the store, so it is silent on the 99% of linear books.
- **Seed (separate brief-discipline change, honestly labeled):** add a bullet to `architect.md` instructing the architect — when the brief's engine is a withheld truth a POV holds — to `record_knowledge` that concealer stance up front. **Be honest: without seeding, the detector mostly won't fire**, so impact is medium-at-best and contingent. Per the seed-then-enforce memory, agents do this judgment bookkeeping unreliably, so treat the seed as the real (harder) ask and the detector as a cheap rider.

**Layer.** new audit check (`audit.ts`) + architect-prompt seed (separate, deferred).

**Restraint check.** Binary structural fact ("a pov entity holds stance=concealing on a live proposition"), not a craft verdict — it scores nothing and rewrites nothing. No new category (`other`), `low`, flag-only, `epistemic=true`-gated. The defect is casual-reader-felt, so it threads the needle better than #7. Residual risk (a working concealment becomes noise) is contained by low severity + the low base-rate.

**Validation.** Unit test: a pov-flagged entity holding `concealing` on a prop live across 3 chapters → exactly one `other`/`low` finding citing those chapters; the same entity at `wrong_believes` → ZERO (proves it keys on the discriminator). Integration: re-run a withheld-truth book with `epistemic=true`, confirm the flag the human review independently raised; confirm silence on a linear control.

---

## 7. No cross-POV CONVERGENCE check (one voice in two hats)
**Priority 5 (lowest-confidence keeper) · verdict: sharpen · effort S · impact medium**

**Generality (5-archetype probe): CONDITIONAL — *confirms* a-priori. Lowest-confidence keeper; ship last, probationary.** Inert on the three single/close-third archetypes (nothing to compare); genuinely useful only on multi-POV epic (the form's most-cited weakness) and dual-POV thriller when the brief asserts distinct voices. Risk: "a taste judgment dressed as binary" can nag a deliberately unified house-style/chorus. The empirical anchor (Ellen/Della) is unverified even in the checkout, so it is structurally motivated but evidence-thin. Ship reader-prompt-only behind the default-OFF gate, cap medium, and **PULL on first noise.**

**Problem.** The pipeline measures whether each POV holds its own register over time, but nothing measures whether two distinct POVs converged on one shared observational grammar — Ellen inventorying documents the exact way Della inventories the kitchen. Person/tense/lexicon all pass because the problem is isomorphic observational structure.

**Root cause.** `pov_register` (`tools.ts:128-139`) is same-POV-over-time only (its `describe()` says "voice-drift across chapters for the same POV"). `character-voice-drift` (`reader.md:75`) is defined as one POV drifting from itself. `editor-voice` is single-chapter. A grep for cross-POV/convergence/isomorph returns zero. No phase places two POVs side by side. *(Note: the originating Ellen/Della project could not be pinned in this checkout — the structural gap is real but the empirical anchor is unverified.)*

**Change (sharpened — reader-prompt ONLY, tighter gate, judgment framing).**
Add one step to the `reader.md` synthesis "How to work" list (the one phase that already reads all POVs' register notes — `reader.md:116`): lay the `pov_register` notes side by side and ask one question — *do the POVs differ in OBSERVATIONAL STRUCTURE (what each notices first, how each catalogs a space) or only in surface lexicon?* If they share one observational grammar, surface ONE `character-voice-drift` finding, **framed as "consider whether"** (it is a judgment, not a binary — do not overclaim it as a fact contradiction), max **medium**, `repair_agent: null`, evidence = two short parallel excerpts. Extend the `character-voice-drift` rubric (`reader.md:75`) with one clause covering cross-POV convergence, cap medium. **Gate:** require an EXPLICIT brief/agent-guidance assertion that POVs read as distinct (default OFF) — a unified-chorus or single-frame-narrator book never trips it. **No `tools.ts` describe() change** (that nudge risks over-instructing the drafter toward self-conscious differentiation, a voice cost).

**Layer.** reader-prompt (synthesis step + `character-voice-drift` rubric clause). No code, no new category, no new pass.

**Restraint check.** No new category (reuses `character-voice-drift`), flag-only, cap medium (never a showstopper), `repair_agent: null`. The brief-anchor gate is the escape hatch the philosophy demands. The deterministic style-metric and new-editor-subpass alternatives were correctly rejected (mechanical style metrics sand voice; auto-fixing which voice is "more itself" is taste). **Ship this last and pull it if it generates noise** — it is the lowest-confidence keeper, and the "shared observational grammar" question is a genuine taste judgment dressed as binary.

**Validation.** Re-run reader synthesis on a two-POV manuscript that the brief wanted distinct → expect one medium `character-voice-drift` convergence finding with two parallel excerpts. Negative controls: a single-POV manuscript and a deliberately-unified-chorus brief → zero such findings (confirms the brief-anchor gate suppresses false positives).

---

## 8. Middles sag — name a per-chapter COMPOUNDING MECHANISM + a two-gate tension check  ✅ EXPERIMENTALLY VALIDATED
**Priority 9 (co-highest) · verdict: VALIDATED · effort M · impact high**

**Generality (2-book controlled re-run, 2026-06-25): VALIDATED on the pipeline's HARD case (quiet literary) — the only proposal here proven by experiment, not argued.** Re-briefed two library books changing ONLY the mechanism, re-paneled middles (3 readers each): **Test A** (the-cold-signal — clock re-specified as a deadline that gates an irreversible action; **length-matched 15 vs 15ch, so clean of the length confound**) middle **6 → 7.5–8**; **Test B** (coldwater braid — every withholding chapter must carry an *evolving* displacement object, staggered/rhymed; 18 vs 30ch, length confound) **7 → 8**; both "clearly better," the clock/object discipline held EVERY chapter, and the original's objectless-withholding failure (coldwater ch20) did not recur. The failure mode is genre-independent ("device named, mechanism absent"), so this is not source-book overfit. Caveats: n=3 LLM readers (Test B's uniform 8/8/8 a mild over-praise tell), unedited drafts, Test B length confound un-isolated → re-run B at matched length before treating as fully de-risked.

**Problem.** Middles sag, and the existing weave/thread check cannot see it: it asks "did a thread advance," but **"a thread advanced" is not "tension rose."** The library's saggy middles (Long Tenant ch14, cold-signal's nominal clock, coldwater's objectless ch20) all advanced threads while tension flatlined. The 6-book middle probe showed the books that *escape* sag all carry a per-chapter COMPOUNDING MECHANISM (a narrowing race-margin, an evolving withheld object, a closing knowledge-gap + depleting resource); the ones that dip name a device but never compound it — *"a clock that isn't a deadline is decoration; a circle that doesn't narrow is orbiting."*

**Root cause.**
- **BRIEF level:** the brief template (`templates/novelkit-cdk/brief.md`) collects audience/voice/pace but has NO field for the per-chapter compounding operation, so the architect/plotter have nothing to enforce escalation against. Test A proved a device-in-the-brief is INSUFFICIENT — the original named a 12-day clock and still produced a tracked-but-not-ramping countdown that gated nothing.
- **AUDIT level:** the weave/reader pass (the threads phase + `reader.md`) is single-gate — "did a thread advance" — with no second gate for "is this chapter introducing a NEW fact or merely RE-MEASURING one the reader already holds." Both re-runs exposed the residual the single gate misses: a re-measurement chapter (Test A's inventory chapter; Test B's ch10 "No New Information" re-walking ch07's dock scene) carries a concrete evolving object — passing the object/device mandate — and STILL sags because it re-takes a reading rather than taking a new one.

**Change.**
1. **Brief field (ship now).** Add a `## Compounding mechanism` field to the brief template + an architect instruction: the brief must name the per-chapter operation by which each chapter makes the situation STRICTLY WORSE than the prior one — a deadline that gates an irreversible action; an evolving displacement object performing an accreting withholding; a depleting-resource + closing-knowledge-gap ladder. Naming the *device* is explicitly insufficient. The architect encodes it into `outline/00-chapter-map.md` as a per-chapter "what worsened / what foreclosed" column AND a "which prior chapter's state this advances" column. (Both re-runs' plotters produced exactly this — an Escalation Ladder / Displacement Object Master Key — once told to.)
2. **Forbid re-measurement, as explicitly as objectlessness.** Brief + reader rule: each chapter's worsening must be a NEW foreclosure, not a re-measurement of an established one. Mandate that recurring objects/quantities EVOLVE (gain a state — the note gains a scorch; the log gains a "None"), not merely recur — this is what kept Test B's object-mandate from degrading into a tic.
3. **Two-gate tension-gradient check (reader-prompt + deterministic kernel).** For each (esp. middle) chapter assert BOTH: **(a)** it changes a NAMED fact or recontextualizes a prior one [accretion]; AND **(b)** the fact it changes was NOT already established in a prior chapter [no re-measurement]. A chapter failing (b) is "orbiting / re-measuring" — emit ONE `structural-failure`/low finding, `repair_agent: null`. A one-gate check waves Test B's ch10 through (it passes (a), fails (b)).
   - **Deterministic kernel (the audit's sweet spot):** re-measurement is mechanically detectable in the world store — a chapter whose asserted facts are RE-ASSERTIONS of existing `(entity,attribute)` nodes/values rather than NEW nodes/values, and that registers no new record, is re-measuring. A pure `findOrbitingChapters(tables)` in `audit.ts` flags "this chapter added zero new fact nodes." The judgment half (is a *recontextualization* real vs a re-statement) stays with the reader — the deterministic check only catches the clean no-new-fact case, preserving FP-0.

**Layer.** brief template field + architect-prompt (compounding-mechanism + the two new chapter-map columns) + `reader.md` two-gate rule + optional `findOrbitingChapters` pure detector in `audit.ts`.

**Restraint check.** Reuses `structural-failure` (no new category), flag-only, `repair_agent: null`, and **one-directional toward the project's anti-sterility goal** — it flags STALLING, never brevity or quiet. The deterministic kernel is binary (new fact node or not), the sanctioned-rigor zone. The risk — flagging a deliberately quiet/held beat — is contained because the check distinguishes a quiet-but-ACCRETING chapter (passes gate (a) via a recontextualization the reader judges) from a RE-MEASURING one (no new fact AND no recontextualization): a held breath that recontextualizes passes; only a re-taken reading flags. This is the rare check the experiment shows *raises* engagement without sanding voice — both re-runs improved while staying in the restrained register.

**Validation.** ALREADY DONE (this is the validated proposal): the 2-book controlled re-run above. Remaining: (i) re-run Test B at matched chapter count (18v18 or 30v30) to strip the length confound — Test A already cleared it; (ii) tune `findOrbitingChapters` against the two mech-variant stores (it should flag cold-signal's inventory chapter and coldwater's ch10 and stay silent on the accreting chapters). **Operational note from the runs:** a quantity-tracking brief raises the drafter's fact-bookkeeping load enough to blow the default 50-turn cap (cold-signal-mech ch1 needed 76 turns) — ship this alongside a drafter `maxTurns` bump to ~100.

---

## Restraint guardrail (the through-line)

Every surviving change is one of two safe shapes, and nothing here is a new auto-fix:

- **Detectors/flags** (#2B, #3, #4-detector, #5-helper, #6-detector, #8-orbiting-detector): `repair_agent: null`, low/medium severity, surfaced to the human triager in `findings.json` or the run log. They never edit prose, never cut a quotation, never collapse a chapter. Every one reuses an existing `FINDING_CATEGORIES` value (`continuity-fact`, `structural-failure`, `stylistic-tic`, `character-voice-drift`, `other`) — the enum at `reader.md:53` and `findings.ts` is untouched, so the editor/reader gain no new lever to over-correct toward sterility.
- **Brief/prompt reframes** (#1, #4-caution, #6-seed, #7, #8-mechanism-field): they change what the architect/plotter/drafter/reader are *told*, removing accreted rigor (#1's word floor) or adding one binary question. The single highest-leverage change (#1) REMOVES a hard rule rather than adding one.

The two halves the maintainer flagged as "brief-authoring fixes in pipeline clothing" are split accordingly: #1's floor is authored by the architect agent, not hardcoded; #6's value is gated on the architect seeding the stance; #2 PART A's `asserts` field is dead weight until the architect annotates spine numbers. In all three, the cheap brief-side fix ships and the heavier code is re-probe-gated.

## Code vs. brief-authoring split

**Real CODE / pipeline changes (ship as code):**
- #2 PART B — `findRelationConflicts` in `src/world/audit.ts` + wire in `continuity-fact-audit.ts` (pure code, FP-0, no migration). **Cleanest standalone win.**
- #3 — banner `detectBillingMode()` (`src/billing.ts`) + `system`/`init` branch in `src/agentRunner.ts` + `cli.ts` failure marker.
- #4 detector (deferred), #5 helper (re-probe-gated), #6 detector — all pure functions in/near `audit.ts`.
- #2 PART A — additive `asserts` field in `src/world/schema.ts` (deferred, re-probe-gated).
- #8 — `findOrbitingChapters` (a chapter that re-asserts existing fact nodes and adds none) in `src/world/audit.ts` — deterministic re-measurement kernel, FP-0. **(Validated; follow-on to the brief field.)**

**BRIEF-AUTHORING / prompt changes (ship as prompt edits):**
- #1 — `architect.md` length-handling + `## Chapter target words` template + `plotter.md` quality bar + folded reader/pacing padding question. **(80% of #1's value.)**
- #4 caution — one line in `drafter.md:65`. **(Ship now; safest part of #4.)**
- #6 seed — architect epistemic-seeding bullet (the real, harder ask).
- #7 — `reader.md` synthesis step + `character-voice-drift` rubric clause.
- #5 sentence — `reader.md` stylistic-tic rubric.
- #8 — `## Compounding mechanism` brief-template field + architect chapter-map columns ("what worsened / which prior chapter advanced") + `reader.md` two-gate (accretion AND no-re-measurement) rule. **(Experimentally validated; ship the field + reader rule first.)**

## Do these first (probe-verified shortlist)

The validated win leads, then the three that survived the generality probe:

0. **#8 compounding-mechanism brief field + two-gate tension check** (M, high) — ✅ the only EXPERIMENTALLY VALIDATED item (two controlled re-runs on the hard quiet-literary case: 6→7.5–8 and 7→8). Ship the `## Compounding mechanism` brief field + the two-gate "orbiting/re-measurement" reader rule now; the `findOrbitingChapters` deterministic kernel is a clean follow-on. Bump drafter `maxTurns` to ~100 alongside it.
1. **#3 auth/billing surfacing** (S, high) — UNIVERSAL, zero craft contact surface. The `apiKeySource` init-message branch is nearly free; the banner warning prevents a repeat of the $74 burn.
2. **#2 PART B relation detector** (S–M, high) — UNIVERSAL, pure code, sanctioned binary rigor, no migration. Ship standalone; label the finding *"contradiction OR legitimate relocation"* (the M8 time-varying-attribute caveat the editors under-weighted).
3. **#1 length FLAG** (S, high) — the one-directional padding flag (never punishes brevity). Ship the prompt reframe too, but ONLY with the structural-contract floor — do not let an architect under-build an epic to hit a lower number.

**Redesign before shipping:** **#5** (stride — the most dangerous; gate *both* halves behind a repetition-forward suppressor) and **#4** (verbatim caution — retarget to undifferentiated re-paste only).

**Hold for a second, non-source-book sighting:** **#6** (POV-concealment — overfit to this book's conceit), **#2 PART A** (`asserts` field), and **#7** (cross-POV — ship last, pull if noisy).

> **The deeper lesson logged from the probe:** the transferable product of this whole exercise is the **eval harness** (diverse-archetype panel + adversarial harm-hunt + a-priori confirm/overturn), not the patches. Fewer than half the patches generalize; the harness reruns on any future batch of findings from any future book.
