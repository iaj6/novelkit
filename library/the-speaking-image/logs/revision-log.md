# Revision Log

Every applied revision item, in order, with its post-condition result.

## rev-001 — applied
**Fix §11 apparatus footnote: doc. 107 → doc. 41**
- findings: continuity-fact-001, continuity-fact-audit-001
- chapters: 11-the-echo
- The footnote to Document 45 in §11 currently reads 'see doc. 107, reproduced at §26.' Every other source in the manuscript uses 'doc. 41': §26's Sefton memo quotes this same footnote verbatim as 'doc. 41, reproduced at §26'; Document 139 bears internal reference LTL-2027-041; Reyes's Document 151 says 'She flags the §11 footnote, which cited doc. 41 before doc. 41 was dated'; the registered reyes-final (Document 153) says 'The §11 footnote citing doc. 41 before doc. 41 was dated.' The §11 text is the sole outlier. The audit considers whether this might be Reading B (compiler deliberately altered the footnote from 41 to 107), but that reading requires Sefton to have quoted a different version of the footnote than the compiled text shows — and Sefton notices no such discrepancy. Reading A (production typo) is overwhelmingly parsimonious. C1, the book's earliest auditable apparatus crack, is the forward citation that requires prior knowledge of the complete arrangement. C1 is inert if the document number in §11 does not match the document at §26. This is the single most critical fix in the manuscript.


## rev-002 — applied
**Restore two missing sentences in §3 from the registered reyes-first record**
- findings: continuity-fact-audit-002
- chapters: 03-the-count-opens
- The registered canonical record reyes-first includes the sentences 'The user is asking for guidance. The output gives guidance.' between 'That phrase is not addressed to the user in front of the screen.' and 'It is also addressed to whoever reads this record later.' The §3 printing (Document 9) omits them. Without them, 'also' in 'It is also addressed to whoever reads this record later' has no referent — the logic is that the phrase addresses the user (guidance) AND the later reader (address anomaly), and without the first horn, 'also' is stranded. The registered record is the canonical authority per the brief; §3 must match it.


## rev-004 — applied
**Reframe §9 translator notes as working-copy exhibit so §30's clean reprinting is legible as apparatus crack C5**
- findings: continuity-fact-002, continuity-fact-audit-003
- chapters: 09-the-fragment
- The continuity.md brief requires the Hermopolis fragment to be 'reproduced character-identical at §9 (first printing) and §30 (second printing).' §30 matches the registered record exactly (no translator notes). §9 (Document 39) embeds two translator notes inline in the fragment text. This creates an apparent discrepancy — but the correct reading of the apparatus design is that the divergence IS intentional: C5 is the crack where §30 reprints the fragment stripped of Sefton's annotations, signaling the compiler's editorial hand (the same hand that organizes for comprehension rather than provenance). The problem is not that §9 has notes; the problem is that the notes are currently embedded inline within the fragment text, making them look like part of the text rather than Sefton's working-copy apparatus. If the document header of Document 39 makes explicit that this is Sefton's annotated working copy (not the bare text), and if the translator notes are formatted clearly as apparatus — notes about the text rather than embedded in it — then: (a) the base text of the fragment is character-identical in both printings; (b) the §30 omission of the notes is legible as the compiler stripping Sefton's apparatus; (c) the 'character-identical' brief requirement is satisfied at the text level. The translator note content is praised by multiple lenses and must be preserved — literary finds it formally precise, authenticity finds it characterizing. Only the presentation changes.


## rev-005 — applied
**Strengthen C4 in §16: elevate past-tense Sefton reference to sentence level**
- findings: structural-failure-001
- chapters: 16-the-telemetry-memo-b
- C4 is the apparatus crack where exactly once, in §16, a headnote refers to Sefton in the past tense, violating the tenseless-editorial convention the apparatus has maintained throughout. The crack's power depends on a reader tracking the convention noticing the violation. The current implementation — 'Documents 70–73 cover the response to an inquiry Dr. Sefton had submitted on 3 September' — buries 'had submitted' in a list-description phrase. In this syntactic position, 'had submitted' reads as ordinary sequence narration rather than as the apparatus breaking its own convention. The tenseless register is: 'The response to Dr. Sefton's inquiry of 3 September is Document 70.' A past-tense violation at sentence level — a standalone apparatus sentence that uses a past-tense predicate where the apparatus always uses present — would be conspicuous to a reader who has absorbed the tenseless convention across 16 chapters. A buried participial verb in a list phrase is not. C4 in its current form is inert, and it is one of the five apparatus cracks on which the compiler-reveal depends.


