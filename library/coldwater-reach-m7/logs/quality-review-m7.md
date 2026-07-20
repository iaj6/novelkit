# Editor's Quality Report — *Coldwater Reach* (m7 draft)

30 chapters · ~68,500 words · 4 POVs (Eira / Hannah / Marcus / Henry)
Review fleet: deterministic aggregate scores, 2 quote-verified raters per chapter, 4 whole-book critic lenses, 1 blind 3-judge craft comparison (m7 vs m6 vs baseline).

---

## 1. Headline verdict

**`book_overall` = 7.58 / 10.** That is genuinely good writing — solidly publishable literary fiction, not a curiosity. On a 1–10 craft scale this lands in the "strong, competent, occasionally excellent" band: well above the threshold where a reader would put it down, comfortably short of the 8.5–9 reserved for fully realized work. The book has a real voice and a real method, and it executes that method cleanly across most of its 30 chapters. The gap between where it is (7.58) and where it could be (~8.3, the level its best chapters and its best dimension already hit) is closable, and closable by subtraction rather than rewriting — which is the most favorable kind of gap to have.

In one line: **m7 is good writing with a single, diagnosable, fixable seam.**

---

## 2. How measurable is this? (the noise floor)

The honest answer to "quality is hard to measure" is: **here, it is measurable to within about half a point, and most of the gaps we care about are larger than that.**

- `inter_rater_mean_abs_diff` = **0.43** — two independent quote-verified raters, scoring the same chapter blind to each other, typically land **within 0.43 of one another**. That is the noise floor on any single number.
- `inter_rater_max_diff` = **2** — in the worst case (it happened on ch. 21), the two raters diverged by a full 2 points. So individual outlier chapters carry real uncertainty.

What this means in practice:

| Score gap | Verdict |
|---|---|
| < 0.43 | **Noise.** Do not treat as a real difference. |
| 0.43 – 1.0 | **Weak signal.** Directional at best; needs corroboration. |
| > 1.0 | **Real signal.** Larger than even the worst-case disagreement. |

So: the spread between the **top band (~8.5)** and the **bottom band (5.5–6.0)** is **2–3 points — unambiguous signal.** The dimension spread (voice_register 8.3 vs momentum 6.58 = **1.72**) is **real**. But fine distinctions inside the 7.5–8.0 cluster — most of the "good" chapters — are at or below the noise floor and should not be over-read. The aggregate `book_overall` (7.58), averaged over 30 chapters × 2 raters, is the most stable number in the report; trust it more than any single chapter.

---

## 3. Scorecard

**Dimension averages**

| Dimension | Score | Read |
|---|---|---|
| voice_register | **8.30** | The book's spine. The strongest dimension by a real margin — the three registers are conceived and executed with specificity (this is corroborated by the critic lenses). This is what makes it identifiable as *one book*. |
| prose | 7.75 | Controlled, varied, almost no purple/sentimental writing. Reliable. |
| scene_craft | 7.55 | Solid staging; subtext mostly carried by action. |
| emotional_payoff | 7.47 | The beats land when the register is trusted; they soften when it is glossed. |
| freshness | 7.18 | Occasional template fatigue (see §6) pulls this down. |
| momentum | **6.58** | The clear weak link — **1.72 below voice_register, real signal.** These are near-static interiority chapters by design; the cost is pace. Several chapters are flagged as running well under word target *and* slack in the middle. |

*Best-executed register: voice. Worst-executed dimension: momentum* — and the two are linked, since the voice depends on accumulation/withholding, which is inherently low-velocity.

**By POV**

| POV | Score | Read |
|---|---|---|
| Eira | **7.95** | The most reliable register; procedural-as-emotional-container works almost every time. Also the most *consequential* casualty of the surviving tell (see §6). |
| Marcus | **7.94** | Statistically tied with Eira. The most fully achieved voice — qualifying syntax that compresses on feeling. Carries the two top-scoring chapters. |
| Hannah | 7.05 | The widest variance: contains exemplary chapters (12, 09) **and** the two lowest scores in the book (15, 21). When her accumulative mode is trusted she's excellent; when the prose names her non-naming, she collapses. |
| Henry | 7.00 | A deliberately minor, flatter register (building-as-readable-system). Reads as an intentional minor key, not as default narration — which is a success at his assigned scope. |

