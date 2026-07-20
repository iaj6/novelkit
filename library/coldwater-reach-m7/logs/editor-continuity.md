# Editor — Continuity Pass

Notes from per-chapter review. Chapters with no entry below had no continuity issues.

## 12-found

- **Issue:** Lonzo Reed's prisoner-escort arrival time contradicts the established world-store fact from chapter 2.
- **Conflict:** The world-store records `lonzo-reed.arrival_time.daily = 8:30 a.m.` (sourced from `02-the-icehouse-in-october`). Chapter 12 states `"At six, Lonzo Reed came with the four men."` A simple substitution cannot repair this: chapter 12's closing barn image — *"the sky above the hill was just starting to separate itself from the darkness, gray coming up from the east"* — is internally consistent with a 6 a.m. arrival (Maine February dawn ≈ 6:45–7:00 a.m.) but would be physically impossible at 8:30 a.m., when full daylight has been established for nearly two hours. Either the 8:30 a.m. fact was logged in error from chapter 2, or chapter 12 changed the seasonal schedule without acknowledging it. The chapter's own internal logic supports 6 a.m.
- **Suggested resolution:** Re-read `draft/02-the-icehouse-in-october` to determine whether 8:30 a.m. appears verbatim or was an approximation logged by the drafting agent. If chapter 2 does not explicitly name 8:30 a.m., update the world-store fact to 6:00 a.m. and treat chapter 12 as correct. If chapter 2 explicitly states 8:30 a.m., revise chapter 12's prisoner-arrival paragraph and adjust or remove the gray-dawn image at the close of the barn scene.

## 30-komm-rein

Three clusters of continuity errors, all small substitutions — fixed in place via `write_file`.

### 1. Duration "thirty months" (× 3) → "twenty-four months"
- **Conflict:** POWs arrived April 1943 (canon fact 9); story closes late April 1945 = 24 months. The world store records `pfeiffer-farm.icehouse.tenure.months = twenty-three to twenty-four months as of March 1945` (ch27). The chapter drafted "thirty months" in three passages (the barn-routine duration, Lonzo's familiarity with the hours, the objects accumulated per prisoner).
- **Fix:** All three instances changed to "twenty-four months."

### 2. Duration "three years" (× 3) → "two years"
- **Conflict:** Same arithmetic — April 1943 to April 1945 = 2 years, not 3. Appeared in "every October of the last three years," "Three years and the barn had absorbed all of it," and "the rough walls the renovation had put up three years ago."
- **Fix:** All three instances changed to "two years." (The phrase "his face was the face it had been for thirty months" was also changed to "twenty-four months" as part of cluster 1.)

### 3. Herd size 16 → 45
- **Conflict:** `pfeiffer-farm.herd_size = 45 dairy cows` (ch02, never superseded). The chapter's closing paragraph said "Sixteen cows" and "the sixteen cows waiting for the afternoon milking."
- **Fix:** Both instances changed to "Forty-five cows" / "the forty-five cows."