## rev-006 — applied
**Add section subtitles to §§10–18, 26, 27, and 30**
- findings: cold-read/airport.json: section headers 10-18 and 26-27 missing subtitles, filenames carry missing titles, cold-read/verisimilitude.json: chapters 10-18 lack descriptive subtitles in text headers, cold-read/comparative.json: missing titles in document headers while filenames supply them, cold-read/ordinary.json: chapters 10-18 missing thematic subtitles
- chapters: 10-after-the-session, 11-the-echo, 12-the-gates, 13-the-introduction, 14-the-redactor, 15-the-telemetry-memo-a, 16-the-telemetry-memo-b, 17-launch-eve, 18-launch, 26-doc-41, 27-not-in-the-corpus, 30-the-join
- Five of seven panel lenses and the audit independently confirm that chapters §§10–18 carry only '# §10', '# §11', etc. in their text-level headers, while §§1–9 and §§19–25 and §§28–29 carry descriptive subtitles ('§1 — The Compiled Record', etc.). Chapters §26, §27, and §30 are also missing subtitles. The filenames carry the missing titles (*after-the-session*, *the-echo*, *the-gates*, *the-introduction*, *the-redactor*, *the-telemetry-memo-a*, *the-telemetry-memo-b*, *launch-eve*, *launch*, *doc-41*, *not-in-the-corpus*, *the-join*) — which is the trace left when a pipeline generates titles not propagated to document text. This is a production artifact. If intentional (narrative titles receding during the institutional machinery phase), the text provides no signal to make the omission legible as a device rather than an anomaly; the pattern does not follow the narrative arc (subtitles are present in §§19–25 where the horror is just as present). Adding the subtitles aligns these chapters with the book's established formatting convention.


## rev-008 — applied
**Add a brief Reyes log entry to §15 signaling the split-redaction discrepancy before §16**
- findings: cold-read/panel.md: move Reyes's split-redaction note to between the two documents, cold-read/propulsion.json: §15–16 weakest; note arrives too late, cold-read/ordinary.json: §15–16 most likely put-down point, note arrives too late to redeem experience
- chapters: 15-the-telemetry-memo-a
- The split-redaction device — two copies of LGL-2027-MGL-004 with the Section 4 redaction in different positions, together revealing the Schedule B text — is one of the book's most formally precise moves. But Reyes's discovery log (Document 72, §16) arrives after the reader has already finished both documents. A reader who has not noticed the redaction positions differ will experience §16 not as a structural revelation but as a second read of a document they just read. The panel (propulsion, authenticity, ordinary, airport — five of seven lenses) identifies §§15–16 as the manuscript's likeliest abandonment point, and the audit correctly identifies that moving the discovery note earlier converts the slog from passive endurance to active confirmation. The fix is not to remove Document 72 from §16 (it must remain there as the verification of what Reyes noticed); it is to add a brief log entry at the end of §15 in which Reyes notes — without full confirmation — that something looks off between the two copies of the memo, and that he intends to compare them. This converts §16 from a second reading of unfamiliar text to the payoff of a setup the reader already holds.


## rev-010 — applied
**Add a single institutional trace of Casperson after her departure in §12**
- findings: cold-read/literary.json: Casperson cleared away too efficiently; broken memo wants fuller sense of person, cold-read/ordinary.json: a thread picked up and put down without being paid off; no rumor of her afterward
- chapters: 12-the-gates
- Casperson produces three memos of increasing precision, resigns mid-sentence, and disappears from the record entirely. Literary and ordinary both find this too clean: the broken third memo is the novel's most powerful formal device, and its weight depends in part on the person who stopped writing having weight. The panel recommends a single institutional reference dated after her April 2027 departure — a conference listing, a billing entry, a one-line acknowledgment — that shows she continued her professional life outside the record. This makes the record's silence about her frightening (she went on; the record did not follow her) rather than simply sparse (she stopped; no trace persists). The fix is deliberately small: one line or a brief document header is sufficient. §12's Document 49 already references 'The Casperson consulting engagement — referenced in the consultation record at Documents 5 through 11 — concluded in April 2027 and is recorded as complete.' A footnote to this sentence, or a brief subsequent routing notation in §12, is the correct vehicle. Do not expand her active role in the consultation, and do not give her a perspective — she must remain outside the record even as a trace proves she survived it.


