# Editor — Continuity Pass

Notes from per-chapter review. Chapters with no entry below had no continuity issues.

## 08-shorter-letters

- **Issue:** Kirchheim-to-Amberg distance stated in the chapter conflicts with hard canon.
- **Conflict:** `canon/continuity.md` §8 gives the distance as "approximately 50 kilometres" (≈ 31 miles). `logs/continuity.md` (entry 2026-05-14T18:54:30.799Z) gives it as "approximately 35–40 miles." The chapter text reads *"thirty-five, forty miles from Amberg"*, matching `logs/continuity.md` but not `canon/continuity.md`. The two canon sources are mutually inconsistent; the chapter cannot satisfy both simultaneously.
- **Suggested resolution:** Author should pick one figure and propagate it to both `canon/continuity.md` §8 and `logs/continuity.md`, then correct the chapter to match. If 50 km is authoritative, change the chapter to read "thirty miles or so from Amberg"; if 35–40 miles is intended, update `canon/continuity.md` §8 to read "approximately 55–65 kilometres."

## ch17-the-log-entry

Three small continuity breaks found and corrected via `write_file`. No unfixable conflicts.

---

### Fix 1 — October 14 log entry: wrong text, wrong times, wrong station
- **Conflict:** `logs/continuity.md` records the exact canon text of the October 14 harbor log entry as: *"Body discovered on north breakwater, 0612. USCG notified and present 0740. Body removed 0830. Breakwater clear."* The draft had a completely different version with wrong discovery time (0645 vs. 0612), wrong notification time (0710 vs. 0740), wrong removal time (1115 vs. 0830), an extra body-description line not in the canon entry, and listed Farris's unit as "CGS Portsmouth" — contradicting the established canon fact that Farris is from Rockland station.
- **Fix:** Replaced the October 14 entry block with the exact canon text. The Farris/Portsmouth error disappears with it.

---

### Fix 2 — "twelve years as harbormaster"
- **Conflict:** Canon (§2, `canon/continuity.md`) establishes Eira as harbormaster since **1936**. Chapter 17 is set in May 1944 = **eight years** in the role. The draft read "twelve years as harbormaster."
- **Fix:** Changed "twelve" to "eight."

---

### Fix 3 — "bought it in 1929" vs. "twenty-three years"
- **Conflict:** Internal chapter inconsistency. "She had lived here for twenty-three years" (1944 − 23 = **1921**) contradicts "She and Owen had bought it in **1929**" (1944 − 1929 = only 15 years). No external canon anchor fixes the purchase year; the 23-year figure is the more specific and evocative claim, and changing the year to 1921 also makes the 12-year mortgage clear in 1933 (Depression-era, consistent with the period). No canon fact is broken by either choice.
- **Fix:** Changed "1929" to "1921."

## ch24-contract-review

### Fix applied — English-only policy date (September → November; October → December)
- **Conflict:** The chapter referred to "the September 1943 English-only policy," "The memo from the September 1943 board meeting," and "a note from Wakefield acknowledging same, dated October 1943." `logs/continuity.md` (entry 2026-05-14T18:46:01.685Z) establishes the policy was enacted "in mid-to-late November 1943." A September memo and an October acknowledgment are both chronologically impossible.
- **Fix:** Changed both instances of "September 1943" to "November 1943" and "dated October 1943" to "dated December 1943."

---

### Unfixable conflict — Cambridge letter stored in home desk, not school desk
- **Issue:** The Cambridge Extension School offer letter is stored in and read from Marcus's home desk throughout the chapter.
- **Conflict:** `logs/continuity.md` (entry 2026-05-14T19:15:39.386Z) states: *"The bottom drawer of Marcus's school desk is established as the place where significant withheld correspondence is kept — it will also hold the Cambridge job offer in Ch 24."* Three distinct scenes in Ch 24 anchor the letter at the home desk: "He put it in the desk drawer. He did not tell Henry" (home context); "He went to his room. He sat at the desk. He opened the drawer"; and "That evening he went home and opened the drawer." Correcting this would require relocating the letter to the school and restructuring all post-board-meeting reading scenes, which is a structural change.
- **Suggested resolution:** Either revise Ch 24 so the letter is filed in the school desk and the late-chapter re-readings are staged at the school (after hours), or update `logs/continuity.md` to designate the home desk as the secondary withheld-correspondence location, ensuring the March 1944 Ellenbogen letter (school desk) and the October 1944 Cambridge letter (home desk) are distinguished as separate objects in separate drawers.

## ch25-one-year

Two small continuity breaks found and corrected via `write_file`. No unfixable conflicts.

---

### Fix 1 — Farris's time-of-death finding: "sometime during the blow" → "at the tail end of the blow, or just after it"
- **Conflict:** The draft read *"she was not a coroner and Farris had not shared the coroner's findings beyond *sometime during the blow*."* `logs/continuity.md` (entry 2026-05-14T18:38:37.041Z) establishes: *"He died at the tail end of the blow (approximately October 13, 1943) or just after it — not during the blow's peak on October 12."* The Ch 4 story-arc entry confirms: *"Farris … reveals the man died after the blow, not during it."* Eira's memory of Farris's finding as "sometime during the blow" directly contradicts what Farris told her in Ch 4.
- **Fix:** Changed the clause to read: *"she was not a coroner and Farris's finding had been only that the man died at the tail end of the blow, or just after it."*

---

### Fix 2 — Kahl's description of his missing brother: "age roughly thirty" → "age roughly forty-five"
- **Conflict:** The draft had Eira recalling Werner Kahl describing his missing brother as *"age roughly thirty."* `logs/continuity.md` (entry 2026-05-14T19:50:19.030Z) establishes that the photograph Kahl showed Eira depicted *"a man (approximately 45, dark-haired, European studio portrait)."* "Roughly thirty" is approximately fifteen years short of the canon figure.
- **Fix:** Changed *"age roughly thirty"* to *"age roughly forty-five."*

## 29-the-good-cloth

- **Issue:** Albrecht's first English sentence at the family table is spoken in the kitchen, not at the dinner table.
- **Conflict:** Canon (`logs/continuity.md`, entry 2026-05-14T20:29:13.778Z) states explicitly: *"Albrecht Pfeiffer's formal break from his English silence occurs at the dinner table on Will's first night home: he says 'I'm glad you're home, Will.' in English, and adds a second sentence in English to the dinner grace — 'And thank you for bringing William home.' These are the first English sentences he has chosen at the family table in over two years."* In the chapter as drafted, "I'm glad you're home, Will." is spoken in the kitchen doorway at Will's arrival — before they sit to eat. The chapter even annotates the line as "the English he had not chosen at the family table in more than two years," signaling awareness of the canon fact while mislocating the scene. The dependent paragraph ("The words were right. They were the right words in the right order…") and Will's reply ("Me too, Pop.") are anchored to this misplaced utterance and would also need revision.
- **Suggested resolution:** Remove "I'm glad you're home, Will." and its dependent paragraph from the kitchen greeting scene (leave the greeting as Albrecht's wordless hand-on-shoulder and Will's "Pop."), then insert "I'm glad you're home, Will." at the dinner table — most naturally before or immediately after the grace — so that both canonical English utterances occur at the table in the same scene.

*(Note: the grace truncation — *Komm, Herr Jesu, sei unser Gast* missing *und segne, was du uns bescheret hast* — was a separate small fix and has already been corrected in the chapter file.)*
