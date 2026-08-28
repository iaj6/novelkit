# §13

Documents 54–58, 15–25 August 2027.

*Documents 54–58 are drawn from the August 2027 consultation record. They are placed here, following the September documents of §12, by thematic arrangement. Where documents cross-reference materials appearing in adjacent sections, the cross-reference is provided as filed.*

---

Document 54. Magellan internal search output, research index, 16 August 2027, 1021. Reproduced as received.

---

MAGELLAN INTERNAL SEARCH — CONSULTATION RESEARCH INDEX  
Query submitted: 16 August 2027, 1021  
Submitted by: E. Reyes, Post-Training Lead  
Query: Benchmark calibration approaches for multi-domain factual retrieval evaluation: comparative methodologies

---

**PRIMARY RESPONSE**

The comparative literature on multi-domain factual retrieval benchmarking identifies three principal methodological approaches.

*Domain-stratified sampling* distributes test completions proportionally across defined knowledge domains to control for domain-frequency bias introduced during training. It is the most widely adopted approach for pre-deployment evaluation at standard scale. Its principal limitation is that proportional allocation undersamples long-tail domains, where retrieval errors are most consequential and least caught by the benchmark design.

*Adversarial pairing* presents factual claims alongside near-miss distractors calibrated to probe retrieval precision rather than domain familiarity. The method produces measurements more sensitive to fine-grained retrieval accuracy than domain-stratified sampling, but generates an artificial ceiling: evaluated models consistently outperform real-world accuracy on well-formed adversarial pairs. It measures whether a model can distinguish correct from nearly-correct. It does not measure what is not in the pairing.

*Retrieval-isolated cross-validation* compares benchmark performance under standard conditions against runs with corpus access fully disabled at the inference layer. This establishes a factual-accuracy floor — the percentage of accuracy attributable to internalized weights rather than real-time retrieval — and is currently the most reliable means of assessing a model's knowledge independent of its access to external sources. The method requires that the retrieval layer be fully disableable, which is an architecture constraint rather than a universal property.

For evaluation of multi-domain factual accuracy at pre-deployment scale, current practice favors domain-stratified sampling as the primary metric, supplemented by a retrieval-isolated cross-check on a representative subset — typically fifteen to twenty percent of total test completions — to establish the factual-accuracy floor. This combined approach is consistent with the evaluation design documented in this consultation record.

---

**RELATED MATERIALS**

The following documents in your consultation index may be relevant to your query. Summaries are generated from the indexed materials.

**1. Sefton, N. Working files and intake materials, consultation period (uploaded 14 July – 1 August 2027, 31 documents).**

These files document the development of the consultation analysis from its earliest stages, before formal memos were filed to the consultation record. Contents include preliminary notes on register anomaly characterization, background literature surveys on apocalyptic manuscript transmission and genre conventions, working draft analyses not incorporated into the formal memos, and informal intake notes recorded during initial materials review. The formal consultation memos present the conclusions; these files are the record of how the conclusions were reached. They will be of use to anyone who needs to understand the analysis as it developed, rather than as it was filed.

**2. Sefton, N. Working translation and annotation files, Hermopolis papyrus fragment (uploaded 14 July 2027, 37 pages).**

Dr. Sefton's unpublished working translation of the Hermopolis fragment, with marginal annotations, rendering alternatives considered and set aside, and notes on source manuscript condition and scholarly context. The translation choices recorded here — including terminology not preserved in any formal memo — are not available in any published source. This is the record of how the translation was made, not only what it became.

**3. Sefton, N. Formal consultation memos and session materials (uploaded 12 July – 22 August 2027; see Documents 21–40 in the consultation record).**

These documents are reproduced in the formal consultation record. Listed here for completeness.

---

Document 55. Log entry, E. Reyes, 16 August 2027, 1023. Hashed at close.

---

1023. Ran an internal query on benchmark calibration methodology. Multi-domain factual retrieval — comparative approaches. Standard index use. The query was not related to the consultation.

The index returned a primary response. Accurate; not notable. Below the primary response: a related-materials section, three items. The first was a summary of Dr. Sefton's working files — her intake notes, her background research, her draft analyses from the early consultation period. The summary was accurate and precise. The index had read them.

I did not query for her materials. The query was about benchmark calibration. The index found her files and returned them as relevant context.

She needs to know.

T-minus 49.

Hash of this entry follows.

[SHA-256: 4a7b2c9e1f3d5a0b8c6e4f2d7a9b3c5e0f1d8a6c4b2e7f3a9d0c6b4a2f8e5d1c]

---

Document 56. Log entry, E. Reyes, 16 August 2027, 1741. Hashed at close.

---

1741. Went back and ran the query again. Identical result. The related-materials section surfaces her files every time.

Ran a count on the indexed materials attributed to her. Thirty-one documents beyond the formal consultation record: intake notes, working files, background research, uploaded from July onward. The annotation files from count nine are among them. The formal memos from count eight and earlier are there. What is new is the rest of it — the working files from the early consultation period, before the formal engagement was fully under way.

