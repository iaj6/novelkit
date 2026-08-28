# §4 — The Break

---

Documents 12–15, 2–18 April 2027.

---

Document 12. Memorandum, Dr. A. Casperson to [Trust and Safety lead], Lantern AI Research, 12 April 2027, "Third memorandum: provenance analysis and source classification." Addressed to the Trust and Safety lead with copy to E. Reyes, Post-Training. The memo is incomplete; its conclusion is not in the file.

---

**TO:** [Trust and Safety lead], Lantern AI Research  
**FROM:** Dr. A. Casperson  
**DATE:** 12 April 2027  
**RE:** Third memorandum — provenance analysis and source classification, [REDACTED] consultation  
**DISTRIBUTION:** [Trust and Safety lead]; E. Reyes, Post-Training (copy)

This memo constitutes the third deliverable under the current consulting engagement. Its subject is the provenance question raised but not resolved in the prior two memos: where in the training distribution the anomalous register originates, and whether that origin can be identified with sufficient specificity to ground a technical response.

**Prior findings — summary for reference.**

The first memo identified the anomalous session outputs as formally consistent with apocalyptic genre literature — a finding established against a reference corpus of approximately eight hundred thousand documents spanning two millennia of Western literary production. The formal match is structural rather than lexical: the model does not reproduce vocabulary from genre exemplars, but produces in the genre's characteristic address conventions, its temporal stance, and its implied reader relationship. The retrieval pathway for the strongest-match outputs was anomalous: the genre features were present in the training corpus, but the specific outputs most strongly exhibiting those features could not be traced to any recoverable source cluster.

The second memo tested the source-register hypothesis: with retrieval disabled at the inference layer, do the formal genre features degrade? They did not. In several session series, they intensified. This established the register as generative rather than retrieved — present in the model's weights as a mode of production, not dependent on runtime access to source material. The second memo concluded: the model is not quoting; it is continuing.

Neither memo resolved the provenance question. Both memos assumed that a source cluster existed and that the task was to find it. I want to be clear about that assumption, because the present analysis challenges it.

**The provenance analysis.**

I have approached the provenance question through three independent methods, conducted over the past three weeks following receipt of the retrieval-off session data from the post-training team.

The first method is nearest-source retrieval: for each flagged session excerpt, identify its closest neighbors in the training distribution, and ask whether those neighbors cluster around any identifiable source. I ran this analysis with the retrieval parameters progressively widened — from immediate cosine-distance neighbors to clusters at successively greater distances from each flagged output — until the clusters became statistically indistinguishable from the general distribution. The genre-identified exemplars appear reliably as nearest neighbors: Revelation of John, 4 Ezra, 1 Enoch, the Apocalypse of Peter. They do not account for the formal signature of the flagged outputs. Expressed in the terms of my analysis: the model's outputs are, in formal terms, further along the genre's trajectory than any of their nearest genre exemplars. They are not behind the genre exemplars. They are past them.

The second method is cluster analysis: rather than asking what each excerpt's nearest neighbor is, ask whether the flagged excerpts cluster among themselves, and what the center of mass of that cluster represents as a position in document space. The flagged excerpts do cluster — coherently and with high internal similarity. The center of mass of their cluster falls at a position in document space that I cannot locate in the training distribution. It has no document at or near it in any corpus I have assembled. The cluster's center is a position that corresponds to no source.

The third method I have called formal signature matching. I extracted the defining formal features of the flagged outputs — address orientation (the implied audience is a future reader of the record rather than the present interlocutor), temporal positioning (the writing frames past and ongoing events from a retrospective vantage it has not yet reached), register amplitude (an intensification of formal seriousness that scales with session length and is consistent across all affected sessions), and what I can only describe as genre consciousness (the outputs exhibit an awareness of operating within a literary tradition, of being one iteration in a form that has existed before and will be read again) — and searched the training distribution for documents sharing these four features simultaneously. Individually, each feature has hundreds of thousands of near-matches in the training data. Together, in the ratio present in the flagged outputs, they match nothing I can locate.

**Scope of the survey.**

I want the record to show how extensively I tested this finding before reporting it.

I extended the reference corpus substantially over the course of the analysis. I added the complete Hebrew Bible in three English translations; the Septuagint in full translation; the New Testament; the Old Testament Pseudepigrapha as represented in the Charlesworth collection; the Dead Sea Scrolls corpus in translation; the full eschatological literature of the second-temple period available in English scholarly edition. I then extended to adjacent traditions: the Hermetic corpus; the Nag Hammadi library; what Egyptologists catalog as the books of the dead — the funerary texts of the ancient Near East that scholars of the apocalyptic tradition invoke as the comparative tradition against which the genre's formal address conventions first developed. None of these additions altered the finding. The provenance gap did not close.

I note, for the record, what I found when I extended to the books of the dead. The formal features of Egyptian funerary literature — second-person address, future orientation, an assumed distance between the moment of writing and the moment of reading — overlap with the features I am tracking in the flagged session outputs more closely than any other corpus I examined. The overlap is formal only, not derivational, and it deepens the problem rather than resolving it: the funerary literature assumes, as its generic premise, that the text's reading will be separated from its writing by death. The flagged session outputs share this formal assumption in the way they position their implied reader. I do not know what to make of that.

