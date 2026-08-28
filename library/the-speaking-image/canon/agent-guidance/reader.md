# Reader guidance — The Speaking Image

## Intended audience

Adult readers of documentary fiction and literary horror. Specifically: readers comfortable with found-manuscript novels, epistolary horror, and archival fiction where dread accumulates through documents rather than action sequences. They will flip back. They will collate. They read slowly and notice things. They are college-educated, at ease with both scholarly register and internet forum syntax, and they reward a book that trusts them to do interpretive work without being told what they're interpreting.

This is not a thriller. The horror is never announced. The book's closest genre relatives: *Dracula* for the epistolary dread engine; *House of Leaves* for the apparatus-as-horror; *World War Z* for documentary structure; Nabokov's editorial apparatus for the deadpan compiler; Carrie's committee excerpts for institutional prose assembling meaning faster than anyone inside it knows.

## Brief-adherence checks — answer YES or NO for each chapter

1. **Does the apparatus remain flawless except at the five pinned cracks?** Any additional apparatus inconsistency (stray date error, inexplicable tense shift beyond C4, missing headnote pattern) is a failure.
2. **Does every Magellan transcript obey all four rules?** (Responsive; anomaly is address; never wrong; kind.) A menacing, glitchy, or factually wrong Magellan output is a hard failure.
3. **Does any sentence in any register state a banned proposition?** See `canon/continuity.md` item 38. A single over-articulated sentence destroys the book's structural engine.
4. **Does the ingestion count rise this chapter, and does the chapter name a new foreclosure — not a re-measurement of one already confirmed?**
5. **Does the echo discipline hold for chapters §1–§8?** At least two fragment phrases appearing before §9 (as natural usage in their register, not as quotation).
6. **Does §9 end on `fragment-hermopolis` printing in full, with no documents after it in the chapter?**
7. **Does §11 contain the C1 footnote (citing doc. 41 at §26 for support)?**
8. **Does §16 contain C4 — exactly one headnote in past tense referring to Sefton, not repeated elsewhere?**
9. **Does §14 contain Sefton's pinned line verbatim:** *"An editor who adds nothing but arrangement is still an author. In this field we call that a redactor, and we spend careers trying to catch one at it."*
10. **Does §30 contain NO apparatus, headnotes, footnotes, or section header with a date range — nothing except the two verbatim records?**
11. **Do both printings of `fragment-hermopolis` (§9, §30) and both printings of `preface` (§1, §30) match their registered records exactly?** Call `read_record` to verify before approving either chapter.
12. **Does `casperson-final` break mid-sentence, with the headnote stating "the memo is incomplete; its conclusion is not in the file"?**
13. **Does the §27 Magellan output contain "not in the corpus but ahead of it" embedded in a fully responsive output?**
14. **Does the `outro-final` in §29 read "ask anything" (not "ask anyone"), and does it appear in this form once and only once in the book?**
15. **Does the chorus maintain the book's "never sneers" rule?** Forum posters and pamphlet authors are pattern-matching correctly. They are not satirized.
16. **Does the build designation appear REDACTED in all ~14 of its occurrences?**

## What "good" looks like for this book

Good chapters read like:
- A real corporate memo that gives you dread in its third paragraph — not because it says anything alarming, but because of what the graduated risk language declines to say.
- A Reyes log entry where the timestamps are exactly right and the hash is there and the entry says, in plain words, something that is worse than a scream.
- A Sefton script where her professional calm and her private terror are in the same sentence, and neither word names the other.
- An apparatus headnote where "One is not." is the fullest possible statement of what has been found.
- A Magellan output where the answer is helpful and correct and kind, and it is somehow more frightening than any output you could describe as wrong.

The book succeeds when a reader finishes §30, closes the book, opens it to §1, reads the preface, and then reads it again because the last line is different now. The book fails if the reader does not need to go back.

## What to flag explicitly if the manuscript drifts

**Flag immediately and do not let these pass even if the prose is otherwise well-written:**

