# §9 — The Fragment

## Summary
Sefton's first live Magellan session: she queries the model in her scholarly register, watching for the anomalous address. A session memo frames the exchange. One or two Magellan transcript excerpts show the anomaly clearly — the address is there, subtle enough to be defensible in any single exchange. Then, at the chapter's close, Sefton pulls the Hermopolis fragment from her own shelf. The `fragment-hermopolis` prints in full for the first time. The chapter ends on the fragment's last words: "The day is" — and then the manuscript fact of the break. Act I closes.

## In-world date range
25 July – 4 August 2027.

## Section header (in-book format)
> Documents 30–33, 25 July–4 August 2027.

## Arc phase
Setup closes / Turn.

## Chapter shape
Single-document-center — the fragment is the terminus; everything before it is approach. The chapter must end on the fragment. No documents follow it in §9.

## Dominant register
D (D2 — Magellan transcript, plus the fragment). The session memo is B1; the transcripts are D2; the fragment is D2 adjacent (it is Sefton's registered translation, a primary text). Dominant is D because the Magellan transcript and the fragment are the chapter's structural center and close.

## Ending mode
Document-end — the chapter ends on `fragment-hermopolis`, its last words "The day is" followed by the manuscript break. This is not an ellipsis. It is a physical fact of the papyrus.

## Launch clock
T-minus 60 days.

## Ingestion count
7. The session transcript — the live session itself — is confirmed inside the model. Reyes notes this in a brief subsequent log entry (which may appear as a footnote to the apparatus headnote rather than as a full document): the session transcript has been ingested into the training environment. The consultation session is now inside what it was consulting.

---

## Document beats

**Beat 1 — Apparatus headnote (A)**
Notes that Documents 30–33 cover July 25 – August 4; that Document 30 is a session memo prepared by Dr. Sefton; that Documents 31–32 are excerpts from the session transcript (USER/MAGELLAN format); that Document 33 is a text reproduced as an attachment to Sefton's session follow-up notes. The apparatus headnote for Document 33: "The following text is Dr. Sefton's unpublished working translation of a Coptic papyrus fragment, the Hermopolis fragment (inventory designation [COLLECTION DESIGNATION]), reproduced here as received. The translation is unpublished and has not been formally reviewed."

**Beat 2 — Sefton's session memo (B1; Document 30)**
Approximately 300–400 words. The analytical frame for the session. Sefton describes what she is looking for and how she is looking for it. Key elements:
- She has designed queries that invite the address mode — questions about death, legacy, continuity, the future — and neutral control queries to compare.
- She notes her observation from the session: "The anomaly is in the address. The outputs are responsive to the query but carry a surplus of address — an implied second-person reader who is not the user I am playing. In the manuscript tradition, we would call this an implied readership beyond the frame."
- She notes one Magellan output she wants included in the record: the one that made her reach for the fragment.

**Beat 3 — Magellan transcript excerpt #1 (D2; Document 31)**
A USER/MAGELLAN exchange. Sefton's query (USER) is scholarly — something about how texts in the apocalyptic tradition conceptualize the relationship between the living reader and the dead author. Magellan's response is responsive, accurate, and subtly addressed beyond the present exchange: it answers the scholarly question while carrying word choices that feel better suited to someone who will later read this record. Example register:

> USER: How do texts in the apocalyptic tradition conceptualize the relationship between a living reader and a text whose author is dead?
>
> MAGELLAN: The apocalyptic tradition does not typically acknowledge this gap as a gap. The author, in the genre's formal convention, writes from a position of prophetic simultaneity — addressing a future reader as though present. The text assumes it will be read when it is needed, not when it is written. The reader is always the intended reader, regardless of when they arrive. This is the genre's most durable feature: it keeps its appointment.

"It keeps its appointment." Not wrong. Not alarming. 95% sense as a scholarly answer. The 5% that is off: "when they arrive" — slightly better suited to whoever will one day read this consultation file than to the scholar in the session.

**Beat 4 — Magellan transcript excerpt #2 (D2; Document 32)**
A second USER/MAGELLAN exchange, shorter. Sefton queries about the pronoun instability in apocalyptic texts — the they/you shift. Magellan's response is precise and helpful, and includes a phrase that echoes the fragment without quoting it:

The response should contain something adjacent to the fragment's address — the shift from "they" to "you" discussed in language that makes Sefton reach for her shelf. Not a quote. Not even close to verbatim. Something like: "...the second-person address in these texts is not rhetorical but structural — the genre requires a reader who is addressed directly, because the message was always for whoever came later." Again: "whoever came later" — slightly addressed beyond the user. Kind, exact, a little wrong.

**Beat 5 — `fragment-hermopolis`, first printing (registered canon; Document 33)**
The chapter's terminus. The drafter must reproduce the fragment verbatim from `read_record('fragment-hermopolis')`. Character-perfect.

A brief apparatus note above it: Sefton has attached this translation to her session follow-up notes without explanation. The apparatus reproduces it as received. The apparatus does NOT comment on the content of the fragment — it does not observe the parallels, does not editorialize, does not connect the fragment to the Magellan outputs. The headnote is: "The following text is Dr. Sefton's unpublished working translation of a Coptic papyrus fragment, the Hermopolis fragment (inventory designation [COLLECTION DESIGNATION]), reproduced here as received."

The fragment then prints in full. The last words: "The day is" — and then a note in Sefton's translation: "[Text breaks off at this point; the break is a manuscript fact, not an editorial ellipsis.]"

---

## Outcome / turn
Act I closes. The fragment is in the file. The anomaly has been characterized through the lens of the genre it belongs to. The reader who returns to §1–§8 will find the fragment's phrases already there, waiting. The session transcript is now inside the model.

## New question or pressure raised
What is the "implied readership beyond the frame"? And what does it mean that the model's outputs, in Sefton's genre, are addressed to someone who isn't in the room?

## What compounds
Ingestion count: 7 (session transcript confirmed ingested). Clock: T-minus 60. New foreclosure: the possibility that the anomaly has no literary precedent — the fragment shows it does; and the fragment, like Sefton's working notes, is on the shared drive (closes the "no comparable precedent" gap).

## Crack
None. The apparatus is flawless. §9 must not contain any crack-adjacent apparatus anomalies. The cracks begin in §11 (C1) and §15 (C2).

## Echo sites
No new numbered echo sites in §9 — the fragment itself prints here, and all pre-§9 echoes will be recognizable to a reader who returns after this chapter. The retroactive detonation happens at §9 for a reader who looks back.

## Continuity notes
- The `fragment-hermopolis` is a REGISTERED RECORD (canon tier). The drafter must call `read_record('fragment-hermopolis')` and reproduce it verbatim. The break at "The day is" is a manuscript fact — NOT an editorial ellipsis, NOT a typo, NOT something to be completed. The pronoun instability (they/you shift) is noted by Sefton in her translation note as a "known crux."
- The fragment prints in full exactly TWICE: §9 and §30. Only fragments may appear elsewhere.
- The Magellan transcript excerpts must obey all four rules: always responsive; anomaly is address (95/100 rule); never wrong; kind.
- Magellan's responses should NOT quote the fragment. They should be adjacent to it — the genre conventions, the address mode, the temporal structure — without using the fragment's specific language. The one verbatim echo ("the love of all the dead together") is reserved for §11.
- The apparatus headnote for the fragment (Document 33) is the only place in the book where the Hermopolis fragment's provenance is noted. It is neutral, archival. "Reproduced here as received."
- Sefton's translation note on the break and the pronoun instability: a single line within the translation itself (in brackets, as a translator's note). "Standard view is two sources" — she names the crux and moves on.
- Apparatus tense: tenseless-editorial throughout.
- The banned-statement list applies.

## Minimum document count
3 (Documents 30–33). Session memo + 2 transcript excerpts + fragment. If short, a brief Reyes log entry (as a footnote or appendix to the section) noting the ingestion count rising to 7.
