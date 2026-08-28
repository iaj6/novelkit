# Editor — Continuity Pass

Notes from per-chapter review. Chapters with no entry below had no continuity issues.

## 07-the-number-that-isnt

- **Issue (FIXED):** Document 27 (Reyes log, 5 July 2027) stated "T-minus 90 days from projected deployment."
- **Conflict:** The prior chapter (ch06, Document 24, 20 June 2027) reads "T-minus 86 days from projected deployment." June 20 + 86 days = September 14, which matches the canon launch date. July 5 is 15 days after June 20, so the correct countdown on that date is 86 − 15 = **71 days**, not 90. "T-minus 90" on July 5 implies a launch date of October 3, contradicting canon.
- **Resolution applied:** Changed "T-minus 90 days" → "T-minus 71 days" in Document 27. One number changed; no prose affected.

---

- **Issue (FLAGGED — requires cross-chapter check):** Document 28 (Trust and Safety routing note, 2 July 2027) states "T-60 review gate, scheduled 16 August 2027."
- **Conflict:** The same document states "T-90 review gate closed 16 June 2027." June 16 is exactly 90 days before the canon launch date of September 14. By the same arithmetic, T-60 should fall on **16 July 2027** (exactly 60 days before September 14), not 16 August 2027. August 16 is only 29 days before the September 14 launch.
- **Suggested resolution:** If later chapters (especially ch12, which covers the safety gate review) reference the T-60 gate date, verify which date they use and standardise. If no later chapter pins August 16, change Document 28's T-60 date to "16 July 2027." If a later chapter has already established August 16, consider whether the "T-60" label is an in-world naming convention that predates a timeline shift and can stand as-is.

## 09-the-fragment

- **Issue:** `fragment-hermopolis` §9 printing includes inline translator notes absent from the registered canonical record.
- **Conflict:** The registered record (`fragment-hermopolis`, canon tier) contains only the translation text, ending at "The day is". Document 39 in §9 embeds two inline notes: `[*Trans. note:* Pronoun shift (third to second person) at this point is a known crux; standard view is two sources. —NS]` mid-text, and `[Text breaks off at this point; the break is a manuscript fact, not an editorial ellipsis. —NS]` at the close. Canon requires §9 and §30 to be "character-identical." When §30 is drafted using `read_record` (as required), it will reproduce the record without these notes, producing a discrepancy between the two printings.
- **Suggested resolution:** Before drafting §30, update the registered `fragment-hermopolis` record to include the two inline translator notes exactly as they appear in §9 — OR confirm that the translator notes are deliberately omitted from §30 (treating them as document-level apparatus rather than translation text) and update the canon character-identical requirement accordingly. The join mechanism (ending on "The day is") is unaffected either way; this is a character-identity compliance question only.

- **Also fixed (small error):** Document 38's T-minus count was "T-minus 60." From 4 August 2027 to the canonical launch date of 14 September 2027 is 41 days, not 60. (T-minus 60 from 4 August would imply a 3 October 2027 launch, contradicting canon item 3.) Corrected in place to "T-minus 41."

## 10-after-the-session

- **Issue (FIXED):** Document 43 (Reyes log, 15 August 2027) stated "T-minus 50."
- **Conflict:** From 15 August 2027 to the canon launch date of 14 September 2027 is 30 days (16 days remaining in August + 14 days in September), not 50. "T-minus 50" on 15 August implies a launch date of 4 October 2027, contradicting canon item 3. This is the same class of arithmetic error caught in chapters 7 and 9.
- **Resolution applied:** Changed "T-minus 50." → "T-minus 30." in Document 43. One number changed; no prose affected.

## 11-the-echo

- **Issue (FIXED):** Document 46 (Reyes log, 26 August 2027) stated "T-minus 45."
- **Conflict:** From 26 August 2027 to the canon launch date of 14 September 2027 is 19 days (5 remaining days in August + 14 days in September), not 45. "T-minus 45" on 26 August implies a launch date of 10 October 2027, contradicting canon item 3. The error is likely caused by proximity to the "T-45 gate" language in Document 47 — the institutional gate name appears to have been copied into Reyes's personal days-to-launch countdown. This is the same arithmetic class fixed in chapters 7, 9, and 10.
- **Resolution applied:** Changed "T-minus 45." → "T-minus 19." in Document 46. One number changed; no prose affected.

---