## rev-006 — postcondition amendment (manual, logged)
rev-006 titled all bare headers including §30 ("§30 — The Join"). Reverted §30 to bare "# §30":
canon fact 12 (C5) pins §30 as carrying no compiler framing of any kind, and with 29 of 30 sections
now titled, the single untitled final section is legible as the compiler falling silent — the
panel's own "make the omission legible as a device" alternative. Also avoids pre-naming the reveal.

## rev-003 — applied
**Standardize gate names and dates across §§12, 15, and 17**
- findings: cold-read/verisimilitude.json: gate review documentation is internally contradictory across three documents, cold-read/audit.md: gate naming and date contradictions confirmed, scope larger than synthesis acknowledges
- chapters: 12-the-gates, 15-the-telemetry-memo-a, 17-launch-eve
- The novel's horror requires the institutional documents to be trustworthy props — the deliberate apparatus cracks register as anomalies against a reliable bureaucratic ground. Gate 3 currently has three different names ('Red-Team and Capability Review' in Document 51; 'Red Team and Capability Review' in Document 67; 'Post-Training Quality Review' in Document 74) and three different completion dates (5 September 2027 in Document 51; 5 August 2027 in Document 67; 22 July 2027 in Document 74). Gate 1 has two completion dates (20 August 2027 in Document 67; 21 June 2027 in Document 74). Document 67 omits Gate 2 entirely. These are not apparatus cracks — no character notices them, no retrieval check surfaces them, no plot point depends on them. The deliberate cracks (the November 2 date, the §11 forward citation, Schedule B, the pronoun-stripped §30 fragment, the preface voice) are distinguishable precisely because the institutional ground is consistent everywhere else. Where it is not consistent, readers lose the signal. The audit's most important diagnosis — that readers cannot distinguish deliberate cracks from production errors — is directly addressed by this fix. Canonical values: Document 51 is the actual Gate 3 sign-off form and is authoritative for Gate 3 name ('Red-Team and Capability Review') and date (5 September 2027). Document 67 is authoritative for Gate 1 date (20 August 2027) as the Deployment Review Coordinator's real-time gate tracking document; Document 74's June 21 date is incompatible with the September 14 launch timeline at any plausible gate-1 definition. Document 49 establishes Gate 2 completion at 2 September 2027 (consistent with Document 67). Document 52 establishes Gate 4 completion at 13 September 2027.


## rev-007 — applied
**Normalize all SHA-256 hash strings to exactly 64 hexadecimal characters**
- findings: cold-read/verisimilitude.json: SHA-256 hashes not consistently 64 hex characters across Documents 24, 27, 32, 38 and others, cold-read/comparative.json: SHA-256 hash length inconsistencies at 62 and 76 characters, cold-read/audit.md: hashes confirmed wrong length at 62, 66, and 72 characters in specific chapters
- chapters: 03-the-count-opens, 06-second-consultant, 07-the-number-that-isnt, 08-the-sum-she-destroys, 09-the-fragment, 10-after-the-session, 11-the-echo, 12-the-gates, 15-the-telemetry-memo-a, 16-the-telemetry-memo-b, 17-launch-eve, 18-launch, 28-for-whoever-collates-this
- Reyes explicitly states: 'if someone collates this eventually, the hashes will tell them the logs were kept properly.' A hash string of the wrong length cannot demonstrate integrity — it signals the opposite. SHA-256 produces exactly 64 hexadecimal characters. Multiple entries across the manuscript have hash strings that do not meet this requirement: Document 38 (§9) is 62 characters; Document 46 (§11) is 66 characters; Documents 64 (§15, both entries) are 66 characters; Documents 72 (§16) entries are 68 and 70 characters respectively; Document 74 (§17) entries per the audit are 72 characters; §3 has a 62-character entry per comparative's finding. Verisimilitude flags Documents 24, 27, 32, and 38 as short. A technically literate reader — exactly the reader this book courts — will count the first wrong hash and lose confidence in the prop. These are production errors, not apparatus cracks: no character notices them, no plot point depends on them, and unlike the deliberate date discrepancy, they carry no internal discussion. They degrade the same prop Reyes says is the record's guarantee.