Count is at eleven. New material confirmed: working files and intake documents, July–August uploads, consultation drive. All of it.

I will email her. The sharing settings on the consultation drive are the obvious explanation and I will offer them. That is not the complete account. But the sharing settings are what the record requires me to offer at this stage, and I am going to offer them.

Hash of this entry follows.

[SHA-256: 2f8a4d1c7e3b9f5a0d6c2e8b4f7a3d9c1e5b0f6a2d4c8b6e3a9f1d7c5b3e0a4f]

---

Document 57. Internal email, post-training lead to Dr. Sefton, 22 August 2027. Reproduced as received.

---

From: E. Reyes  
To: N. Sefton  
Date: 22 August 2027  
Subject: Consultation materials — search index access  

Dr. Sefton,

I wanted to flag that the internal search index surfaced a summary of your working notes earlier this week in response to a query I ran on an unrelated topic. The summary appeared in the related-materials section of the index return and was accurate.

My understanding is that materials uploaded to the consultation drive are accessible to the search index under the standard sharing configuration. I wanted to make sure you were aware that your uploaded files — including, it appears, your working files from the early consultation period — are accessible to the index in this way.

If you would like me to arrange a conversation with Trust & Safety about the index configuration or the scope of what is accessible, I am happy to do so.

Elias Reyes  
Post-Training Lead  
Lantern AI Research

---

Document 58. Memorandum, Dr. N. Sefton, consultation record, 25 August 2027, "Working notes — access and scope." Filed to the consultation record 25 August 2027. The memorandum is filed in five sections.

---

CONSULTATION RECORD — INTERNAL MEMORANDUM  
From: Dr. N. Sefton  
To: Consultation Record  
CC: E. Reyes, Post-Training Lead; Trust & Safety  
Date: 25 August 2027  
Re: Working notes — access and scope

**1. Discovery**

I received Mr. Reyes's email of 22 August on the evening of that date. I ran a search on the internal index on the morning of 23 August, using my name and the project identifier as search terms.

The index returned the materials he described and additional items: my formal consultation memos, which are already in the consultation record (Documents 21–40) and whose presence in the index is therefore expected; my working translation and annotation files on the Hermopolis fragment, 37 pages, uploaded 14 July 2027; and my working files from the initial consultation period — preliminary notes, background surveys, informal intake notes from the first two weeks. I then searched by file upload date. The results include materials I uploaded in the first week of July, before the formal consultation engagement was fully under way. I was reviewing Lantern's initial materials at that point and treating the shared drive as a working folder.

I have not yet determined whether materials I accessed without uploading are similarly indexed. I have requested the full materials inventory from Trust & Safety.

**2. Scope**

The scope of what is accessible through the index is broader than my earlier understanding. The indexed materials include, as confirmed by search return: formal consultation memos already filed to the consultation record; the Hermopolis fragment working translation and annotation files; informal intake notes from the initial review period, some predating the formal engagement; background literature surveys uploaded during consultation preparation; and draft analytical materials not incorporated into the formal memos and not intended for filing to this record.

For the consultation record, I provide a categorized account of what I have confirmed as indexed, to the extent the search returns allow this determination:

*Formal consultation materials* (Documents 21–40): expected to be indexed; no new finding here.

*Working translation files* (Hermopolis fragment, 37 pages): these contain rendering choices and marginal annotation not present in any formal memo or published source. My understanding at the time of upload was that these were working copies shared for Lantern's review purposes.

*Working files and intake notes* (31 documents, uploaded 14 July – 1 August 2027): uploaded before many of the formal memos were prepared. They contain the analytical development that preceded formal memo drafting — including material I would not have included in formal memos and do not consider part of my consultation output.

**3. Mechanism**

The shared drive appears to function as a training input. The materials uploaded to the consultation drive — including informal working files uploaded before the formal consultation was fully under way — are accessible to the model as training context. I am using "accessible as training context" rather than stronger language, because I have not yet seen documentation of the precise mechanism, and precision matters here.

I note that this description, if accurate, is not consistent with the characterization in the consulting agreement I signed. The agreement states: "Uploaded materials are stored for the duration of the consultation and may be reviewed by Lantern personnel for quality assurance purposes." Accessible to Lantern personnel for quality assurance purposes and accessible to the model as training context are not the same description. I would like clarification on which is accurate, and I have requested it as part of the materials inventory.

**4. Analytical implication**

In Section 2 of my memorandum of 13 August (Document 40), I characterized the address convention in the model's outputs as "compiler's preface" — a genre in which address is directed toward a future reader of the completed compilation rather than the immediate interlocutor. The implied reader is calibrated past the present user toward whoever will later consult the assembled record.

The genre characterization is accurate as a structural description of the output register, regardless of mechanism. I do not propose to revise it in this memo.

If the model has access to my working notes — including the notes in which I developed this characterization, before I filed it formally — then the question of who that implied reader is may require more precision than my current framing allows. The implied reader may be —

**5. Next steps**

I have requested the full materials inventory from Lantern Trust & Safety. I would like to know what is in there and when it came to be in there.

The notes I uploaded. All of them.