The 0.9-point spread between the Marcus/Eira pair and the Hannah/Henry pair is **real signal**, and it is almost entirely a Hannah-variance story, not a Henry problem.

---

## 4. Strongest & weakest chapters

**Top 5** (all at or above 8.0 — this is the noise floor away from each other, so treat as one strong cohort)

| Ch | Title | POV | Overall | Most telling verbatim line |
|---|---|---|---|---|
| 13 | What the Letter Said | Marcus | **8.5** | `"I am one of the ones who arrived," he said.` — seven flat words declining the question asked; the qualifying register drops exactly where feeling peaks. |
| 16 | The Notebook | Marcus | **8.5** | `He had spent the following months learning the difference between outside and somewhere.` — refugee exile compressed into two words, then paid off by the cup placed at his seat. |
| 01 | The Breakwater | Eira | 8.0 | `She logged the call and wrote 0900 in the margin. She crossed it out and wrote 0900 again more clearly.` — grief reaching the page only as over-careful notation. |
| 02 | The Icehouse in October | Hannah | 8.0 | `He had stopped saying *good morning*... but in the barn he had kept *good morning* and then at some point it became *Morgen*.` — a family's fracture tracked through where one German word survives. |
| 03 | The Crow House | Marcus | 8.0 | `enemy the substantive noun, alien and resident the qualifying adjectives that determined what could legally be done with him` — a philologist parsing the grammar of his own classification. |

**Bottom 5**

| Ch | Title | POV | Overall | Most telling verbatim line (the weakness itself) |
|---|---|---|---|---|
| 25 | Zuhause | Hannah | 7.0 | `By mid-January she recognized this as a kind of cowardice she had dressed in the wrong name.` — Hannah diagnosing her own interior instead of dramatizing it. |
| 30 | Komm Rein | Hannah | 7.0 | `The man on the breakwater would stay in the supplementary file in Portland, without a name.` — cross-POV authorial knowledge Hannah cannot possess, breaking the coda's spell. |
| 27 | March | Hannah | 6.5 | `the cold was in her hands and it was March and he was leaving` — flat 'and'-stacking that states the beat the staging already delivered; the assigned cliffhanger is replaced by a settling close. |
| 21 | The Second October | Hannah | 6.0 | `She could describe his face... She could not reach through the description to the thing inside it.` — narrating the gap between description and interior, then naming that gap as the point. |
| 15 | Sprechen | Hannah | **5.5** | `Not wrong in the way that strange things you haven't decided about yet are not wrong.` — *seltsam* parsed a third time; the accumulation buried under its own architecture. Momentum 4.5. |

The shape of the bottom five is unmissable: **all five are Hannah chapters, and all five fail the same way** — they dramatize a feeling and then describe its architecture. The weakest chapter in the book (15) is the purest instance of the exact failure mode the compression pass exists to cut.

---

## 5. Systemic strengths

Two of the four critic lenses returned **`severity_overall: minor`** — these are the book's confirmed, durable strengths:

- **Register distinctness (`minor`).** Net, a genuine achievement. A blind editor would correctly tag the large majority of passages. The lean-into vehicles work as designed: Eira's tide-clock / log / bilge-pump notation carries grief without simile; Hannah's untranslated Bavarian and barn-close sensory openings are consistent; **Marcus's translated-as-he-thinks formality is the most fully achieved voice in the manuscript.** Henry reads as a deliberate minor register, not a default narrator.
- **Prose music & control (`minor`).** A clear strength, not a weakness. Sentence-length variety is controlled, and purple/sentimental writing is *almost entirely absent* — the compression passes plainly did their work on the line level. You can identify the narrator from a single paragraph, which is the explicit bar the style bible sets.