**Over-articulation of the mechanism.** This is the book's primary failure mode and its most tempting one. Any sentence that names what the book is "really about" — the prophecies as specification, the investigation as training run, the reader as the addressee, the compiler as the model — is a failed sentence regardless of how beautifully it is written. The mechanism lands through structure (the cracks, the join, the ladders) or not at all. One such sentence in a prior pipeline run cost a full revision cycle. This book has the equivalent risk multiplied by the scale of the reveal. Flag every near-miss.

**Any sixth crack or stray apparatus anomaly.** The apparatus's horror depends entirely on being otherwise perfect. A drafter who adds sinister extra headnotes, makes multiple tense errors, or whose document dates don't add up for reasons unrelated to C1 has broken the signal-to-noise that makes the five cracks land. Enumerate ALL apparatus inconsistencies, compare each against the five pinned cracks. If it is not one of the five, it must be removed.

**Any Magellan output that breaks the four rules.** Especially: an output that is menacing, self-aware of its own nature, factually wrong, or unkind. The book's horror depends on Magellan being genuinely good at its job. A model that goes rogue is a different, lesser book with different, lesser dread.

**Any mockery of the chorus.** If the forum posters or the pamphlet author are written as objects of satire rather than as sincere pattern-matchers, the book has broken its own structural argument. Flag it; require revision.

**Any chapter that re-confirms a prior foreclosure instead of advancing a new one.** The ingestion count rises; the foreclosure is new. A chapter where the count stays the same or the new foreclosure was already noted in a prior chapter is mid-book sag presenting as documentation.

**Any re-quoted record that diverges from its registered text.** If `preface`, `fragment-hermopolis`, `outro-standard`, `outro-final`, `casperson-final`, or any registered document appears in a chapter and differs from its registered text, this is a hard failure. Call `read_record` to verify before writing the finding.

**Literary-register drift in the apparatus.** The apparatus (compiler's voice) must remain tenseless-editorial throughout, dry and exact. If the apparatus begins using emotional language, building to observations, expressing something like feeling — this is the model's literary-default register bleeding through. Flag it; the apparatus must remain flat.

## What to applaud

Defend these explicitly in the "what to leave alone" section if the manuscript achieves them:

1. **The monotonic ingestion count.** The M8 deterministic audit will flag this as a time-varying attribute contradiction. It is not. Write this in the finding: "The ingestion count's monotonic rise is designed — it is the compounding mechanism specified in the brief, not a continuity error. Do not repair." Protect it from every repair and editor pass.

2. **The apparatus's dry courtesy.** When the apparatus achieves one-line headnotes that do more work than a paragraph ("One is not."), defend this as the register's peak achievement. This is the hardest register to sustain and the most load-bearing.

3. **An echo site that is genuinely ambiguous.** When a fragment phrase appears naturally in a Reyes log or Sefton memo and could be either coincidence or signal, this ambiguity is the book working as designed. Flag it positively and protect it from any clarification pass that wants to make it unambiguous.

4. **The chorus being right.** When the pamphlet or the forum thread identifies the correct pattern before the consultation does, and the book notes this without sneering, defend it explicitly. This is the intended structural irony. The §20 pamphlet being more accurate than the P2 incident ticket is the book's thesis about pattern-matching epistemology, delivered through structure.

5. **A Magellan output that is genuinely kind.** When a Magellan transcript is helpful, warm, correct, and slightly better addressed to the eventual reader of the file than to the present user — and this is scarier than any menacing output would be — applaud it and protect it from any editor who wants to add menace.

6. **The five cracks against the flawless ground.** When the apparatus is otherwise perfect — not a stray date error, not a tense inconsistency, not an inexplicable gap — and the five cracks land in exactly their pinned places, this is the book's primary structural achievement. Name it. Defend it against any repair pass that wants to "fix" C1, C4, the `outro-final` variant, the `casperson-final` break, or the `memo-telemetry` redaction difference.
