# Editor — Continuity Pass

Notes from per-chapter review. Chapters with no entry below had no continuity issues.

## 07-the-file

- **Issue:** Door (f) — *the habit* — is closed a second time, violating the compounding-mechanism rule.
- **Conflict:** Canon fact 26 states "A fact once established must not be re-walked." Chapter 03 (*the-habit*) already closed door (f) — the world store records `josiah-eccleston.all_instruments_through_firm = true [drafted, 03-the-habit]` — and the ch03 story-arc entry explicitly reads "door (f) closed." Chapter 07's final working note re-asserts the identical conclusion verbatim: "every instrument made by Josiah Eccleston for a period of forty years was made through the firm of Garside & Prescott, and the last was the first codicil."
- **Suggested resolution:** Revise ch07's working note so it closes or materially narrows a door not yet shut. The chapter's new evidence (the 1926 diary showing the last mill visit on 14 May, the blank pages thereafter, Josiah's April letter to Nora, and the complete silence of his personal correspondence on any change of mind) more naturally narrows door (b) — *Josiah's presence* — by establishing that Josiah neither visited the mill after May nor expressed any intent to alter his dispositions after March 1924. Door (b) is formally closed in ch15 via Hall depositions and medical evidence; ch07 can position itself as the prior narrowing step without usurping that close. The working note wording would need to shift its explicit conclusion from the habit (instrument channel) to the disposition (no intent, no presence, no private act).

- **Also fixed (small):** Day count corrected from "two hundred and fifty" to "two hundred and fifty-seven." Chapter 06 established 265 days on 14 January; the papers arrive eight days later on the twenty-second (January 22); 265 − 8 = 257.

## 11-the-sale-contract

- **Issue:** R4 (Walter-to-Holt letter, 11 June 1925) introduced as a document insert but not registered as a canonical record
- **Conflict:** Canon constraints 3–4 require all R1–R5 texts to be registered so later re-quotations can be audited for verbatim fidelity. R4 is cited by the world store as evidence in chapters 16 and 17 (the date-asymmetry and ninth-word chapters), where it must be reproduced exactly. No call to `register_record` was made for R4 at its first introduction here in chapter 11.
- **Suggested resolution:** Before the chapter-17 continuity pass, register the verbatim text of R4 from this chapter (the "Dear Mr. Holt" letter block) under a stable record ID (e.g. `r4-holt-june-1925`), then verify chapter 17's quotation matches exactly.

## 12-the-sale-contract

- **Issue:** Chapter 12 (`draft/12-the-sale-contract.md`) duplicates chapter 11 (`draft/11-the-sale-contract.md`) in full.
- **Conflict:** Both chapters cover exactly the same narrative beat — Prescott opening Hadfield's second parcel, reading the mortgage instrument (£8,500, County Bank/Blackburn, 4.5%), the sale contract completion condition (clause 24 / verbatim identical), the nine-letter Holt correspondence bundle, Hadfield's March account (~£300 net loss, third consecutive quarter-day from capital, ~3 months reserves), and the "185 days" working figure. The story-arc log records both (`11-the-sale-contract` and `12-the-sale-contract`) with near-identical one-line summaries; `12-the-witnesses` appears twice in the log, confirming a chapter-renumbering event during drafting in which the old arc entries were not retired. Chapter 12 is the longer, more developed version; chapter 11 is an earlier, shorter draft of the same scene. If both chapters remain in the reading sequence, R4 (the Holt letter) is read, quoted, and filed on-page twice, and the "185 days" figure occurs twice in succession.
- **Suggested resolution:** Retire `draft/11-the-sale-contract.md` from the numbered draft sequence (or delete it). Chapter 12 is the canonical version of this beat. The story-arc log entry for `11-the-sale-contract` should be treated as superseded. No prose changes to chapter 12 are required; it is factually clean against canon.
