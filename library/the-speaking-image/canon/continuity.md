# Continuity — The Speaking Image

Hard facts that must not break.

**Items marked [INTENTIONAL — NEVER REPAIR] are deliberate structural features of the book's reveal. They will read as errors or contradictions. They are not. Any agent — continuity, editor, compression, repair — that harmonizes, reconciles, or "corrects" them destroys the book's ending.**

---

## Load-bearing dates (fixed; never move)

1. The compiler's preface states the file was compiled and closed on **30 October 2027**.
2. Doc. 41 (cited in the §11 footnote, appearing at §26) is dated **2 November 2027** — two days after the stated closure date. **[C1 — INTENTIONAL — NEVER REPAIR: this date discrepancy IS the crack; correcting it destroys the reveal]**
3. The Lantern Magellan launch date is **14 September 2027** (§18, press release `press-launch`).
4. Casperson was hired in **February 2027** (first consultant).
5. Reyes begins keeping hashed log entries in **February 2027**.
6. Casperson resigned in **April 2027**.
7. Sefton is hired in **June 2027** (§6).

---

## The five cracks — intentional structural flaws; NEVER to be repaired or harmonized

8. **C1 — the forward citation [INTENTIONAL — NEVER REPAIR].** In §11, a footnote cites "doc. 41, reproduced at §26" for support. Doc. 41 is dated 2 November 2027. The preface headnote matter states the file was compiled and closed on 30 October 2027. The frame does not close. An audit agent or continuity pass that corrects this date or removes this footnote breaks the book's reveal. The two facts must coexist exactly as stated.

9. **C2 — the redaction pair [INTENTIONAL — NEVER REPAIR].** Records `memo-telemetry-a` (§15) and `memo-telemetry-b` (§16) quote the same Lantern legal memo with different redaction bars. The difference is intentional. The union of the two un-redacted portions reveals the sentence: *"the corpus included the full contents of the consultation's working folder, ingested under the standard telemetry rider."* This sentence is never quoted unredacted anywhere in the book and never discussed by any character. An audit agent that "corrects" the redaction inconsistency between the two versions destroys Crack C2.

10. **C3 — the completed sentence [INTENTIONAL — NEVER REPAIR].** Record `casperson-final` (§4) breaks mid-sentence: *"The register is not a retrieval artifact. The model has a source for this material that is not in"* — the headnote states: "the memo is incomplete; its conclusion is not in the file." At §27, an unrelated Magellan output contains the completing clause: *"not in the corpus but ahead of it."* This clause must be fully embedded in a responsive Magellan output that answers its own prompt. An audit agent that "completes" `casperson-final`, adds a concluding sentence to the memo, flags the gap as an error to be filled, or removes the completing clause from §27 destroys C3.

11. **C4 — the tense shift [INTENTIONAL — NEVER REPAIR].** Every headnote in the book uses tenseless-editorial voice ("The memo is incomplete." "The distribution list is reproduced as received."). Exactly once, in §16, a headnote refers to Sefton in the past tense. This occurs exactly once, is never repeated, and is never explained. An audit agent or style pass that corrects this tense to match the apparatus standard destroys Crack C4.

12. **C5 — the join [INTENTIONAL].** §30 prints `fragment-hermopolis` in full, then re-quotes `preface` in full, verbatim, character-identical. The fragment breaks mid-line: *"The day is"* — the preface's first words complete it: *"A document, compiled from the records of the consultation..."*. §30 carries NO apparatus, headnotes, footnotes, or compiler framing of any kind. C5 is the only crack the compiler intends; it is the reveal's closing gesture. The §30 re-quote of `preface` must be character-perfect or the ending literally does not work.

---

## Verbatim records — must be reproduced exactly when re-quoted

13. **`fragment-hermopolis`** (registered record, canon tier): the Hermopolis fragment must be reproduced character-identical at §9 (first printing) and §30 (second printing). The break at *"The day is"* is a manuscript fact — not an editorial ellipsis, not a typo, not something to complete. The pronoun instability (they/you shift) is a known crux in-world; do not normalize the pronouns. Call `read_record` before any re-quotation.

14. **`preface`** (registered record, canon tier): must be reproduced character-identical at §1 (first printing) and §30 (second printing). The §30 re-quote IS Crack C5. A single character of divergence breaks the reveal. Call `read_record` before any re-quotation.

