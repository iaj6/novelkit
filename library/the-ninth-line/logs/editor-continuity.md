# Editor — Continuity Pass

Notes from per-chapter review. Chapters with no entry below had no continuity issues.

## 01-the-ledger-spine

- **Issue:** The coal cellar copy (N4) is labelled "the third" copy Ilinca made, but its stated date (November 3 of last year = 3 November 1983) precedes both the "first" copy (third week of November 1983) and the "second" copy (December 1983).
- **Conflict:** Canon item 4 locks the coal cellar copy's date as 3 November 1983, making it the earliest of the three G2 copies — chronologically the first, not the third. The chapter's "first / second / third" language implies the order in which the copies were made, but the dates invert the cellar copy's position.
- **Suggested resolution:** Reorder the three copy-description paragraphs in the chapter so the coal cellar scene (November 3) is described first, the trusted-neighbour apartment scene (third week of November) is second, and the bread-queue/bloc-neighbour scene (December) is third. The paragraph content is otherwise clean; only the presentation order needs to change. This is a structural edit and belongs with the author, not a line-level repair.

## 02-the-geography-book

- **Issue:** Doina's stated shift (nights) contradicts the chapter's internal temporal markers throughout, producing an irreconcilable light/time-of-day inconsistency.

- **Conflict:**  
  Canon (continuity.md §21) states Doina works the night shift. The chapter text itself is consistent with canon at the single line "she worked the day shift, I worked nights." However, every temporal anchor in the chapter points to a 6 AM–2 PM day shift:  
  — *Walking to work:* "dark at five-thirty" and "the shift started at six" read naturally as 5:30 AM → 6 AM start in November (Romania latitude; sunrise ~7:15 AM, so 5:30 AM is fully dark ✓ for a morning shift). A 5:30 PM walk to a 6 PM evening start also produces darkness, so the opening is ambiguous.  
  — *Break timing:* "six hours… The break is twenty minutes… worked until two." On a 6 AM shift: break at noon, end at 2 PM ✓. On a 6 PM shift: break at midnight, end at 2 AM.  
  — *Return home:* "that was the afternoon of the fifth" — she explicitly names her home-arrival moment as *the afternoon of 5 November*. A shift ending at 2 AM (6 November) cannot be described as "the afternoon of the fifth."  
  — *Closing image:* "The light through the curtain was the grey of mid-afternoon fog. I stayed on the bed until it was dark enough that the grey went away." This unambiguously depicts grey daylight dimming to evening dark — a mid-afternoon scene, not a 2:30 AM scene. There is no interpretation under which 2 AM produces "mid-afternoon grey going to dark."  
  The three final temporal markers ("afternoon of the fifth," "grey of mid-afternoon fog," "until it was dark enough that the grey went away") are coherent only with a 2 PM return from a morning shift.

- **Suggested resolution:** Two options, each requiring author judgment:  
  1. *Make the chapter consistent with canon (night shift):* Revise the closing passage to replace mid-afternoon imagery with pre-dawn or early-morning imagery, and replace "that was the afternoon of the fifth" with a date-neutral anchor ("that was the fifth") or early-morning framing ("that was the sixth, just before light"). Note this is a substantial atmospheric rewrite of the chapter's final third.  
  2. *Make the canon consistent with the chapter (day shift):* Change "I worked nights" to "I worked days" or "she worked nights, I worked the early shift," and update canon §21 to "She works the morning shift at the mill." This is a smaller prose change but requires a canon amendment (continuity.md is binding; the canon-owner must authorise the change).


## 12-fourth-generation

- **Issue A — Copy count is one short**
  - **Conflict:** Chapter 12 says Munteanu has three copies on 15 November 1984 (progression "On the sixth it was one copy. On the eleventh it was two. Now it was three"), and the desk scene shows only three physical copies (Damian / Lucia Gal / sister-in-law). But chapter 8 establishes that after the Lucia Gal interview he already held three copies: the two pre-Gal "Thursday" copies (including the neighbour / Strada Gării copy noted in the chapter 4 arc) plus N11. Adding Damian's copy in chapter 12 should bring the total to four, not three. The neighbour's copy — the second "Thursday copy" described in chapter 8's desk-comparison scene — is entirely missing from chapter 12's count and layout.
  - **Suggested resolution:** Add the missing copy to the desk scene in chapter 12 (four copies, not three), revise the count sequence from "1→2→3" to a sequence consistent with the chapter 4 and chapter 8 record of collections, and identify the missing copy's node label. This requires cross-referencing the chapter 4 draft and chapter 8's "Strada Gării" attribution before editing chapter 12.

- **Issue B — Date of the Lucia Gal interview contradicted**
  - **Conflict:** Chapter 12 locates the Lucia Gal interview on "the eleventh, a Sunday" (November 11, 1984). Chapter 8 is dated "12 November 1984" and its opening paragraph explicitly places the action on "Monday morning," with the Lucia Gal interview occurring that same morning as the chapter's central event. November 11 is Sunday; November 12 is Monday — one day apart, but a direct contradiction between the two chapters.
  - **Suggested resolution:** Determine which chapter's date is authoritative (chapter 8 has the explicit "Monday morning" prose anchor; chapter 12's "Sunday" is also specific), then align the other. If chapter 8 is correct (Monday 12 November), change "the eleventh, a Sunday" in chapter 12 to "the twelfth, a Monday" and correspondingly update "On the eleventh it was two" to "On the twelfth it was two." Note that this does not resolve Issue A; Issue A must be addressed separately.

## 15-the-name-on-the-list