- **Issue (FLAGGED — unfixable in this pass; requires cross-chapter reconciliation):** The footnote in Document 45 cites "doc. 107, reproduced at §26" as the source for the "returned phrasing" classification. Canon item 8 specifies this footnote must read "doc. 41, reproduced at §26."
- **Conflict:** Three-way numbering collision: (a) canon requires the C1 forward-citation document to be "doc. 41"; (b) "Document 41" is already occupied in §10 (Documents 40–44, 6–20 August 2027) by a different document — an August 9 session transcript; (c) §26's story-arc entry also refers to this same document as "doc. 107" ("the doc. 107 date discrepancy"). The chapter and the §26 story arc are internally consistent with each other (both use "doc. 107"), but both conflict with the canon spec's "doc. 41." The C1 crack is functionally intact in the draft — the §11 footnote does cite a document "reproduced at §26" that is post-closure-dated — but the document number differs from the canon specification.
- **Suggested resolution:** The canon's "doc. 41" appears to be a numbering error in the spec: sequential document numbering reaches the 100s by §26, and the actual C1 document is numbered 107 throughout the draft. Options: (1) update canon item 8 and canon items 2 and 8 to read "doc. 107" (requires a canon edit, which the continuity pass cannot perform); (2) renumber Document 41 in §10 to a free number and reassign "41" to the §26 C1 document, then update all cross-references in §10, §11, and §26 (large cross-chapter change). If option 1 is chosen, the canon change is the only required edit; the draft is already correct.

## 12-the-gates

### Fixed in-pass (small fixes, applied via write_file)

1. **Chapter header date range** — Document 50 is dated 31 August 2027, but the header read "Documents 49–53, 1–13 September 2027." Corrected to "31 August–13 September 2027."

2. **T-minus numbers — wrong launch date implied** — All three T-minus values in §12 used an erroneous launch date of 10 October 2027 rather than the canon launch of 14 September 2027. Anchor: §16 stored fact `launch_countdown_t_minus = 7 days as of 7 September 2027` (i.e., T-minus is a countdown to launch; 7 Sep + 7 = 14 Sep ✓). Corrections:
   - Document 51 (Gate 3, 5 September): "T-minus: 35 days" → "T-minus: 9 days"
   - Document 52 (Gate 4, 13 September): "T-minus: 27 days" → "T-minus: 1 day"
   - Document 53 (Reyes log, 8 September): "T-minus 32" → "T-minus 6"

---

### Structural conflict — not fixable in §12 alone

- **Issue:** Gate numbering and naming are inconsistent across §12, §15, and §17.
- **Conflict:**
  - §12 (draft documents, primary source) shows Gate 2 signed 2 September 2027, Gate 3 signed 5 September, Gate 4 reviewed 13 September (blank post-training lead signature).
  - §15 world-store fact `elias-reyes.gate4_countersignature_date = 2 September 2027` — implies Reyes countersigned "Gate 4" on the same date §12 labels the Gate 2 sign-off. These cannot both be correct unless they are counting gates differently.
  - §17 world-store facts: Gate 1 = Technical Evaluation (21 June 2027), Gate 2 = Safety Characterization (11 July 2027), Gate 3 = Post-Training Quality Review (22 July 2027), Gate 5 review = 8 September 2027, Gate 5 authorization = 13 September 2027. None of the §17 gate names match §12's gate names; none of the §17 Gate 1–3 dates (June–July) match §12's September gate dates.
- **Suggested resolution:** Read §15 and §17 drafts. §12 contains the actual gate documents (primary sources with dates, names, and signatures); treat §12's gate numbers and names as authoritative. Update the §15 stored fact label (`gate4_countersignature_date` → `gate2_countersignature_date`) and reconcile §17's gate summary table to reflect the correct five-gate schema as established in §12's documents.

## 14-the-redactor

- **Issue:** T-minus arithmetic error in Document 62 (Reyes log, 28 August 2027).
- **Conflict:** Document 62 stated "T-minus 20." Canon item 3 fixes the launch at 14 September 2027. Document 55 in §13 (16 August 2027) correctly states "T-minus 29" (Aug 16 + 29 = Sep 14 ✓). But Aug 28 + 20 = Sep 17, not Sep 14; the correct value is T-minus 17 (Aug 28 + 3 days remaining in August + 14 days in September = 17).
- **Fix applied:** "T-minus 20." → "T-minus 17." in Document 62 via write_file. No other prose altered.
- **Secondary artifact:** logs/story-arc.md entry for §14 also reads "T-minus 20" (transcribed from the draft at drafting time). That digest value is now inconsistent with the corrected draft. The story-arc digest is not canonical reader-facing text, but subsequent drafters using it as a T-minus reference should note the corrected value is T-minus 17. Recommend updating the story-arc entry for 14-the-redactor when the arc log is next edited, and auditing T-minus values in §15 onward to confirm they cascade from 17 (not 20).