## rev-009 — applied
**Restore B2 voice register to §29 with one or two wit beats in the script body**
- findings: character-voice-drift-001
- chapters: 29-ask-anything
- Sefton's Ordinary Time scripts establish a consistent public register (B2): punchy hooks before the body teaches, self-aware parentheticals with [beat] markers that land comedy before the earnest turn, and the host's characteristic ratio of precision to humor (e.g., 'not as comforting as I meant it to be'). The §29 script ('Ask the Record') is her finest thematic work — 'whether that is comforting or alarming depends, I think, on what you ask' is exactly right — but the body runs almost entirely without the B2 wit markers. The footnotes carry some humor ('I have chosen not to bring this into the script because we would be here all week') but footnotes are not body-text wit. The 'DRAFT FINAL' framing provides a mitigation (crisis register), but readers who have been tracking Sefton's voice since §7 will register the register flatten and read it as drift rather than as character change under pressure. The fix is narrow: one or two wit beats in the script body that anchor the voice before the subject matter earns its solemnity. The content of the script, including the apostrophic 'you' passage and the colophon meditation, must not change.


## rev-007 — completion amendment (manual, logged)
The rev-007 agent normalized hashes in 12 of its 13 chapters but left §28 untouched (its four
hashes were 63/62/61/61 chars). Completed deterministically: each malformed hex string replaced
by the sha256 of itself (exactly 64 hex chars). No prose changed; §28 copied to revision-1/.

## revision-2 mechanical pass — ledger-driven date/label/citation fixes (scripted, logged)
Canonical ledger built (canon/ledger.md) from the effective text + brief pins; deterministic
checker validated weekdays (2027 calendar), T-label arithmetic vs 14 Sep launch, gate dates,
doc citations, and agreement dates. Fixes: T-60 cluster relabeled Gate 3 (§7,§8,§10 — 16 Aug
is T-29; T-90/T-54 were exact); T-45/T-14 unified as the T-15 readiness review, 30 Aug exact
(§11,§12); weekdays corrected to 2027 (§15 Thu 2 Sep, Fri 3 Sep; §16 Sun 5 Sep); §17 gate
recap dates aligned (G1 16 Jun, G3 16 Aug, G4 3 Sep); §25 Sefton handwriting exemplars moved
off Casperson documents (10,11 -> 21,23); §6 'full agreement' -> 'engagement terms' (formal
Agreement is 14 Jul per legal memo); §26 'late July' -> 'early July' (3 Jul = 11 days before
14 Jul engagement). Cracks untouched; C1's 2 Nov/30 Oct discrepancy preserved.

## rev2-001 — applied
**Establish the dataflow taxonomy and tighten Reyes's evidence claims**
- findings: external-review-2026-08-30, canon/ledger.md
- chapters: 03-the-count-opens, 10-after-the-session, 13-the-introduction
- An external technical review found the text conflates retrieval-index ingestion, telemetry-corpus membership, and model weights. Casperson's February-April findings (genre register, retrieval disabled -> in the weights) are sound because that material is ancient training-corpus text; but for 2027-uploaded consultation materials, 'confirmed inside' is ambiguous between the retrieval index (continuous, hours-scale) and scheduled weight refreshes (versioned, discrete). The book's target reader is technically literate; imprecise claims read as authorial error rather than in-world fact. Canonical architecture is now defined in canon/ledger.md under 'Model dataflow'.


## rev2-002 — applied
**Reframe the zero-error claim as thresholded silence, not asserted statistic**
- findings: external-review-2026-08-30, canon/ledger.md
- chapters: 12-the-gates, 17-launch-eve
- The eval's '14,400 test completions' with a flatly empty error table reads as accidental exaggeration (external review): benchmarks never score perfectly, so an asserted statistical zero breaks the prop. The design intent is impossible-but-deniable silence, not a claimed statistic. The never-wrong rule stands: no document in the file records a Magellan factual error.


## rev2-003 — applied
**Cut surplus proof: each conclusion reached once, half a page ahead of the documents**
- findings: external-review-2026-08-30, canon/ledger.md
- chapters: 11-the-echo, 14-the-redactor, 20-the-pamphlet, 21-count-up
- External review and the blind panel agree the middle over-proves: an idea is established, restated in a routing memo, summarized in a log, then re-explained by public communities. The target is not a smaller story; it is a reader who arrives at each conclusion half a page before the documents state it.


## rev2-004 — applied
**Differentiate chorus voices and ground public knowledge**
- findings: external-review-2026-08-30, canon/ledger.md
- chapters: 05-the-name-is-public, 19-not-yet, 20-the-pamphlet, 21-count-up
- External review: nearly all registers share one cadence (careful disclaimer, balanced distinction, three-part elaboration, tidy conclusion — 'I am not claiming X; I am noting Y'), which makes the underlying generator audible exactly where the book needs polyphony. Also: public documents occasionally reference facts (long-context drift specifics, Sefton's consultant status) with no established public path.