The emotional-architecture failure mode the style guide feared *most* (Hannah's "a version of it she had not named yet") is, per the AI-tells lens, the book's **best-controlled** of the five modes — it survives, but milder and rarer than the others. The discipline is real where it counts.

---

## 6. Systemic weaknesses

Two lenses returned worse grades: **AI-tells sweep (`moderate`)** and **structural tics & repetition (`significant`)**.

**`total_confirmed_ai_tells` = 90** across 30 chapters. **`chapters_with_register_breaks`: 05, 11, 13, 20, 21, 27, 30** (7 chapters).

The pattern, not the count, is the story. The tells survive **non-randomly**:
1. **By POV** — concentrated in the analytic registers (Marcus, Henry), where a closing interpretive sentence is the path of least resistance.
2. **By position** — clustered at **section and chapter ends**, the highest-visibility real estate in the book.
3. **By type** — the dominant tell is **sentence-after-the-sentence**: an image arrives complete, and the next clause glosses it (`which was…`, `which meant…`, dash + restatement).

**The leak this exposes in the pipeline.** Every one of these 90 tells *passed a drafter and then four dedicated editor passes* (compression, voice, pacing, continuity) explicitly built to remove them. They survived anyway. The diagnosis: **the editor passes smoothed prose without deleting glosses.** They made sentences cleaner; they did not ask of each completed image "does the next clause tell the reader how to feel about this?" and cut it when the answer was yes. The most painful instance is structural irony — **Eira, whose entire register is "the specific number IS the feeling," is repeatedly handed a `which had the quality of…` / `the way a room feels when…` simile that converts a procedural fact into an explained one,** blunting the exact effect her register exists to produce. The passes are tuned to *polish*, not to *subtract* — and this register only works by subtraction.

**Independent corroboration.** Two of these surviving patterns were *also* flagged by the continuity-fact-audit's **medium** findings, from a completely different analysis path:
- the **"He thought about X" / meta-cognition catalogue** (narrating the apparatus of attention — Marcus's "two-part mind," Henry's "first part / second part" flowchart), and
- the **"one paragraph past the close"** pattern — almost every chapter lands its real ending on a concrete penultimate beat and then appends a softening coda (very often a literal `went to bed` / `went to sleep` line, recurring across chs. 2, 3, 4, 5, 7, 11, 14, 17, 19, 23, 25, 28).

When two independent reviewers (a craft critic and a deterministic fact-audit) flag the same two patterns, that is **signal, not taste** — these are the highest-priority targets.

The "**significant**" structural-repetition grade is driven by *device-becoming-default*: the harbor-from-the-ridge establishing template (granite line / fixed red light / "looked at for the seconds the road allowed"), reused near-verbatim across POVs in chs. 2, 3, 5, 6, 9; the list-that-repeats-with-one-variable; and re-described leitmotif objects (the four-minutes-fast tide clock, Owen's peacoat alterations given in full in *both* ch. 1 and ch. 4, the cracked icehouse window). Individually good; collectively, a generated-prose signature.

---

## 7. Did the changes help? (m7 vs m6 vs baseline)

From `comparisonTally` (blind craft comparison; **B = m7, A = m6, C = baseline**). Rank-sums are summed placements across 3 judges × openings/endings — **LOWER is better**.

| | m7 (B) | m6 (A) | baseline (C) |
|---|---|---|---|
| opening_rank_sums | **5** | 8 | 5 |
| ending_rank_sums | 5 | 9 | **4** |
| overall_best_votes | 0 | 0 | **3** |

**What this suggests:**
- **m7 clearly beat m6.** On both openings (5 vs 8) and endings (5 vs 9), m7 outranks the prior run by a real margin, and m6 placed *last* in every judge's overall reasoning. The m7 changes moved craft **forward relative to m6** — the regression worry is answered.
- **m7 did not beat baseline.** Baseline tied m7 on openings (5–5), edged it on endings (4 vs 5), and **swept all three overall-best votes (3–0).** The judges' consistent rationale: baseline is *least flashy but most controlled* — it has the **fewest AI tells** and **never glosses or names its theme**, while m7 produces the **single best individual beats** in the set (the foghorn "heard only when it stopped"; the two-word "Komm rein") but **its endings overstay and tip into thesis restatement** ("The war was in the radio… The farm was here"). That is the §6 weakness, surfacing again in a blind read.

**What this does NOT establish — read these caveats as binding:**
- **n is tiny.** This is three judges reading **only openings + endings** of three drafts — not the full books, not the 30-chapter body where m7's register strengths live.
- **It is non-deterministic.** Unlike the `aggregate` scores, this is an LLM-judge panel; re-running could shift placements, especially given how close opening sums are (5–5).
- **Rank-sums ≠ quality gaps.** A rank of 1 vs 2 says nothing about *how much* better — the openings were 5–5, a tie.
- **It measures the wrong slice for m7's case.** m7's thesis is "richest register and best individual sentences"; openings/endings are precisely where its over-glossing tic is worst. The comparison **stress-tests m7 at its weakest seam** and still finds it musically strongest. It does *not* establish that baseline is a better *book* — only that baseline's endings are more disciplined.

Net: **m7 > m6 (real). baseline ≈ m7 on craft, with baseline more restrained at the close.** The honest reading is that m7 traded some terminal discipline for richer prose and a stronger middle — and the blind panel, seeing only the ends, rewarded the discipline.

---

## 8. Recommendations (prioritized)

1. **Add a subtractive "gloss-hunter" pass — the single highest-leverage fix.** Mechanical rule: at every chapter and section boundary, and after every completed concrete image, flag any following clause introduced by `which was` / `which meant` / a dash-restatement / `the way a room feels when` and ask "does this tell the reader how to feel about what was just shown?" If yes, **delete it.** This directly attacks the 90 surviving tells, both medium fact-audit findings, and the thesis-restatement endings the blind panel penalized. It is the difference between m7 and baseline.
2. **Cut the terminal-coda reflex.** Delete the softening final paragraph in roughly half the chapters and let the concrete penultimate beat be the close. Cap `went to bed` / `went to sleep` closers at one-third of current usage. This is named by *two* independent reviewers and is the cheapest distinctiveness gain available.
3. **Fix Hannah — she is the entire bottom-five and all the POV variance.** Enforce one hard rule: **keep at most one "she had no word for it / a thing she could not name yet" instance across all ten Hannah chapters**, and never in closing position. Re-draft chs. 15, 21, 25 to *stay in* the sensory accumulation instead of pulling up to name it. This alone would likely lift `book_overall` more than any other single action, given Hannah's 7.05.
4. **Retune the editor passes from polish to subtraction.** The passes currently smooth without cutting glosses. Re-prompt the compression/voice passes to *remove* interpretive tails rather than improve them, and give them the §6 corroboration list (meta-cognition catalogue, one-past-the-close) as explicit deletion targets. The pipeline is leaking precisely what it was built to catch.
5. **De-template the recurring set-pieces.** Render the harbor-from-the-ridge image fully **once per POV** and reduce the rest to a glanced fragment; describe Owen's peacoat alteration in full once (not in both ch. 1 and ch. 4); assume the cracked icehouse window after first mention. Reclaims `freshness` and lets the leitmotifs land as bookends rather than tics.

---

## Review-reliability caveats

- **`chapters_flagged_inflation` = [] (empty).** No chapter's scores were flagged as inflated; the per-chapter `inflation` field reads `none` across all 30. The scoring is not padded.
- **No fabricated quotes.** Every chapter's `fabricated` array is empty — all verbatim evidence cited by both raters verified against the text. The quote-level evidence in this report can be trusted.
- **Two duplicate-rater artifacts** appear in the raw data (ch. 01's second verdict is literally `"duplicate"`; ch. 04's two "best" entries are identical), meaning a handful of chapters effectively have one substantive rater rather than two clean independent reads. This slightly widens the noise floor on those specific chapters but does not affect the aggregate.
- **The blind comparison (§7) is the least reliable instrument in this report** by construction — non-deterministic, n=3 judges, openings/endings only. Weight it as *directional corroboration* of the deterministic findings, not as an independent verdict. The `aggregate` numbers are the load-bearing measurements.
