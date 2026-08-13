# Verbatim-Fidelity Certificate — The Probate of Eccleston

Post-run, post-repair scan (2026-07-23): every document registered in the world store
(`logs/world/events.jsonl`) checked for exact-text fidelity against every full quotation
in the effective manuscript (draft/ overlaid by revision-1/). Whitespace-normalized,
emphasis-stripped exact substring match. Report-only; one book; not a pipeline detector.

**16 registered records — 16 verbatim-faithful. Zero drifted quotations.**

Two drifts existed pre-repair (the September strong-room register entry in ch 1 and ch 5),
were caught by the continuity-fact audit as auto-repair-safe findings, and were corrected
to the canonical text by `repair-fact-normalize` in `revision-1/`.

| record | label | quoted in full (chapters) |
|---|---|---|
| `ch17-working-note` | Prescott's working-file note on the recital variance, 18 July 1927 | 17 |
| `firm-notice-letter` | Garside & Prescott to Walter's solicitors (Thurston & Marsh), 2 November 1926 — typed on firm paper | 2, 6 |
| `first-codicil` | First codicil to the will of Josiah Eccleston (executed 15 March 1924) | 1 |
| `garside-1924-attendance-note` | Garside & Prescott attendance note, 15 March 1924 — Josiah Eccleston codicil instructions | 3 |
| `garside-covering-letter-march-1924` | Garside to Josiah Eccleston, 14 March 1924 — covering letter with first codicil | — (referenced, never fully quoted) |
| `josiah-letter-to-margaret-mar1924` | Josiah Eccleston to Margaret Fairhurst, 15 March 1924 — Exhibit A | 4 |
| `josiah-nora-letter-april-1926` | Josiah Eccleston to Nora Fairhurst, 3 April 1926 — key passage | 7 |
| `mill-daybook-may14` | Vale Mill daybook entry, 14 May 1926 — Josiah Eccleston's last confirmed visit | 9 |
| `prescott-canvass-note-feb1927` | Profession canvass consolidated note, 24 February 1927 | 8 |
| `prescott-machine-note-mar1927` | Prescott working note — machine finding, approximately 20 March 1927 | 10 |
| `prescott-working-note-jan27-1927` | Prescott working note, 27 January 1927 — door (f) closed | 7 |
| `second-codicil` | Second codicil to the will of Josiah Eccleston (dated 14 August 1926 — propounded by Walter's solicitors; forged) | 2, 16, 17 |
| `september-register-entry` | Strong-room register entry, 19 September 1926 — First Codicil of J. Eccleston | 1, 5 |
| `the-will-clause-4` | Will of Josiah Eccleston — Clause 4 (executed 3 June 1919) | 1 |
| `walter-bank-letter` | Walter Eccleston to Mr. Holt (bank manager), 11 June 1925 — handwritten | 11, 17 |
| `working-note-ch6-firm-channel` | Prescott working note — firm channel finding, 14 January 1927 | 6 |

Of the 16 records, 5 were pinned verbatim in the brief; the other 11 were registered by
the architect and drafters on their own initiative during the run.