- **Issue:** Ch15 placed the cellar copy "on Dorobanților, behind the second bloc on Eminescu" — wrong street for Rodica Moga's address.
- **Conflict:** World-store `rodica-moga.address.confirmed` (ch27) = "Strada Crișan, bloc 18, entrance B, third floor left, Dej"; `cellar-woman-building` entity (ch22) places the coal cellar building on Strada Crișan; ch21 fact calls her "Strada Crișan cellar woman." The chapter correctly placed the coal cellar itself on Strada Crișan (consistent with all later chapters) but then contradicted itself by saying the copy was now on Dorobanților.
- **Root cause:** The drafter appears to have picked up "Dorobanților" from the ch12 story-arc summary, which also logs this address incorrectly.
- **Fix applied:** Changed "The cellar copy is on Dorobanților, behind the second bloc on Eminescu" → "The cellar copy is on Strada Crișan" in the final kitchen-lamp section. Touch-point: one sentence only; no prose rhythm altered.
- **Residual:** `logs/story-arc.md` ch12 entry reads "writes the cellar woman's address on Dorobanților." The ch12 draft itself may also say Dorobanților. A continuity pass on ch12 should correct both the draft and the arc line to "Strada Crișan." No structural change required — it is a single place-name substitution in Munteanu's working notes.

## 16-two-branches

- **Issue:** Copy count in the evidence-folder scene is one short.
- **Conflict:** Chapter 4 shows Munteanu placing **two** copies in separate evidence envelopes on Day 7 (November 7): N17 from Rodica Petrescu (the sister-in-law, Strada Gării 41) and a second numbered-line-9 copy from her neighbor on the same street. Both envelopes are explicitly sealed and taken back to the station; the chapter ends with him reading both side by side at his desk. After chapter 8 (N11 from Lucia Gal) he has three copies. Chapter 16 introduces a bracket copy described as collected "four days ago" (≈ Day 16, November 16) during "general canvassing," making four before today. Adding Damian's N10 today should yield **five**. The chapter, however, states "Four copies. He laid them side by side" and lists only: the Gal copy (N11), the sister-in-law's copy (N17), the Damian copy (N10), and the bracket copy. The neighbor's Strada Gării copy — which also has "9. If 7 or 8, take her in in the morning." and differs from N17 only by *beside/by* in line 3 — is missing from the count and from the reading sequence.
- **Suggested resolution:** Change "Four copies" to "Five copies" and insert a brief reading-sequence entry for the neighbor's copy between the N17 entry and the Damian entry (one sentence, format matching the existing pattern: e.g. *"The neighbor's copy, from the seventh of November: 9. If 7 or 8, take her in in the morning."*). Then update "the fourth copy" → "the fifth copy" throughout the remainder of that scene block. This is a drafting-pass fix: the correction requires adding new prose and is outside the scope of a word-level continuity repair.

## 20-seven-copies

- **Issue:** Munteanu's private notebook and the chapter's closing line both use "Dorobanților" for the cellar woman's address.
- **Conflict:** World-store `rodica-moga.address.confirmed` (ch27) = "Strada Crișan, bloc 18, entrance B, third floor left, Dej." The ch15 continuity pass already corrected the same error in that chapter and flagged it as a residual affecting ch12 and the story arc. Ch20 repeats the wrong place-name in two spots: (1) Munteanu's notebook entry *"Address on Dorobanților not yet visited"* and (2) the closing line *"He would go to Dorobanților in the morning."*
- **Fix applied:** Both instances of "Dorobanților" changed to "Strada Crișan." No other prose touched.
- **Residual:** `logs/story-arc.md` ch12 entry and the ch12 draft itself still say "Dorobanților." A continuity pass on ch12 should correct those as well (flagged originally in the ch15 note; not yet done).

## 25-the-questioning-room

- **Fix applied — day-of-week error (November 29):**
  - **Conflict:** The chapter stated "He had planned to go to Strada Crișan on the twenty-ninth — a Sunday visit, the kind that found people at home." November 29, 1984 was a **Thursday** (Jan 1 1984 = Sunday; 333 days elapsed mod 7 = 4 → Thursday). The chapter's own internal timeline corroborates this: the chapter date is December 1, which is Saturday (Dec 1 = Saturday, Nov 30 = Friday, Nov 29 = Thursday). Note: the planned *future* visit ("tomorrow" = December 2) is a genuine Sunday — the author appears to have applied Sunday logic to the wrong date.
  - **Fix:** Removed the false day-of-week clause. Changed "on the twenty-ninth — a Sunday visit, the kind that found people at home" to "on the twenty-ninth." The date itself is correct and consistent with ch 24 (explicitly dated 29 November 1984); only the day-of-week label was wrong.

- **Issue — "twelfth day" for N10 collection conflicts with arc/ch16 evidence (cannot fix without adjacent chapters):**
  - **Conflict:** Ch 25 states "He had been to that address [Strada Mihai 14/B/8] on the twelfth day of the investigation. He had collected the copy he had designated N10 from Viorica Damian there." The story-arc for ch 16 explicitly states "Munteanu collects N10 from Viorica Damian" and gives "fifteen days" until the December 5 deadline (= November 20 = Day 17 of investigation). The arc for ch 12 says only "traces Lucia Gal's referral to Viorica Damian (N10, G3 node, Strada Mihai)" — identifying her, not collecting. This puts N10 collection on Day 17, not Day 12. The "twelfth day" claim likely collapses two visits (Day-12 identification in ch 12; Day-17 collection in ch 16) into one retrospective statement.
  - **Suggested resolution:** Change "twelfth day" to the correct investigation day for the ch 16 collection visit (most likely "sixteenth" or "seventeenth day," depending on the exact date stated in the ch 16 draft). Requires reading ch 12 and ch 16 to confirm before editing ch 25.