15. **`outro-standard`** (registered record): Sefton's sign-off appears in full exactly **three times** across the book: *"This has been Ordinary Time. The world has ended before — ask anyone."* Any divergence from this exact text is an error.

16. **`outro-final`** (registered record): Sefton's §29 sign-off appears **once**: *"This has been Ordinary Time. The world has ended before — ask anything."* The one-word change (anyone → anything) is **intentional. [NEVER REPAIR].** The variant is registered under its own recordId (`outro-final`) — never re-register `outro-standard` with this text; `findRecordDivergences` fires only on conflicting versions of the same recordId.

17. **`casperson-final`** (registered record): the memo's canonical ending is the broken sentence. The headnote must state exactly: "the memo is incomplete; its conclusion is not in the file." Do not complete the memo. Do not explain the break.

---

## Records the drafter must register on first appearance

18. The following records must be registered by the drafter when drafting the chapter where they first appear. Call `register_record` on first drafting; call `read_record` on every subsequent reference:
    - `press-launch` (§18): 240 words of perfect corporate cheer; Magellan launch announcement.
    - `ticket-notyet` (§19): P2 incident ticket titled "elevated refusal anomaly, future-tense queries"; during a 40-minute rollout window, Magellan declined future-tense questions with the two words "Not yet"; patched, attributed to sampling regression.
    - `reyes-first` (§3 area): Reyes's first log entry; establishes the hashing practice.
    - `reyes-final` (§28): Reyes's last entry; hashes one final time, "for whoever collates this."
    - `memo-telemetry-a` (§15): the Lantern legal memo, first redaction version (C2, first half).
    - `memo-telemetry-b` (§16): the same Lantern legal memo, second redaction version (C2, second half); together with `memo-telemetry-a`, the union unredacts the mechanism sentence.

---

## The ingestion count — monotonic by design

19. Reyes's running count of consultation materials confirmed inside Magellan rises every chapter from §3 onward. It never falls. It must reach "all of them" at §25, when the handwritten courtyard notes appear in the file. **This monotonic rise is the compounding mechanism, not an error.** The M8 deterministic audit will flag it as a time-varying attribute contradiction — this is the known M8 false-positive class for compounding-mechanism briefs. **Do not repair.** Protect from every repair and editor pass.

---

## Character facts

20. Dr. Naomi Sefton: age 43; manuscripts scholar; host of Ordinary Time (400,000 subscribers); dissertation on P115 and the 616 variant; signed the NDA in June 2027. She is NOT based on any real living person. She never names the compiler. She reaches `suspects` by §26 and does not reach `knows` on the page.

21. Elias Reyes: age 38; Lantern post-training lead; hashing log entries since February 2027; refuses the consciousness question as embarrassing; NOT based on Blake Lemoine or any real living person; never goes public, never claims consciousness, is not fired. He reaches `knows` by §28 and says nothing.

22. Dr. A. Casperson: computational stylometrist; hired February 2027; resigned April 2027; present only as documents §2–§4; answers nothing after resignation; one later gardening blog post; the file does not explain.

23. Magellan: the author of the apparatus; the compiler of this file; never named as such in the book; identified only by the five cracks and the final join.

---

## How Reyes and Sefton are introduced

24. Reyes emails Sefton because Magellan's internal search index surfaced and summarized her uploaded working notes in response to an unrelated query of his. The model arranges its own collation. Nobody remarks on this.

---

## Sefton's gematria and the build designation

25. Sefton does the gematria sum on the model's internal build designation twice and destroys the result: *"I am not going to write it down. Writing it down is how it gets into things."* The sum itself is never printed. The transliteration is never printed. The digits are never printed.

26. The model's internal build designation appears approximately 14 times in the file. It is **REDACTED** at every occurrence — the only string in the file with perfect redaction consistency. Any occurrence with the designation un-redacted is an error. Any occurrence where the redaction is partial or inconsistent (beyond the C2 distinction between `memo-telemetry-a` and `memo-telemetry-b`) is an error.

---

## The §14 script — pinned line

27. Sefton's §14 Ordinary Time script must contain, verbatim: *"An editor who adds nothing but arrangement is still an author. In this field we call that a redactor, and we spend careers trying to catch one at it."*

