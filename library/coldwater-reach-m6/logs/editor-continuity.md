# Editor — Continuity Pass

Notes from per-chapter review. Chapters with no entry below had no continuity issues.

## 13-displaced-scholars

- **Issue:** Marcus's desk drawer described as containing "the letter Werner had written to Albrecht Pfeiffer, now in its original envelope" — but he gave the physical letter (envelope and all) to Albrecht in chapter 9.
- **Conflict:** Ch. 9 ends unambiguously with "The pocket, empty now" after Marcus returns from the farm; the letter was handed over during the barn-door scene. Ch. 13 cannot therefore have the original letter in his classroom drawer.
- **Fix applied:** Changed "the letter Werner had written to Albrecht Pfeiffer, now in its original envelope" to "his transcription of the letter Werner had written to Albrecht Pfeiffer, set down before returning the original in January." The three-document count and the drawer motif are preserved; the fix is consistent with Marcus's established carefulness and with the story-arc entry for ch. 16 ("locks everything in the drawer"), which references his assembled account rather than the original letter.

## 15-what-grandy-soule-saw

- **Issue:** Eira's dock sighting is placed two nights before the body, not one, diverging from canon #4.
- **Conflict:** `canon/continuity.md` fact #4 states "Eira saw something on the dock **the night before the body came in**." Chapter 15 places the sighting on "October 10 going into the eleventh, past midnight" (i.e. ~0055 on October 11) and explicitly calls the body's arrival "two days later" (morning of October 12, 1943). This is internally consistent with world-store facts from subsequent chapters: Ch 21 records Lonzo's sighting of Werner Grau on October 11 at ~23:00 near the Pfeiffer farm, and Ch 29 records the harbor-log addendum with a "0055" timestamp — both of which presuppose the Oct 10/11 date for the dock observation. Changing Ch 15 to match canon would therefore break Ch 21 and Ch 29.
- **Suggested resolution:** Treat canon #4's "night before" as an imprecise early description superseded by the drafted timeline. Update `canon/continuity.md` fact #4 to read: "Eira saw something on the dock **approximately two nights before the body came in** (the night of October 10 going into October 11)."

- **Also fixed in this pass (small):** Soule's description of the dinghy as a "fiberglass tender" (original text) was an anachronism — fiberglass boat hulls did not exist in 1944. Changed to "wooden tender."

## 23-one-year

### Fixes applied (write_file)

- **"fourteenth" → "twelfth" (chapter date).** The chapter opened with "It was the fourteenth of October" and framed it as the one-year anniversary of the body. The body's discovery date is established as October 12, 1943 (world store: `man-on-breakwater:discovery.date`, set ch01; confirmed in ch22 narration "the body arrives on the breakwater on the morning of the twelfth"). The one-year mark is therefore October 12, 1944, not October 14. The chapter's own internal text — Marcus's assembled account includes "The body on the morning of the twelfth" — made the contradiction self-contained. Fixed by changing the opening date phrase.

- **"March of 1944" → "May of 1944" (date Marcus wrote his Werner account).** The chapter said Marcus "put this on a sheet of school paper in March of 1944." The world store records from ch16: `werner-grau:marcus_plausible_account.written = May 1944` — "concluding paragraph added to Marcus's school-paper notes." May 1944 is the established date; "March" contradicts it. Fixed.

### World-store entries to reconcile (not prose fixes — requires a store-pass)

The ch23 drafter stored two facts that now conflict with the corrected chapter text:
- `marcus-klein:breakwater.first_walk = October 14, 1944` — should be October 12, 1944 after the date fix.
- `marcus-klein:werner_account.last_opened = March 1944` — should be May 1944 after the month fix. Also conflicts with the ch16 fact `werner-grau:marcus_plausible_account.written = May 1944`.

### Observation to verify (not changed)

Marcus thinks "More than twenty years since Bamberg, where a photograph had been taken…" Marcus reads Werner's letter in ch06 and assembles his account through ch16; the Bamberg photograph ("W. Grau, A. Pfeiffer, Bamberg, 1921") is found by Hannah in ch14 and not disclosed to Marcus until ch28. The world store does not record Bamberg appearing in Werner's letter text. If the letter did not mention Bamberg, Marcus cannot know this detail in ch23. Author should confirm whether Werner's letter (read by Marcus in ch06) referenced Bamberg; if not, the passage needs revision. Not fixed here because the letter's full text is not in the store and the reference may be intentional.