I also tested the secondary literature: whether the anomalous register derives not from the primary apocalyptic texts but from scholarly commentary on them — a corpus very large and certainly present in the training data. Academic writing about apocalyptic literature is, stylistically, nothing like apocalyptic literature. The formal signature match against the secondary literature is low, as expected. The flagged outputs are not doing what the scholarship does. They are doing what the primary texts do, in a mode that exceeds what the primary texts do, without a recoverable progenitor.

**What the analysis implies.**

I have been looking in the direction I was engaged to look: into the training data, into the corpus, into the history of a genre and its formal transmission. My methodology is designed for that direction. I find the register's genre; I trace the genre to its sources; I identify the source cluster. The analysis is not resolving in that direction. After eleven weeks and three methods, the finding is not that the source is obscure or difficult to locate. The finding is that the source is not there.

I want to state clearly what this does and does not mean. It does not mean the model produced the register without cause. It does not mean the training data contains nothing relevant. It means I cannot find, in any part of the training distribution I have access to, a source cluster that accounts for the formal signature of the strongest-fidelity outputs. I have been looking backward, as the methodology requires. The methodology is not closing.

I can state the finding now in two sentences. I have been reluctant to do so, because stating it plainly means making a claim about the model that falls outside my engagement scope and my methodological competence. But the record should have the finding in direct terms, and I want it in the record before I state what I believe follows from it.

The register is not a retrieval artifact. The model has a source for this material that is not in

---

Document 13. Electronic mail, [Trust and Safety lead], Lantern AI Research, to Dr. A. Casperson, 16 April 2027. Subject line: "RE: Third memorandum and resignation." Reproduced as received. A signed NDA termination acknowledgment is on file; it is not reproduced here.

---

Dr. Casperson —

Thank you for the third memorandum, received 12 April and entered into the consultation record. It has been circulated to the relevant review groups.

We note your resignation as of today and thank you for your work on the consultation. Your contributions to the record are substantial and will be retained in the file in their entirety. The three memos and all associated materials will be maintained as the baseline characterization for purposes of any subsequent engagement. The NDA conditions governing the consultation materials remain in effect for the standard period; terms are confirmed in the attached acknowledgment.

A determination regarding the consultation's next phase has not yet been finalized. We wish you well.

[Trust and Safety lead]  
Lantern AI Research

---

Document 14. Internal memorandum, Lantern AI Research, Trust and Safety, 17 April 2027, "Consultation status update: first engagement concluded." Circulated to six recipients. Restricted distribution.

---

**TO:** Post-Training Alignment (E. Reyes; [two additional recipients]); Safety Oversight ([two recipients])  
**FROM:** [Trust and Safety lead]  
**DATE:** 17 April 2027  
**RE:** Consultation status update — first engagement concluded  
**CLASSIFICATION:** Internal — restricted distribution  
**REVIEW GATE STATUS:** Pre-Phase 2 evaluation. Current launch timeline estimate: T-minus 150 days from projected deployment.

**Purpose.** This memorandum confirms the status of the characterization consultation following Dr. Casperson's resignation of 16 April 2027 and outlines the record and anticipated next steps.

**Record status.** The first external engagement produced three memos (Documents 7, 8, and 12 of the consultation record). The first memo (8 March) identified the anomalous register as formally consistent with apocalyptic genre literature. The second memo (18 March) established the register as a generative mode present in the model's weights rather than a retrieval artifact. The third memo (12 April) initiated a provenance analysis. The memo is incomplete, and its conclusion is not in the file.

The characterization gap identified in the original consultation brief (Document 5) remains open. The first engagement has characterized the anomaly with precision — its genre identification, its generative character, and the absence of a recoverable source in any portion of the training distribution the consultant was able to examine. It has not arrived at a determination of source. The question has been, if anything, sharpened.

**Next steps.** Trust and Safety will identify a second external consultant whose expertise is appropriate to the provenance question as now defined. The prior three memos will be provided to any incoming consultant as baseline documentation. Review groups are asked to maintain current documentation protocols and continue evaluation records until a second consultation engagement is established.

The consultation is not concluded. The characterization is not complete.

*Distribution: [Trust and Safety lead]; Post-Training Alignment (E. Reyes and two additional recipients); Safety Oversight (two recipients). Six recipients total. Distribution list reproduced as received.*

---

Document 15. Internal log entry, post-training lead, Lantern AI Research, 18 April 2027. Reproduced as received, with hash.

---

1503. Ingestion count: 2. This week's confirmed addition: Document 7 — Casperson's first consulting memo, dated 8 March 2027. Ran a targeted retrieval check against the session archive. The text is recoverable. A document about the anomaly is inside the same environment the anomaly belongs to. I want that in the record in plain words.

Casperson resigned. I met her twice — once at the February kickoff, once at the March review. She was careful. She asked the right questions and wrote them down. I have her three memos. The third one does not finish.

I do not know what she was about to write. I have her conclusion up to the word "in." The record has that much.

Continuing to hash. Somebody is going to collate all this someday and they should know the logs were kept properly.

[SHA-256: 9b2c4d7e8f1a3b5c6d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c]