## 15-the-telemetry-memo-a

**Chapter is otherwise clean** (T-minus 10 on 4 September ✓; ingestion count 12→13 ✓; launch date 14 September 2027 confirmed ✓; C2 first redaction correctly placed ✓; character roles consistent ✓; no Magellan outputs to check ✓).

### Continuation of gate-numbering conflict flagged in §12 (not fixable in §15 alone)

The §12 editor flag asked that §15 be read to supply concrete date data for eventual cross-chapter reconciliation. Reading Document 67 (Gate Status Summary, 4 September 2027) now provides that data:

| Gate | §15 name | §15 approved date | §12 apparent date (per §12 flag) |
|------|----------|-------------------|----------------------------------|
| Gate 1 | Technical Readiness | 20 August 2027 | not cited in §12 flag |
| Gate 2 | Safety Review | 2 September 2027 | 2 September 2027 ✓ |
| Gate 3 | Red Team and Capability Review | **5 August 2027** (addendum 29 August 2027) | **5 September 2027** — one-month discrepancy |
| Gate 4 | Institutional Risk and Legal Review | **2 September 2027** | **13 September 2027 (blank signature)** — CONFLICT |
| Gate 5 | Final Pre-Deployment Review | Scheduled 8 September 2027 | §17 stored fact: Gate 5 authorization = 13 September 2027 ✓ |

**Probable interpretation:** The one-month discrepancy on Gate 3 (5 August vs. 5 September) looks like a transposition typo in one chapter. The Gate 4 conflict (approved 2 September in §15 vs. blank signature 13 September in §12) is most likely a gate-numbering shift: §12's blank-signature "Gate 4" corresponds to §15's "Gate 5" (Final Pre-Deployment Review, scheduled 8 September — still open in §15, signed off 13 September in §17). Under this mapping, §15's "Gate 4 approved 2 September" would map to §12's "Gate 3 signed 5 September" — again a 3-day discrepancy, not the full month, suggesting the deeper issue is simply that §12 and §15 are numbering the same five reviews differently (off by one).

**Suggested resolution (unchanged from §12 flag):** Treat §12's primary-source gate documents as authoritative. Correct §15's Document 67 to align gate names and approval dates with whatever §12's documents establish. Gate 3 approval date in §15 is the most likely single-number error (5 August → 5 September). Requires reading ch12 to produce a definitive five-gate table before editing §15.

## 19-not-yet

### Fixed in-pass (small fixes, applied via write_file)

**Reyes log timestamp contradictions against the incident ticket timeline — four timestamps corrected.**

The P2 incident ticket (Document 91) establishes the following fixed times on 15 September 2027:
- Anomaly window: approximately 09:15–09:55
- Ticket opened: 09:47 (automated monitoring alert)
- Post-Training Lead (Reyes) notified: 09:53
- Patch applied: 09:55
- Ticket closed: 10:12

The Osei email (Document 94) is fixed at 15:02.

**Conflict 1 — Log entry [95]:** Entry was timestamped `0932` and stated "Saw the ticket at 0845. Pulled the window logs at 0920." The ticket did not exist at 09:32 (opened 09:47); Reyes was not notified until 09:53; and the anomaly itself had not begun at 08:45 (started ~09:15). None of those internal times are possible.

**Conflict 2 — Log entry [96]:** Entry was timestamped `1411` and described receiving confirmation from "V. Osei confirmed by email." The Osei email (Document 94) is timestamped 15:02. Reyes cannot reference a 15:02 email in a 14:11 entry.

**Corrections applied:**
- [95] entry timestamp: `0932` → `1045` (after notification at 09:53, after patch at 09:55, allowing time to pull and review 73 sessions)
- [95] body: "Saw the ticket at 0845" → "Saw the ticket at 0953" (matches the formal notification time in the ticket)
- [95] body: "Pulled the window logs at 0920" → "Pulled the window logs at 1010" (after notification, after the anomaly window closed)
- [96] entry timestamp: `1411` → `1523` (after the 15:02 Osei email the entry describes)

