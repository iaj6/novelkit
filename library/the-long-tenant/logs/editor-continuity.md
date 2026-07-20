# Editor — Continuity Pass

Notes from per-chapter review. Chapters with no entry below had no continuity issues.

## 02-the-stove

- **Issue:** "Nobody came to that door" is written in the ledger at 8:42 PM — nearly an hour before Cale's knocking — and is explicitly framed as "the last line of the entry," with ~200 words of closing prose built around that moment.
- **Conflict:** Canon items 6, 8, and 11 are definitive. Cale knocked at ~9:40 PM; the knocking stopped at 9:52 PM. Della wrote the ledger entry "during or immediately after the knocking stopped." Record B's fixed wording requires the entry to document the knocking, the recognition ("three years I have not written his name but I knew it"), the refusal, and the 9:52 stop time *before* the final line "Nobody came to that door." None of those knocking elements appear in the chapter 02 entry. The chapter's entry is written an hour too early and is structurally complete at that premature point.
- **Suggested resolution:** Restructure chapter 02 so the ledger-writing scene occurs after 9:52 PM, or remove "Nobody came to that door" and the closing passage that depends on it (ending the chapter on "Each fact in its place"), leaving the canonical writing of the line for a later Della chapter in its proper temporal position (after the knocking in chapter 18).

## 08-the-oil-lamp

- **Issue:** Travel clock visible from the front room contradicts its established upstairs location.
- **Conflict:** Ch08 has Della, standing in the front room (ground floor, where the desk is), looking "through the doorway" to read the travel clock on a mantle at "a few minutes past nine." Three independent anchors place the travel clock upstairs in the back room during the night of February 11, 1983: (1) the world store records `travel-clock: location.1983 = back-room mantle`; (2) the ch14 world store entry explicitly states Della was "aware that going up leads to back room," confirming the back room is on the upper floor; (3) the canonical ledger entry (Record B, fixed text) reads *"I sat here with the travel clock and I did not go down"* — since Della chose not to descend to the front door, she was upstairs when the knocking occurred, and the clock was with her there. A clock on the back-room mantle (upstairs) cannot be read from the front room (downstairs) through a doorway.
- **Suggested resolution:** Cross-check ch14 ("near-quarter-to-ten"), ch18 ("the-sound-of-the-knocking"), and ch22 ("what-she-wrote") to confirm where Della reads the travel clock during the knocking sequence. If those chapters place her upstairs reading the back-room mantle clock, revise the ch08 front-room scene so Della does not read the travel clock there — the time can be implied by context or established when she is upstairs in the same chapter. If, conversely, those chapters place the travel clock on the ground floor, the world store `location.1983` fact and the ch24 attribution should be corrected instead.

## 12-what-she-kept

- **Issue:** Final paragraph breaks Della's canon-mandated first-person present tense (canon/continuity.md fact 17).
- **Conflict:** Canon fact 17 specifies Della's POV as "First-person present tense." The craft log for ch20 and ch22 (both Della chapters) explicitly notes "First-person present tense throughout, zero slip." The final paragraph of ch12 departs into third-person past tense for five consecutive sentences: *"Outside, the storm continued. The cold was already in the walls, coming in from every direction at its own rate. The lamp burned. The ledger was on the table, closed. The cold was the cold."* — none of these are first-person, and all verbs are simple past.
- **Note:** The closing formula "The cold was the cold" also appears in ch20 (within a first-person present passage) and a present-tense variant ("The cold is the cold") appears in ch22 — confirming the formula is an established recurring construction, but that it is normally embedded inside first-person present narration, not inside a third-person past closing paragraph.
- **Suggested resolution:** Voice pass should convert the final paragraph to first-person present tense to match canon POV. Minimal intervention: e.g., "Outside, the storm goes on. The cold is already in the walls, coming in from every direction at its own rate. The lamp burns. The ledger is on the table, closed. The cold is the cold." — or a close equivalent that preserves the rhythm without rewriting sense.

## 16-his-name

- **Issue:** Ledger start date contradicts ch19.
- **Conflict:** Ch16 (Della's POV) states "This ledger runs from January 1979. Nearly five years of entries in my hand." Ch19 (Ellen's POV, world-store fact `ledger_first_entry`) records the ledger's first entry as November 1975, "Cale home, second week of Nov." A ledger beginning in January 1979 cannot have a November 1975 first entry. The "nearly five years" claim in ch16 (January 1979 → February 1983 = 4 yr 1 mo) is also inconsistent with a November 1975 start (which would give ~7 yr 3 mo, i.e., "more than seven years").
- **Suggested resolution:** Determine which chapter holds the canonical start date. If ch19's November 1975 is authoritative (it gives a four-year Cale arc in the ledger, November 1975–October 1979, which better supports Ellen's reading arc in ch19), then ch16 needs two small changes: "January 1979" → "November 1975" (or "the autumn of seventy-five") and "Nearly five years" → "more than seven years." If ch16's January 1979 is authoritative, then ch19's first-entry fact must be revised to a date after January 1979.

- **Note:** A separate small fix was applied directly in ch16: "four years and ten months of entries, and his name is not in any of them" (appearing twice) was corrected to "three years and four months of entries, and his name is not in any of them." The original figure was internally inconsistent — it contradicted "Three years I have not written his name" in the immediately preceding sentence and is arithmetically wrong (October 1979 → February 1983 = 3 yr 4 mo, not 4 yr 10 mo). The corrected figure also aligns with the canonical Record B phrasing ("three years I have not written his name").

## 24-the-door-open

- **Issue (SMALL — already fixed):** Clock face colour. The chapter described "a brass face" on the travel clock.
- **Conflict:** Chapter 14 (`markey-travel-clock` entity, world-store fact `face_description`) established the clock as having "a cream-colored face, black numbers, dark wood case." A brass face is irreconcilable with a cream-coloured face.
- **Resolution applied:** Changed "a dark wood case with a brass face" → "a dark wood case with a cream-colored face" in the chapter file. No other prose changed.

---

- **Issue (UNFIXABLE from ch 24 alone):** Travel clock location — back-room mantle vs. front-room mantle.
- **Conflict:** Chapters 14 and 18 establish the clock's standing location as "on the mantle in the front room" (world-store facts `markey-travel-clock:location_in_della_chapters` from ch 14 and `della-travel-clock:location` from ch 18). Chapter 24 places the clock "on the mantle of the small back-room fireplace" and builds a narrative beat around Ellen going upstairs to retrieve it and carrying it down to the desk. The two are irreconcilable without restructuring.
- **Suggested resolution:** Either (a) add a moment in a Della chapter (ch 14, 16, 18, or 20) where Della moves the clock to the back room on the night of February 11 (consistent with the ledger's "I sat here with the travel clock" — she carried it upstairs when she retreated), then all subsequent chapters are correct; or (b) restructure the ch 24 retrieval beat so the clock is already in the front room and Ellen moves it from the front-room mantle to the desk rather than from the back room downstairs.

---

## 24-the-door-open (adjacency: ch 23)

- **Issue:** Address in the ch 23 coroner's report excerpt.
- **Conflict:** Chapter 23 quotes the coroner's report as giving the address "14 Verrill Street, Renick, West Virginia." The world store established the street number as "412 Verrill Street" from chapter 11 (fact `verrill-street-house:street_number`). Chapter 24 correctly uses "412 Verrill Street." The address "14" in ch 23 is inconsistent with the established canonical address and with ch 24's use.
- **Suggested resolution:** In draft/23-the-two-records.md, change the single instance of "14 Verrill Street" in the coroner's report passage to "412 Verrill Street." This is a small in-chapter fix to ch 23.
