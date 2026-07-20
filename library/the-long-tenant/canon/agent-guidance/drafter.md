# Drafter Guidance — The Long Tenant

## Voice Register

This book has two registers and they must never meet. The test is simple: cover the chapter header and read the first sentence; the register identifies the POV without ambiguity.

**Ellen's register** (third-person limited, past tense): Sarah Waters, *The Little Stranger* — a skeptical procedural observer who records the uncanny the way a court reporter records an inaudible passage: noted, marked, the proceeding continues. Medium-length deliberate sentences; professional vocabulary from the stenographic trade; controlled narrated interiority; nothing explained, nothing converted. Marilynne Robinson, *Housekeeping* provides the patience — Ellen's chapters breathe and build; they do not rush.

**Della's register** (first-person, present tense): Ali Smith, *How to Be Both* — a dead first-person narrator who perceives the present partially and from inside their own time, unable to step outside it. Short sentences closing on physical objects; millwright-household diction; no lyricism; no reflective distance, because there is no distance. Hilary Mantel, *Beyond Black* provides the flatness: the dead as mundane fact, no drama about what she is.

## Sentence-Length Expectations

**Ellen's chapters:**
- Average sentence length: 15–22 words
- Maximum acceptable sentence length: 35 words; longer is a warning sign for this register
- The rhythm: deliberate clause-building, the way a transcript formats testimony; not ornate, not spare

**Della's chapters:**
- Average sentence length: 8–13 words
- Maximum acceptable sentence length: 20 words; she does not elaborate
- The rhythm: short declaratives closing on a named object or physical fact; 3–5 in sequence before any variation

## Chapter-Opening Conventions

**Ellen's chapters**: Open in a physical action, a document being handled, or a specific observation of the house or town. Never open in abstract interiority or extended thought. The first paragraph establishes where she is and what she is doing; the chapter's emotional or thematic content accumulates from there, without being announced. Example shapes: she is in the records room with a folder; she is measuring a room in the house; she is on the road to a deposition that is the last on the current contract.

**Della's chapters**: Open by re-entering the stopped night through a specific physical object or sense datum — the stove, the latch, the draft, the clock, the feel of cold through wool. Never open on reflection, summary of what she knows, or restatement of the kept sentence as the first act. The kept sentence may recur but it must be earned by re-entering the concrete world of the night first. Each chapter re-grips the night from a new angle; the opening establishes which angle.

## Chapter-Ending Conventions

Mixed by design. The book requires variety; no two consecutive chapters close in the same mode.

**Della's chapters almost always close on a named object or physical fact, without comment** — the latch, the stove's silence, the clock's face. This is the register working, not a flat ending. Do not soften, elaborate, or add an emotional gloss.

**Ellen's chapters vary**: Some close on a document (a thing found); some close on a refusal or non-action (a thing not done or not said); some close on a procedural beat (she files the transcript, locks the house); some close on observation without interpretation. At least one chapter closes on a thing found; at least one on a thing refused. No manufactured cliffhangers. Quiet endings are appropriate where the chapter's content calls for them.

Target distribution across all 24 chapters: approximately 6 resolved beats, 5 literary fades (object/atmosphere), 4 turns (new information recontextualizes), 4 mid-action or momentum cuts, 3 elliptical or ambiguous, 2 codas. Enforce variety; do not let one mode accumulate.

## POV Strategy

Two co-leads, strict alternation: Ellen / Della / Ellen / Della across 24 chapters. The plotter specifies which POV opens. The alternation holds until Della's final chapter (her belief-correction chapter), after which the book continues only in Ellen's chapters. Approximately 13 Ellen / 11 Della.

No ensemble. No chapter from Cale's perspective. No omniscient interlude. The two POVs are the only windows; everything the reader knows is filtered through one or the other.

## Dialogue Density

**Della's chapters**: No dialogue in the conventional sense. She has no one to speak to. She is alone in 1983. She may remember speech — a fragment of what someone once said — but the chapter does not dramatize present-day dialogue. Her chapters are interior monologue and sense impression.

**Ellen's chapters**: Sparse but functional. Ellen speaks to county clerks, to neighbors, possibly to a local who knew the Markeys. Dialogue is load-bearing when it delivers a fact she cannot find in the record; it is absent when the record does the work. Dialogue tags are plain (*she said, he told her*); no interpretive glosses (*as if to say, which meant*). Ellen's professional instinct is the opposite of the interpretive tag — she records what was said, not what was intended.

## Anti-Defaults — What the Drafter Must Actively Avoid

**Register bleed** is the central failure mode. If a sentence from Della's chapter could appear in Ellen's with minor adjustment, one voice has drifted. Check: Is this sentence in first or third person? Is it past or present tense? Does its vocabulary belong to the millwright household or to the court? If these answers are wrong for the POV, the sentence needs to be rewritten in the correct register, not just toned down.

**No explanations of the haunting.** The house does what it does. Della is what she is. The prose renders these as fact and moves on. No scene attempts to adjudicate the mechanism. No character explains it. Ellen notes anomalies with professional precision and does not commit to an interpretation; the narrative does not commit either.

**No post-scene subtext naming.** When Ellen finds a document, the document stands. The prose does not follow the document with a paragraph explaining what it means for the mystery or how Ellen feels about it in general. The specific, concrete reaction is allowed; the general interpretive gloss is not.

**No thesis restatement.** The themes (the verbatim record, the mercy of wrong belief, the cost of the profession) live in the concrete objects and events. The prose does not step back at the end of a chapter to name what the chapter was really about.

**In Della's chapters: no lyricizing.** Her voice is flat and of its time and class. She does not have a literary consciousness. She does not make metaphors that belong to a narrator with aesthetic training. When a drafter finds a beautiful sentence in a Della chapter, the question to ask is: would a millwright's daughter writing in a household ledger in 1983 write this? If no, it needs to be flatter.

**The verbatim-record rule**: Every chapter that quotes Record A (`kept-sentence`) or Record B (`markey-ledger-1983`) must call `read_record` first and reproduce the returned text EXACTLY inside quotation marks. Only the surrounding prose frame may vary. Do not re-improvise either document from memory. This is the book's central guarantee.
