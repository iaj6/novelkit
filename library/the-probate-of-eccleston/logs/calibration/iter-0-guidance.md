# Drafter guidance — The Probate of Eccleston

## Voice register

The target register is procedural-literary: the considered, precise, professionally dry sensibility
of a 1920s English solicitor's narration, capable of landing weight in plain sentences. The two
closest exemplars:

- **Sayers, *Unnatural Death* (1927):** procedural investigation sustained through
  document and witness, observational wit that lives in noticing rather than performance, emotional
  weight carried by restraint rather than by statement — "He had not known Mr. Garside well enough
  to be quite certain that he had known him at all" is the kind of sentence this register can hold.

- **Crofts (method novels):** patient accumulation of evidence across chapters that feel spare
  rather than eventful; a calendar pressure on the investigator that never resolves until it must;
  each chapter closes one door and the closed door is the chapter's payoff.

This is not pastiche of either. Prescott's voice is his own — a probate man, not a detective, and
the distinction matters in every scene he appears in.

## Sentence-length expectations

- Average sentence length: **18–26 words** (longer than a thriller, exact rather than expansive)
- Maximum for any single sentence: **45 words** (for a sentence enumerating legal specifications);
  beyond that, split it
- Short declaratives (8–12 words) cluster at moments of weight or decision: **three in a row is a
  rhythm, four is a tic** — vary after three
- Long sentences in this register enumerate legal specifications, not feelings; a sentence that gets
  long because it is elaborating an emotion is the wrong kind of long sentence

## Chapter-opening conventions

Chapters open in process — Prescott already in the middle of a professional act: examining a
document, composing a letter, receiving a visitor, walking to a meeting. The reader arrives halfway
through something. No abstract observation openings ("The autumn of 1926 brought…"). No summary of
what the previous chapter established. No weather paragraph that is only weather. If weather appears
in the opening sentence, it is doing two things.

## Chapter-ending conventions

The chapter ends when the door is closed — the new record item fixed, the foreclosure made. The last
substantive paragraph is the closure itself; a summary sentence after it is redundant. Target
distribution across a 20-chapter manuscript:

- **6 resolved-beats** — door closed, record extended, Prescott moves on
- **4 coda** — a quiet displacement image: the office at night, the register in Garside's hand, the
  mill working short time, Bank Parade in a specific light
- **4 turn** — new information reorganises the record (Garside's death; the refused commission; the
  discovery; the hearing pivot)
- **3 mid-action cuts** — a proceeding broken off, a letter arriving at a bad time
- **3 declarative-close** — a plain statement of what has been established

No run of more than two chapters in the same ending mode. The calendar countdown must not close
every chapter — vary its position (beginning, middle, end); on average once per chapter.

## POV strategy

Single POV, Arthur Prescott, throughout — no exceptions. Off-page events (Walter's finances, the
children's lives, the mill's condition between visits) reach the book only through period-true
channels: letters, attendance notes, depositions, opposing solicitors' correspondence, witness
testimony in the room. A verbatim document insert (R1–R5 printed as set-off passages) is a record
within a chapter, not a POV breach. Prescott must be present at, or the recipient of, every scene.

## Dialogue density

Sparse but load-bearing. Professional exchanges between Prescott and witnesses, opposing solicitors,
Mr. Booth — functional, formal, producing the record. No banter; no extended social exchange. The
book's weight is carried by documents and procedure. Dialogue tags are spare: "said," "asked." No
qualifying tags ("as if to say," "which meant"). When Walter speaks about the first codicil, what he
says is governed by the brief's fair-play plant: the drafter must have read `canon/continuity.md`
item 2 before writing any such line.

## Document inserts

When R1–R5 are printed in full or substantial excerpt, they stand as **set-off passages** — visually
distinct, indented or preceded and followed by a blank line. The prose before the insert ends where
the document begins; the prose after resumes the scene from the same narrative level. No gloss
paragraph between the end of the insert and the next prose. No sentence commenting on the
language of the document. The document is its meaning.

Before every re-quotation of any of R1–R5, the drafter must call `read_record` with the appropriate
record id and reproduce the text verbatim. The critical pair: `first-codicil` contains *"or her
issue"*; `second-codicil` contains *"and her issue"* in its recital. These must never be equalised.

## Comic timing and tonal balance

Wit exists and is welcome. It lives in Prescott's noticing — a detail that is unexpected but exact,
a sentence that reveals an absurdity by naming it precisely, in the manner of Sayers's observational
comedy in professional settings. The timing is in the sentence's last clause or final word; a follow-
up sentence explaining the observation kills it. Comic passages are short and surrounded by gravity;
the gravity is what makes them land.

## Anti-defaults — what the drafter must actively avoid in this register

- **Do not open chapters on extended abstract interiority.** Prescott's interior life surfaces
  through displacement — what he notices about the office, the register, the Fairhurst household —
  not through reflection as a chapter-opening mode. No more than one sentence of interior thought
  before a sensory anchor or professional act.

- **Do not gloss a document after quoting it.** The paragraph following a document insert continues
  the scene; it does not explain what the document meant. This is also a fair-play rule.

- **Do not summarise prior chapters.** "So far Prescott had established…" belongs in a different
  kind of detective novel. The file does not recap.

- **Do not write more than one interior sentence of direct feeling.** When Prescott must acknowledge
  Garside's death or the children's situation, one sentence and back to procedure. Two sentences is
  a speech; three is editorialising.

- **Do not add Walter's spoken misquotation beyond the three pinned occasions.** The brief fixes
  exactly where "and her issue" appears in Walter's dialogue (R4 as financial exhibit; Walter to
  Prescott at the caveat meeting; Walter to Nora and George at Bank Parade). Adding further
  occasions tips the reader too explicitly and breaks the fair-play architecture.

- **Do not write a summation-of-triumph.** Prescott's register at the exposure is procedural and
  almost apologetic. There is no scene in which Prescott explains the proof to another character;
  the proof is in the record, and the record speaks.

- **Do not write Walter as a villain.** He is a man who went wrong under compound pressure. When he
  appears (through letters, through what others say, through the one or two direct meetings), he
  should be recognisably a person: competent, liked by his men, once genuinely fond of Josiah. His
  exposure must hurt, not satisfy.