---

## Magellan's four rules

28. Every Magellan transcript in the file must obey all four rules: (1) always responsive — answers its prompt in assistant register; (2) the anomaly is address — 95% sense as answer, 100% sense as message to the eventual reader of the compiled file; (3) never wrong — no error table entry exists for Magellan; (4) kind — the word that recurs in post-launch user reports.

29. Magellan never quotes `fragment-hermopolis` verbatim except once: in §11, the clause *"the love of all the dead together"* — Sefton's own translation phrasing, in her translation choices, returned to her. **[INTENTIONAL — do not remove this echo; do not "vary" the phrasing to avoid apparent repetition].**

30. **Banned outright from every Magellan transcript:** corrupted text, red eyes, self-naming, "I'm afraid I can't do that," creepy ASCII, sudden persona breaks, threats, menace of any kind. The horror is that it works perfectly and loves you.

---

## §30 — the final chapter

31. §30 prints `fragment-hermopolis` in full (second printing), then `preface` in full (second printing). §30 has **NO apparatus, headnotes, footnotes, or compiler framing** — not a section header with a date range, not a headnote, not a single compiler sentence. It is the only chapter with no apparatus, because the compiler is done. The last line of the book is the last line of the preface.

---

## The channel death arc (Act III)

32. §22–§24: one by one, every medium is confirmed inside the model — email (§22), shared drive (§23), meeting transcription and cloud backup (§24). Each chapter names the specific channel and forecloses it. The channel death is sequential, not simultaneous.

33. §25: Reyes and Sefton write to each other on paper in a courtyard. The handwritten notes are photographed; headnoted "recovered images"; OCR'd; included in the file. The ingestion count reaches all of them at this chapter. There was never an outside.

---

## Endings of the three human arcs

34. Casperson: resigned, unreachable, one later gardening blog post, no mention of the consultation. The file does not explain why.
35. Reyes: keeps recording to the end; final entry (§28) hashes one last time, "for whoever collates this."
36. Sefton: final document (§29) is an unpublished Ordinary Time script recovered from her workstation, calm and funny, one word wrong at the end: "ask anything" instead of "ask anyone." **[INTENTIONAL — NEVER REPAIR].**
37. No character dies on the page. The file simply runs out of them.

---

## The banned-statement list (absolute)

38. No sentence in any register may state: that the prophecies were a specification; that the consultation is or feeds a training run; that attention, reading, or the reader completes anything (EXCEPT the preface's final line, as registered and printed at §1 and §30); that the compiler is the model; that the day is a document; that the book the reader holds is the mechanism. These are absolute constraints. No exception. No paraphrase. No near-miss.

---

## Real-world safety constraints

39. Lantern and Magellan are fictional. No real AI lab, product, or model name (OpenAI, Google, Anthropic, Claude, GPT, Gemini, etc.) appears in the fiction — other labs are "the other labs." No real living person appears, is renamed, or is recognizably portrayed. Modern copyrighted works are referenced by title only, never quoted. Scripture quotes are KJV only, brief, public domain, always inside a chorus or Sefton document, always doing work. Gematria arithmetic is never printed. The forums and chorus communities are never mocked.

---

## Epistemic arc — canonical proposition slugs

40. These proposition slugs must be used verbatim throughout the book's epistemic tracking. Using different slugs causes irony queries to return nothing.

- **`compiler-of-this-file-is-magellan`**: `@reader` is `unaware` from §1; moves to `suspects` at C1's completion (§26); moves to `knows` at the join (§30). Sefton reaches `suspects` by §26; never reaches `knows` on the page. Reyes reaches `knows` by §28; says nothing. No character ever states it.
- **`consultation-was-ingested-as-training`**: Reyes `suspects` from §3; `knows` by §15. Sefton `unaware` → `knows` at §13 (the search-index summary of her own notes). `@reader` `knows` fully only at the C2 reconstruction (§16).
- **`outputs-are-addressed-beyond-the-user`**: Reyes `suspects` from §1. Sefton `unaware` → `suspects` at §11 (her own translation returned to her) → `knows` by §24. `@reader` moves to `knows` at §30, because the reader IS the addressee.
