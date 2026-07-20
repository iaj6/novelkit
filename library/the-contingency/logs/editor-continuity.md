# Editor — Continuity Pass

Notes from per-chapter review. Chapters with no entry below had no continuity issues.

## 12-staging-area

- **Issue:** "Sixty-three days" at Ch12 contradicts the established compound-stay count
- **Conflict:** `logs/continuity.md` (2026-05-30T04:49:03.053Z) establishes that Brandt has been on the compound for **sixty-three days at the time of Chapter 2** — the Day-before chapter, before the Contingency list even exists. Chapter 12 is the send-off night, several weeks into the Approach section after the list was posted. The draft text reads: *"He'd seen those windows from the drill space every evening for sixty-three days and had mostly stopped seeing them."* If this refers to total compound time, the number is wrong — it should be considerably larger (the training cycle after the list-posting is approximately eight weeks per the Ch10 story-arc note, putting total compound time at roughly 120+ days by Ch12). If it is meant to count only the days since the mission-specific drill sequence began (i.e., since the list was posted), the figure is still not confirmed by any log entry, and the "eight weeks" approximation for the training cycle yields ~56 days, not 63.
- **Suggested resolution:** Author should determine the canonical total compound-day count at Ch12 (approximately 120 days, based on 63 days at Ch02 + ~2 days to list-posting + ~56-63 days of the Approach cycle) and update the number in the chapter. Alternatively, if the intent is to count only from the start of the mission-specific drill sequence rather than from compound arrival, that count should be reconciled against the training-cycle duration already established in the arc and logs. The number 63 is not defensible at Ch12 under any reading currently supported by canon.

## 13-the-yard

- **Issue:** Distance from outer chain-link to inner barrier stated as twelve/fourteen feet — contradicts canon's eight feet.
- **Conflict:** `logs/continuity.md` (2026-05-30T04:34:53.333Z) establishes *"The inner barrier stands 8 feet back from the outer chain-link."* The chapter contained four non-canonical measurements for this same depth:
  1. *"the outer chain-link of the containment perimeter, fourteen feet to the inner barrier's enclosure"*
  2. *"She moved to the outer barrier. Twelve feet from the veil's face."*
  3. *"the veil face at twelve feet, the outer chain-link at arm's reach"*
  4. *"arm's reach from the outer chain-link, twelve feet from the inner barrier's canvas face"*
  All four instances describe the depth from the outer chain-link to the inner barrier / veil face — the same measurement the canon fixes at eight feet.
- **Resolution applied:** All four instances corrected to **eight feet** via `write_file`. The unrelated lateral-width measurement (*"The outer chain-link ran fourteen feet from the left concrete corner to the right"*) was left unchanged, as no canon fact constrains the fence's left-to-right span. All other facts in the chapter — 80-metre service corridor, veil-gap dimensions and position, thermal probe status, specimen mass and orientation, five directional weight shifts, vocalization effects, tinnitus baseline, field-log and formal-record open/unwritten state — confirmed clean.

## 14-the-platform

### Issue A — Roll-call position: Farrow labelled "eleventh name" (canon: 10th) — **FIXED**

- **Conflict:** `logs/continuity.md` (2026-05-30T08:17:09.660Z) establishes: *"Farrow is the 10th name called in the roll call — three positions ahead of Brandt in the formation."* and *"Brandt is the 13th name called — second-to-last."* The draft contained an extraneous activation beat inserted between Haverford (9th) and Farrow: the president's voice comes through the wall, the platform fires, and Brandt counts *"Ten."* / *"He held two."* — implying an unnamed 10th person before Farrow. This pushed Farrow to the 11th slot (*"The eleventh name started … Corporal Farrow, R."*), which in turn pushed Brandt's position to 14th (last) — contradicting canon. No person exists in the staging corridor between Haverford and Farrow (the formation order places Farrow immediately after Haverford toward the hall end, with Delgado and Osei as the only names between Farrow and Brandt).
- **Resolution applied:** The extraneous paragraph (*"The president's voice came through the wall … Ten. He held two."*) was removed. *"The eleventh name started"* was changed to *"The tenth name started"* via `write_file`. The chapter now correctly runs: Haverford (9th) → Farrow (10th) → Delgado (11th) → Osei (12th) → Brandt (13th) → Tafoya (14th, read while Brandt is on the slab).

### Issue B — "Sixty-three days" reused from Ch02 — **NEEDS AUTHOR RESOLUTION**

- **Conflict:** *"He'd seen the lit windows from the drill space every evening for sixty-three days."* The figure 63 is established in `logs/continuity.md` (2026-05-30T04:49:03.053Z) as Brandt's compound-stay count **at the time of Chapter 2** — the Day-before chapter, before the Contingency list exists. Chapter 14 is the send-off ceremony night, situated after approximately eight weeks of post-list accelerated training. Deriving from canon: 63 days (Ch02) + ~1 day (list-posting) + ~56 days (8-week drill cycle, confirmed by Brandt's own interiority in this chapter: *"eight weeks of drills and everything the compound had been for"*) puts total compound time at roughly **120 days** by the ceremony night. The same error was flagged at Ch12 (see entry above) and remains unresolved. This is the second instance of the frozen day-count.
- **Suggested resolution:** Author should establish the canonical total compound-day count at the ceremony night (approximately 120 days based on derivable timeline) and update both Ch12 and Ch14 consistently. The number 63 is not defensible at either chapter under any reading supported by canon.

## 15-dead-morning

### Fix A — "inner gate" → "outer gate" — **FIXED**

- **Issue:** Observation position described as "three feet back from the inner gate."
- **Conflict:** `logs/continuity.md` (2026-05-30T04:34:53.333Z) establishes the stool position as *"3 feet back from the outer gate during observation sessions."* The inner structure has no gate — it is canonically the "inner barrier," and its only maintenance access was welded shut in study month 5. "Inner gate" is a non-canonical term; the reference point for the standard observation position is the outer gate, not the inner barrier.
- **Resolution applied:** *"Standard position: three feet back from the inner gate"* corrected to *"Standard position: three feet back from the outer gate"* via `write_file`. All other facts in the chapter (service-corridor length, stair, kitchen passage, tinnitus frequency, hall acoustic description, three linen grades, honor guard branch, platform dimensions, veil configuration, five activation-correlated behavioral shifts, vocalization pressure surfaces, acoustic monitor earpiece pocket, field-log and formal-record open/unwritten state, four irreconcilable interpretations, 0300 yard timing) confirmed clean against canon.

### Fix B — "nine additional months" → "several additional weeks" — **FIXED**

- **Issue:** The chapter states Reyes had *"nine additional months of sessions"* between the Ch03 cognitive bias result and the Ch15 ceremony-night observation.
- **Conflict:** `logs/continuity.md` (2026-05-30T05:02:44.634Z) establishes: *"The Contingency has been officially designated and the send-off dinner is scheduled for several weeks after Ch03."* The Approach section (Ch03–Ch10) is further bounded by *"several weeks into the Approach section"* at Ch06 and *"the dinner is three days away"* at Ch08 — placing the full Approach at approximately 5–9 weeks. Ch03 to Ch15 (the morning after the ceremony) is therefore several weeks plus one night, not nine months. This is the same class of frozen-timeline error previously flagged at Ch12 and Ch14 (the "sixty-three days" compound-stay problem) applied to the Reyes thread.
- **Resolution applied:** *"nine additional months"* corrected to *"several additional weeks"* via `write_file`. The structural echo between the Ch03 two-of-three result and the Ch15 two-of-three result is preserved; only the erroneous duration qualifier is corrected.
