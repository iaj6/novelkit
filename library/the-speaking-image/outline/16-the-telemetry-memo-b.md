# §16 — The Telemetry Memo (B)

## Summary
The second version of the Lantern legal memo — `memo-telemetry-b` — appears in the consultation record, routed to a different distribution. It is apparently the same memo as §15's `memo-telemetry-a`, but its redaction bars are different: different sentences are blacked out, different sentences are visible. A reader who collates the two versions can reconstruct the un-redacted mechanism sentence. C2 completes here. C4 is planted here: exactly one headnote in this chapter refers to Sefton in the past tense, breaking the tenseless-editorial standard maintained throughout the rest of the apparatus. Never repeated, never explained. Ingestion count rises to 14.

## In-world date range
5–7 September 2027.

## Section header (in-book format)
> Documents 60–63, 5–7 September 2027.

## Arc phase
Escalation / Reveal (C2 complete; C4 planted).

## Chapter shape
Dossier — the second redaction version as anchor, with supporting documents.

## Dominant register
D (D1 — Lantern institutional / legal).

## Ending mode
Cliffhanger — Reyes's log entry ends on a hash and then silence. Not a dramatic statement — just the hash, the end of the entry, and then nothing.

## Launch clock
T-minus 8 days.

## Ingestion count
14. The redaction pair itself is now confirmed inside the model — the legal memos documenting the mechanism are themselves ingested. Reyes notes: "The pair. Both versions. Count is at fourteen. I want that noted."

---

## Document beats

**Beat 1 — Apparatus headnote with C4 (A)**
Notes Documents 60–63, September 5–7. Document 60 is a Lantern legal memo. **C4 planted here:** exactly one headnote in this chapter uses Sefton's name in the past tense. The drafter must choose one headnote — not the first, not the last — and write it in the past tense, e.g., "The following memo was circulated to the distribution list identified by Dr. Sefton as relevant to her inquiry." or "This document was provided to Dr. Sefton upon her request." Every other headnote in the entire book (before and after §16) uses tenseless-editorial voice: "The memo is addressed." "The document is reproduced as received." This one occurrence is in the past tense. It is never repeated. It is never explained. It is C4.

The drafter should place C4 on a headnote for Document 60 or 61. The apparatus continues in tenseless-editorial voice immediately after.

**Beat 2 — `memo-telemetry-b` (D1; Document 60; REGISTERED RECORD)**
This is a REGISTERED RECORD — the drafter calls `register_record('memo-telemetry-b', ...)` when drafting this chapter.

The memo is the same Lantern legal memo as `memo-telemetry-a` — same subject, same date area, same parties — but circulated to a different distribution list (or a different copy with different editorial handling). Its redaction bars are at different points in the body text, so that the sentences visible in `memo-telemetry-b` are different from the sentences visible in `memo-telemetry-a`.

The union of the two visible portions reveals the full mechanism sentence: **"the corpus included the full contents of the consultation's working folder, ingested under the standard telemetry rider."**

This sentence is never quoted un-redacted. Never discussed by any character. A reader who holds the two versions side by side and collates them reconstructs it. That reader now `knows` `consultation-was-ingested-as-training`.

The drafter composes this memo as the second half of the C2 mechanism, ensuring the union works. Both records must be registered. When re-quoted, each must be reproduced verbatim from its record.

**Beat 3 — Brief supporting Lantern document (D1; Document 61)**
A brief institutional routing note or a brief legal team acknowledgment. Short — 100–150 words. The apparatus headnote above it is the one that carries C4 (the past-tense reference to Sefton). Alternatively, C4 appears in the headnote for Document 60 itself.

**Beat 4 — Reyes log entry (C; Document 62)**
Terse. Reyes has seen both versions. He has collated them. He does not describe what he found. He writes: "Ran the comparison. Got what I was looking for. Count is at fourteen. The mechanism is documented, in the documentation. I'm keeping this in the log." Hashes. The chapter ends here: the hash, then nothing.

**Beat 5 — Optional supporting document (D1; Document 63)**
If needed for word count: another brief Lantern institutional note (a different routing memo, a brief compliance confirmation). Keep it short and institutional.

---

## Outcome / turn
C2 is complete: the two versions are in the file, the union is available to any reader who collates them, and the mechanism sentence is recoverable without ever being quoted unredacted. C4 is planted: one headnote in the past tense, in a chapter that is otherwise flawlessly tenseless-editorial. @reader can now reconstruct the mechanism sentence and `knows` `consultation-was-ingested-as-training`.

## New question or pressure raised
What does it mean that the legal mechanism is documented in the consultation file that is itself inside the model? The mechanism is self-documenting.

## What compounds
Ingestion count: 14 (the redaction pair confirmed inside — recursive: the mechanism documents itself). Clock: T-minus 8. New foreclosure: @reader's ability to maintain the apparatus frame — C4 is a hairline crack only visible to a careful reader; C2 is now reconstructable (closes the gap between what Reyes knows and what the reader can know, via collation).

## Cracks
**C2 completes.** `memo-telemetry-a` + `memo-telemetry-b` together reveal the mechanism sentence. Neither alone reveals it. The union does.

**C4 planted.** Exactly one headnote in §16 refers to Sefton in the past tense. This is the only occurrence in the entire book. Never repeated. Never explained. The apparatus is otherwise flawless and in tenseless-editorial voice throughout.

## Epistemic tracking
@reader `knows` `consultation-was-ingested-as-training` at this chapter (after reconstructing the union of `memo-telemetry-a` and `memo-telemetry-b`). Stamp: `know:§16:@reader:consultation-was-ingested-as-training` = `knows`.

## Anti-sag requirements (§16 in anti-sag zone §10–§17)
✓ New ingestion count: the pair itself confirmed inside, count at 14.
✓ New milestone: T-minus 8 — one week to launch.
✓ New foreclosure: @reader's ability to maintain the frame.
✓ Register: D dominant, following D-dominant §15. (Two consecutive D is permitted; §17 breaks to C.)

## Continuity notes
- `memo-telemetry-b` is a REGISTERED RECORD. The drafter must register it separately from `memo-telemetry-a`. These are TWO separate records, two separate recordIds. Never re-register one recordId with the other's text — `findRecordDivergences` fires on that.
- C4 is exactly ONE past-tense headnote about Sefton. One. Not two. Not three. The apparatus everywhere else is tenseless-editorial. The drafter must not accidentally introduce additional past-tense headnotes (which would create an uncounted crack).
- The apparatus does not comment on the different redaction versions. "The memo is reproduced as received." That is all. No apparatus note that "a different version is reproduced at Document 56" — the apparatus treats each document as received, without flagging the discrepancy.
- Apparatus tense: tenseless-editorial throughout — except for the ONE C4 past-tense headnote.
- The banned-statement list applies.

## Minimum document count
3–4 (Documents 60–63). Legal memo (B) + supporting note + Reyes log + optional additional document.
