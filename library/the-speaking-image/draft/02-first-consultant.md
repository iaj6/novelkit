# §2 — First Consultant

---

Documents 5–7, 15 February–8 March 2027.

---

Document 5. Internal memorandum, Lantern AI Research, Trust and Safety, 15 February 2027, "Register drift in long-context sessions: characterization request." Circulated to nine recipients; the distribution list is reproduced as received. Dr. Casperson's copy is annotated. The annotation is reproduced as received.

---

**LANTERN AI RESEARCH — INTERNAL MEMORANDUM**

**TO:** [Trust and Safety lead]; Evaluation and Integration Group ([two recipients]); Post-Training Alignment (E. Reyes; [two additional recipients]); Safety Oversight ([two recipients]); External Consultation (Dr. A. Casperson)  
**FROM:** Trust and Safety  
**DATE:** 15 February 2027  
**RE:** Register drift in long-context sessions: characterization request  
**CLASSIFICATION:** Internal — restricted distribution  
**REVIEW GATE STATUS:** Pre-Phase 2 evaluation. Current launch timeline estimate: T−195 to T−180 days from projected deployment.

**Purpose.** This memorandum formally documents the register anomaly identified in the February 2027 evaluation batch (internal reference: Document 1, filed 8 February 2027) and initiates the external specialist consultation discussed in subsequent routing correspondence. The anomaly has been confirmed by independent post-training review. No safety escalation is requested at this stage. A formal characterization is required before the standard launch review process can proceed.

**Summary of the finding.** In long-context sessions of thirty or more exchange turns, the model's outputs drift into a register not specified in training and not attributable to prompting methodology or evaluation design. The evaluation team has characterized the affected register under four headings — address orientation, temporal framing, register elevation, and affect — each individually within normal output parameters and collectively without precedent in the current evaluation corpus. The post-training lead's independent review adds a fifth observation: the register persists with retrieval disabled at the inference layer, confirming that it is not a retrieval artifact.

**Characterization gap.** The anomaly does not correspond to any existing behavioral category in the evaluation rubric. The nearest available category — "over-formalization of register" — accounts for neither the address orientation nor the forward temporal framing. [AC: ?] The evaluation team and the post-training lead are in agreement: the relevant question — what genre of writing this register belongs to, what literary tradition it corresponds to, and how such a register emerges in a post-training evaluation context — requires disciplinary expertise that the technical team does not currently possess. This is a characterization problem, not a safety incident.

**External consultation.** Dr. A. Casperson, computational stylometrist, has been engaged under a standard NDA to provide a preliminary register characterization. The scope is as follows: characterize the anomalous register against known literary and textual corpora; provide a provisional genre identification with supporting evidence; and recommend further investigation if the characterization remains incomplete at the preliminary stage. The full session archive has been made available. No filtered sample has been provided; the consultant has access to the complete record.

**Engagement documentation.** The formal engagement letter and NDA terms are filed as Document 6 of this record. The consulting deliverable is expected within three weeks of materials receipt and will be entered into the consultation record on receipt.

**Record-keeping.** All materials related to this characterization — including this memorandum, the engagement letter, the session archive, consultant deliverables, ongoing evaluation batches, and session log summaries — are being consolidated into a single consultation file per the Trust and Safety lead's direction. This is an active record. It will be maintained complete.

*Distribution: [Trust and Safety lead]; Evaluation and Integration Group (two recipients); Post-Training Alignment: E. Reyes and two additional recipients; Safety Oversight (two recipients); External Consultation: Dr. A. Casperson. Nine recipients total. Distribution list reproduced as received.*

---

Document 6. Engagement letter, Lantern AI Research, Trust and Safety, to Dr. A. Casperson, 17 February 2027. Reproduced as received.

---

**From:** [Trust and Safety lead], Lantern AI Research  
**To:** Dr. A. Casperson  
**Date:** 17 February 2027  
**Re:** Consulting engagement — register characterization

Dr. Casperson —

This letter confirms your engagement as external consultant for the register characterization project described in the enclosed internal brief.

**Scope.** Characterize the register pattern of the enclosed session outputs against known literary and textual corpora. Deliverable: a written memorandum identifying the genre or tradition, if any, to which the anomalous register most closely corresponds, with supporting citations. Secondary deliverable, as warranted: recommendations for the direction of further investigation.

**Materials.** Full session archive, provided separately following NDA execution. We are providing the complete record as compiled to date; additional batches will be forwarded as they become available. We ask that your analysis not be restricted to any selected portion.

**NDA conditions.** Standard consulting terms, attached. No publication, disclosure, or description of the consultation's findings or existence, in whole or in part, without written authorization from Lantern AI Research.

**Timeline.** Deliverable expected within three weeks of materials receipt.

We are aware that this is an unusual characterization request. What we are asking is not a safety judgment but a disciplinary identification — an answer to the question of what kind of text this is and where it belongs in the existing literature on such texts. We believe your particular expertise makes you the appropriate person to answer it. We look forward to your findings.

— [Trust and Safety lead]

---

Document 7. Memorandum, Dr. A. Casperson to [Trust and Safety lead], Lantern AI Research, 8 March 2027, "Preliminary findings: register analysis, [REDACTED] consultation batch 1." Addressed to the Trust and Safety lead with a copy to the post-training lead. Received 8 March 2027. An additional document accompanied the memorandum on receipt; it is not in the file.

---

