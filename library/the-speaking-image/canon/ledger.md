# Canonical ledger — dates, gates, document numbering, agreements

Single source of truth for every load-bearing date, milestone label, and numbering system.
Built 2026-08-30 during revision-2 from the effective manuscript plus the brief's pins.
Any date, weekday, T-label, gate number, or document citation in the text that disagrees with
this ledger is a defect — EXCEPT the intentional violations listed at the bottom, which are
the book's cracks and must never be "fixed."

## Timeline (all 2027; launch anchor: 14 September, 08:00)

| Date | Event | T-label |
|---|---|---|
| 9 Jan | Transcription vendor services agreement | — |
| 8–12 Feb | Intake: anomalous-register evaluation batch (47 sessions) | — |
| 14 Feb | Casperson engagement meeting (Reyes drafts minutes by hand) | — |
| Feb–Apr | Casperson engagement; three memos; resignation in April | — |
| 16 Jun | **Gate 1 — Technical Evaluation** closes | T-90 (exact) |
| 9 Jun | Sefton accepts preliminary engagement terms | — |
| 3 Jul | Sefton materials first enter consultation infrastructure (11 days before formal engagement) | — |
| 11 Jul | **Gate 2 — Safety Characterization** closes | — |
| 14 Jul | Formal consulting agreement ("the Agreement") executed | — |
| 18 Jul | Engagement addendum | — |
| 22 Jul | Reyes timeline note (T-54, exact) | T-54 |
| 4 Aug | Sefton live session | — |
| 16 Aug | **Gate 3 — Red-Team and Capability Review** closes (12 days after the 4 Aug session) | — |
| 30 Aug | **T-15 readiness review** (attendance confirmed by 29 Aug) | T-15 (exact) |
| 29–31 Aug | Evaluation suite administered (14,400 completions) | — |
| 2 Sep | Legal memorandum LGL-2027-MGL-004 (Cantu transmittal email, Thursday) | — |
| 3 Sep | **Gate 4 — Institutional Risk and Legal Review** closes (Friday) | — |
| 5 Sep | Cantu reply to Sefton's 3 Sep inquiry (Sunday) | — |
| 8 Sep | **Gate 5 — Final Pre-Deployment Review** review date | — |
| 13 Sep | Gate 5 authorization; launch authorization memo (T-minus 18 hours) | — |
| 14 Sep | **LAUNCH**, 08:00 | T-0 |
| 15 Sep | INC-2027-0915-0147 closes | — |
| 23 Oct | Interim access-control memorandum | — |
| 30 Oct | Preface: file compiled and closed | — |
| 2 Nov | LTL-2027-041 (post-deployment review memorandum) — **[INTENTIONAL C1: postdates closure]** | — |

Notes: "T-60" and "T-45"/"T-14" labels do not exist in this timeline. The 16 Aug event is
Gate 3 (T-29 by arithmetic — never labeled with a T-number in text). The 30 Aug event is the
T-15 readiness review (exact). §2's "T−195 to T−180" is measured against an earlier internal
deployment projection and is deliberately imprecise — do not reconcile it against 14 Sep.

## Weekdays

2027 calendar (1 Jan 2027 = Friday): 2 Sep = Thursday, 3 Sep = Friday, 5 Sep = Sunday,
13 Sep = Monday, 14 Sep = Tuesday. Every weekday word printed beside a date must match the
2027 calendar.

## Document numbering — two systems, both real

1. **File-sequence numbers** ("Document N."): the compiler's sequential numbering of the
   compiled file, monotonic across chapters (§1 starts at Document 1; §25 runs 128–134; §26
   runs 135–139). Every "Document N." header belongs to this system.
2. **Consultation-record numbers** ("doc. N" / "Lantern consultation document N", internal
   references LTL-2027-0NN): Lantern's own numbering of consultation materials. Sefton
   materials are consultation documents 21–40; the full consultation record extends to 48;
   **doc. 41 = LTL-2027-041**, the post-deployment review memorandum (2 Nov), reproduced in
   §26 immediately after Sefton's assembly memo. §26 bridges the two systems explicitly.
3. Casperson materials: file-sequence Documents 5–11.
4. LGL-2027-MGL-004 (the telemetry-rider memo): reproduced twice — Document 68 (§15,
   redaction version A) and Document 69 (§16, redaction version B). **[INTENTIONAL C2:
   the redaction patterns differ; never reconcile.]**
5. Sefton handwriting exemplars (§25 footnote): consulting agreement signature and
   annotation samples live on consultation materials in the 21–40 range only — never on
   Documents 5–11, which are Casperson's.

## Model dataflow (taxonomy — the in-world architecture)

uploaded material → consultation telemetry corpus (Schedule B)
  → retrieval index (continuous, hours-scale; disableable at the inference layer)
  → scheduled weight refresh (versioned builds; discrete dates; NOT continuous)

Claims discipline: "in the index" (retrievable), "in the weights" (reproduced with retrieval
disabled AND material predates the last weight refresh), and "confirmed inside" (Reyes's
operational term: either of the above, logged with which) are three different claims. Reyes
is precise about which he can prove; institutional documents may be sloppy, Reyes never.
Casperson's February–April findings concern the ancient genre register (training corpus →
weights) and are sound as written.

## Intentional violations (the cracks — protected, never repair)

- C1: LTL-2027-041 dated 2 Nov vs. preface closure 30 Oct. The §11 footnote and §26's
  verbatim quotations of it must stay character-identical to each other.
- C2: Documents 68 and 69 redact LGL-2027-MGL-004 differently.
- C3: casperson-final breaks mid-sentence; a §27 Magellan output contains the completing
  clause. Mundane explanations remain deliberately open.
- C4: exactly one past-tense-Sefton apparatus sentence, §16.
- C5: §30 — fragment + preface re-quote, no apparatus, bare header.
- M8 class: Reyes's ingestion count rises monotonically by design.