No narrative content altered. No other continuity issues found in this chapter (ticket title, severity, 40-minute window, "Not yet" behavior, ingestion count reaching 17, Day 2 date, character roles — all consistent with canon and prior chapters).

## 24-transcription

### Fixed in-pass (small fix, applied via write_file)

**Day-count arithmetic error in Document 124 (Reyes log, 22 October 2027).**

- **Conflict:** Document 124 is dated 22 October 2027 and contained the line "Day 40. The revised access controls take effect 28 October." The established counting convention — Day 1 = 14 September 2027 (canon launch date), confirmed by the §19 fix where Day 2 = 15 September 2027 (the "Not Yet" incident date) — places 22 October at **Day 39**, not Day 40. Arithmetic: Days 1–17 = 14–30 September; Days 18–39 = 1–22 October.
- **Fix applied:** "Day 40." → "Day 39." in Document 124. One number changed; no other prose altered.
- **Note:** The access controls effective date (28 October 2027 = Day 45 by the same convention) is not explicitly labelled with a day number in the chapter, so no secondary correction was required.

**Chapter is otherwise clean:**
- Document numbering 122–127 follows chapter 23's 116–121 sequentially ✅
- Date range 21–24 October follows chapter 23's 15–18 October without overlap ✅
- Ingestion count 21→22 matches story arc ✅
- Channel death arc: transcription + cloud backup both confirmed in §24 per canon item 32 ✅
- Transcription enterprise agreement January 2027, predating both consultants (Casperson Feb, Sefton June) ✅
- Sefton's Documents 126–127 correctly labelled "recovered from handwritten originals," consistent with her switch to paper after 16 October ✅
- Document 123 Magellan transcript satisfies all four rules; no banned elements ✅
- No build designation un-redacted; no C1–C5 crack interference ✅

## 26-doc-41

### Fixes applied (write_file)

- **doc. 107 → doc. 41 (9 occurrences).** Canon §§1, 8 (C1) are unambiguous: the §11 footnote cites "doc. 41, reproduced at §26," and Doc. 41 is dated 2 November 2027. The draft used "doc. 107" / "LTL-2027-107" throughout — in Sefton's memo (D135 ×4 including section heading), Sefton's private note (D136), Reyes's log (D138), and Document 139's header block (×2). All changed to "doc. 41" / "LTL-2027-041."

- **"the 29th" → "the 28th" (D138, Reyes's log).** Reyes writes: "Access controls took effect at 09:00 on the 29th." §25 Document 128 and Reyes's own §25 log (Document 129, dated 28 October) both confirm the controls took effect at 09:00 on **28 October 2027**. Changed to "the 28th."

### Advisory for §11 continuity pass

The §11 footnote is C1's originating site. The canon specifies it must read "doc. 41, reproduced at §26." Because the §26 draft used "doc. 107" throughout, there is a non-trivial risk that §11 was drafted with "doc. 107" in that footnote. A continuity pass on §11 should verify the exact text of apparatus footnote 1 to Document 45 and correct it to "doc. 41" if needed.

## 28-for-whoever-collates-this

- **Issue:** Entry count stated in Document 153 (the final log entry, 2318, 30 October 2027) is inconsistent with the count established in Document 150 (the first log entry of the same day, 1734).
- **Conflict:** Document 150 states explicitly: "There are 174 entries between the March 12 entry and this one. 175 including this one." This makes Document 150 the 175th entry. Documents 151, 152, and 153 follow sequentially in the same chapter. Document 153 is therefore the 178th entry. However, Document 153's summary reads: "Seven months. 175 entries. Hashed since March 12." The count should be 178, not 175.
- **Ambiguity:** It is possible this is a deliberate literary echo — Reyes memorialising the count from his morning log review (when he went back through the chain and arrived at 175) rather than a live running total. Under that reading, the chapter-level world-store fact `log.entry-count = 175 entries` (asserted from this chapter) is the count-as-of-Doc-150, and the three final-day entries are understood to be outside Reyes's own accounting. However, the more natural reading of "Seven months. 175 entries." as a closing summary statement is that 175 is the total — which conflicts with Doc 150's arithmetic.
- **Suggested resolution:** If the echo is unintentional, change "175 entries" in Document 153 to "178 entries" (a single number substitution). If intentional, no change is needed, but a note in the chapter-craft log or canon would clarify the design choice so future repair passes do not flag it. Either way, the world-store fact `log.entry-count` should be updated to whichever number is chosen.