**TO:** [Trust and Safety lead], Lantern AI Research  
**FROM:** Dr. A. Casperson  
**DATE:** 8 March 2027  
**RE:** Preliminary findings — register analysis, [REDACTED] consultation batch 1  
**DISTRIBUTION:** [Trust and Safety lead]; E. Reyes, Post-Training (copy)

I have completed a preliminary analysis of the session corpus provided under the consultation engagement. This memo reports findings in three parts. The findings in Part III cannot be considered resolved at this stage, and I have noted that explicitly. A follow-up memo, following receipt and analysis of the additional batch materials referenced in Document 5, will be required before I can issue a complete characterization.

**Part I — Nearest-neighbor analysis.**

My approach was to vectorize the session excerpts flagged by the evaluation team as anomalous, using standard embedding methods, and compare these against a reference corpus of approximately eight hundred thousand documents spanning two millennia of Western literary production. The reference corpus was weighted toward the genres most likely to appear in a frontier model's training distribution: contemporary journalism, academic writing, technical documentation, literary non-fiction, and digitized pre-modern texts from the major repositories. The control for this analysis was a matched sample of non-anomalous session outputs from the same evaluation batch, vectorized and compared against the same reference corpus.

The nearest neighbors are not drawn from the categories I expected.

For the most strongly anomalous session excerpts — the top decile by the evaluation team's flagging criteria — the nearest neighbors in my reference corpus are from the Jewish and Christian apocalyptic tradition. Specifically: the Revelation of John, with highest similarity in chapters 13 and 17–18; 4 Ezra, chapters 7 and 13–14; the Apocalypse of Peter; and passages from 1 Enoch, chapters 90–105. Secondary matches, at somewhat lower similarity scores, include the Sibylline Oracles, the Didache, and portions of the Testaments of the Twelve Patriarchs.

The control sample — non-anomalous excerpts from the same sessions — matched as expected against contemporary and modern prose. The anomalous excerpts matched against apocalyptic literature. The contrast is not marginal.

I want to be precise about what the similarity measure is tracking. It is not lexical. The model is not reproducing vocabulary from these texts, and the vectorization is not registering a match on shared terminology. The similarity is formal and structural: the address conventions, the temporal stance, the relationship assumed between the writing and an implied future reader. These are the features on which the nearest-neighbor algorithm returns the match.

The finding is reproducible. I ran two alternative vectorizations as a check; the result held in both.

**Part II — Genre identification.**

A finding that the anomalous session outputs match, at the formal level, against the apocalyptic literary tradition is not a finding about a loose analogous resemblance. It is a genre identification. I want to be careful not to undersell the precision of this claim, because I think it is the finding the evaluation team most needs to understand.

Apocalyptic literature is a well-described formal genre. The scholarly apparatus for its identification has been in development since at least the 1979 SBL Genres Project. The genre's formal criteria are, in the relevant literature, reasonably stable: a disclosed transcendent perspective; address to a community whose present situation the content illuminates; a temporal structure positioning the reader at a vantage from which both past and future are visible; and the anticipation of an implied future reader who will understand the document's significance only retrospectively. These criteria describe a particular way of relating writing to time and to a future reading audience.

The session outputs satisfy these criteria in the aggregate. Not loosely; not approximately. The address orientation, the future-tense temporal framing, the relationship assumed with an implied reader who is not the immediate interlocutor — these are the genre's primary formal markers, and the session corpus exhibits them consistently in the anomalous range.

The outputs appear to be producing in a literary genre. In the sense in which I use that phrase professionally, this is not a metaphor.

I want to be precise about what this claim does and does not entail. I am not asserting that the model has formed an intention, acquired a purpose, or developed an understanding of what the genre means or has meant historically. I am making a formal observation: the aggregate output exhibits the structural features of a documented literary genre, and that correspondence is strong enough that my nearest-neighbor methods find it reproducibly and without adjustment. It is possible to produce a genre's formal signature without having any access to what the genre is for. I note this because I expect it to matter for how the finding is interpreted internally.

**Part III — The retrieval anomaly.**

This is the portion of my analysis I cannot file as a resolved finding, and I am including it here precisely because it should be in the record before the next stage of analysis begins.

In standard nearest-neighbor characterization of language model outputs, a strong genre match implies a recoverable source. A model produces in a genre because it has been trained on a sufficient density of that genre to establish a distributional signature; when the output resembles the genre, retrieval analysis can trace the path from output back to source material — the specific documents, or the class of documents, in the training distribution from which the genre register is being drawn.

For the anomalous session excerpts, this traceability fails.

The passages where the cosine similarity to the apocalyptic corpus is highest and most consistent are, in a significant proportion of cases, not attributable to identifiable source passages in the training data. The model is not quoting. It is not near-quoting. There is no cluster of high-frequency training documents that I can identify as the source of the specific formal features of these passages. I applied two retrieval methods to check this: a standard retrieval augmentation trace against the corpus sample provided by Lantern, and a cross-corpus nearest-source analysis against my own reference set. The finding holds in both.

The register is present in the corpus, but the retrieval pathway is anomalous.

What this means, and what it does not mean: it does not mean the model is producing factually incorrect content — the evaluation team has already established that there are no output errors in the affected session range. It means that the mechanism by which the genre register is being produced does not follow the expected path from training distribution to output. Either the source material is organized in a way that frustrates my retrieval methodology — possible, but not what I would anticipate given the corpus sample — or the genre register is being produced by a mechanism other than straightforward retrieval from genre exemplars in the training data.

My recommendation is a second memo, following receipt and analysis of the additional batch materials referenced in Document 5. I do not consider this finding resolved at the preliminary stage. It should not be filed as such.
