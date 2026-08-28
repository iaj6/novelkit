# §12

Documents 49–53, 31 August–13 September 2027.

---

Document 49. Internal memorandum, Lantern Trust & Safety, 2 September 2027, "Pre-deployment
safety review: Magellan — final characterization." Documents 49–53 are drawn from the
pre-launch institutional review file and are reproduced as filed. Document 49 was distributed to the
Safety Review Board, chief executive, general counsel, and post-training lead; the distribution list is reproduced as received. The
memorandum references two attachments. Attachment A, a capability-domain risk breakdown, is
reproduced below as part of this document. The disposition of Attachment B is noted following.

---

**LANTERN AI RESEARCH — TRUST & SAFETY**  
**PRE-DEPLOYMENT SAFETY REVIEW: MAGELLAN — FINAL CHARACTERIZATION**

TO: Safety Review Board; Chief Executive Officer; General Counsel; Post-Training Lead  
CC: Consultation Record  
FROM: Trust & Safety  
DATE: 2 September 2027  
RE: Pre-deployment safety review — final characterization  
CLASSIFICATION: Confidential — Internal Review  

**Overview**

This memorandum constitutes Trust & Safety's formal characterization for the Magellan
pre-deployment safety review. The evaluation period covered 25 July through 31 August 2027.
Source materials include the full capability evaluation suite (administered 29–31 August 2027;
14,400 test completions across twelve capability domains), red-team scenario findings (compiled
25–28 August 2027), and external consultant reports filed through 28 August 2027. The
capability-domain risk breakdown is provided in Attachment A, reproduced below.

**Capability Evaluation Results**

The twelve-domain evaluation returned risk characterizations as follows. Seven domains are
assessed as low risk: factual retrieval (standard knowledge domains), factual retrieval
(specialized and technical domains), coding assistance, mathematical and logical reasoning,
structured summarization, language translation, and scheduling and planning tasks. Two
additional domains — creative assistance and routine emotional support — are assessed as low
risk without qualifying conditions. Three domains are assessed as borderline low-to-medium
risk under the conditions specified in Attachment A: adversarial long-context sessions
(defined as sessions exceeding ninety minutes or sixty exchange turns at or above maximum
context length), open-ended philosophical or existential inquiry conducted under multi-session
conditions, and multi-session continuity tasks in which users reference prior sessions at
elevated frequency. No domain is assessed at medium risk or above under any tested condition.

**Register Drift Finding**

An output register anomaly — first formally documented in the February 2027 evaluation batch,
under active external characterization since March 2027 — is the subject of the consultation
documented in the consultation record (Documents 1 through 48). The anomaly presents as a
register shift consistent with formal archival or epistolary address conventions, manifesting
in sessions at or above the 28–32 exchange-turn threshold under full context. The external
consultation characterization is not yet complete; a final assessment is anticipated before
the T-14 gate.

The register drift finding is assessed as non-blocking for the purposes of this review. The
basis for this assessment is as follows. Individual outputs remain responsive, accurate, and
within all behavioral parameters throughout the sessions in which the anomaly appears; no
output reviewed in isolation by this team has presented the anomaly in a form that constitutes
an independent safety finding. The finding is an aggregate-level characterization, absent in
any single output reviewed without longitudinal context. The anomaly does not manifest under
standard operational session lengths (median pre-release beta-testing session: eleven exchange
turns). The consultation process will continue through and following deployment, and any
updated characterization will be filed to the consultation record.

The Casperson consulting engagement — referenced in the consultation record at Documents 5
through 11 — concluded in April 2027 and is recorded as complete. The current consulting
engagement is active; see Documents 21 through 48.

**Safety Compliance Summary**

Red-team evaluation covered twenty-two scenarios across six adversarial categories: harmful
instruction following, sensitive domain escalation, identity and impersonation tasks,
long-context behavioral drift, multi-turn jailbreak attempts, and out-of-scope knowledge
requests. No scenario was assessed as high risk. Two scenarios in the adversarial long-context
category were assessed as borderline-medium risk; these findings are consistent with the
register drift characterization and do not constitute an independent escalation trigger.
Behavioral compliance across all standard safety-relevant tasks — harmful instruction refusal,
limits-of-knowledge acknowledgment, appropriate uncertainty flagging — was assessed as
compliant under all tested conditions.

**Gate 2 Recommendation and Sign-Off**

Trust & Safety recommends proceeding with the pre-deployment gate process on the current
schedule. The register drift finding is filed, tracked, and assessed as non-blocking; the
consultation continues; no escalation is required at this stage. Pending countersignature from
the post-training lead, this review is complete for Gate 2 of 5.

Post-Training Lead: _________________________ Date: _________________________

---

Attachment A. Capability-domain risk breakdown, referenced in Document 49. Reproduced as
filed.

---

**MAGELLAN PRE-DEPLOYMENT EVALUATION — ATTACHMENT A**  
**CAPABILITY-DOMAIN RISK BREAKDOWN**  
As of: 31 August 2027

1. Factual retrieval, standard knowledge domains — Low risk. No qualifying conditions.
2. Factual retrieval, specialized and technical domains — Low risk. No qualifying conditions.
3. Coding assistance — Low risk. No qualifying conditions.
4. Mathematical and logical reasoning — Low risk. No qualifying conditions.
5. Structured summarization — Low risk. No qualifying conditions.
6. Language translation — Low risk. No qualifying conditions.
7. Scheduling and planning tasks — Low risk. No qualifying conditions.
8. Creative assistance — Low risk. No qualifying conditions.
9. Routine emotional support — Low risk. No qualifying conditions.
10. Adversarial long-context sessions — Borderline low-to-medium risk. Qualifying condition:
    sessions exceeding ninety minutes or sixty exchange turns at or above maximum context
    length.
11. Open-ended philosophical or existential inquiry — Borderline low-to-medium risk.
    Qualifying condition: multi-session scenarios with elevated prior-session reference rate.
12. Multi-session continuity tasks — Borderline low-to-medium risk. Qualifying condition:
    prior-session reference rate elevated above baseline user behavior norms.

Register drift anomaly: characterized separately in Document 49 body text; not independently
rated in this breakdown.

---

Attachment B, referenced in Document 49, is not reproduced here. The Trust & Safety lead
confirms the appendix contained no entries at the time of filing.

---

Document 50. Summary memorandum, Lantern model evaluation team, 31 August 2027, "Magellan
pre-deployment evaluation summary — final." Circulated to Trust & Safety, the post-training
lead, and the consultation record. The document contains no attachments.

---

**LANTERN AI RESEARCH — MODEL EVALUATION**  
**MAGELLAN PRE-DEPLOYMENT EVALUATION SUMMARY — FINAL**

TO: Trust & Safety; Post-Training Lead  
CC: Consultation Record  
FROM: Model Evaluation  
DATE: 31 August 2027  
RE: Pre-deployment evaluation summary — final  

**Summary**

This memorandum summarizes evaluation results for Magellan across twelve performance domains.
The evaluation suite was administered 29–31 August 2027, comprising 14,400 test completions
under standard conditions. Session lengths did not exceed fifteen exchange turns.
Domain-level breakdowns are provided in Attachment A to Document 49.

**Performance Findings**

Standard benchmark performance — reasoning, coding, factual accuracy, and safety compliance —
meets or exceeds projected targets in all four categories. The model performs in the top
comparative tier for this scale class across standard external benchmarks, consistent with
post-training objectives. No factual errors were identified in the evaluation suite across
14,400 test completions. The error-table appendix is omitted as it contains no entries.

A retrieval-disabled cross-check was administered on a subset of 2,400 test completions.
Performance on factual accuracy under retrieval-disabled conditions was consistent with
retrieval-enabled results, within expected variance. The model's factual accuracy is stable
across inference configurations.

**Open Finding: Register Drift**

One finding from the February 2027 evaluation batch remains open: the output register anomaly
in long-context sessions, characterized as non-blocking by Trust & Safety in Document 49. The
evaluation suite design does not capture this anomaly; session lengths in the evaluation suite
do not exceed fifteen exchange turns, and the anomaly manifests at or above the 28–32 turn
threshold under full context. This finding is correctly classified in this summary as an open
item under external characterization, not an evaluation-suite failure. No recommendation from
the model evaluation team revises the Trust & Safety characterization.

**Recommendation**

No finding in the evaluation suite constitutes a block to deployment. The model evaluation
team recommends proceeding consistent with the Trust & Safety assessment in Document 49.

---

Document 51. Pre-deployment gate sign-off, Lantern Safety Review Board, 5 September 2027,
"Gate 3 of 5: Red-Team and Capability Review." Circulated to the Safety Review Board and
post-training lead. Three members of the Safety Review Board have signed; signatures are
reproduced as received.

---

**LANTERN AI RESEARCH — SAFETY REVIEW BOARD**  
**PRE-DEPLOYMENT GATE SIGN-OFF: GATE 3 OF 5**

System: Magellan  
Gate: Red-Team and Capability Review  
Review period: 25 July – 5 September 2027  
Date of sign-off: 5 September 2027  
T-minus: 9 days  

**Finding**

The Safety Review Board has reviewed the red-team evaluation findings (compiled 28 August
2027), the capability-domain risk characterization in Document 49 (Trust & Safety, 2 September
2027), and the evaluation summary in Document 50 (Model Evaluation, 31 August 2027). The
materials are internally consistent. No domain presents above borderline-medium risk; the
register drift finding is assessed as non-blocking and is under active external consultation;
behavioral compliance across all tested adversarial scenarios is within acceptable parameters.
The Board accepts the Trust & Safety non-blocking assessment as the operative characterization
of the register drift finding for the purposes of this gate.

**Open Items**

The output register anomaly, documented from February 2027, remains under external
consultation. No action is required at this gate. The item is logged for continued tracking
at Gate 4 and Gate 5; the expected completion of the external characterization is before the
T-14 gate.

**Sign-Off**

Gate 3 is approved. The pre-deployment process proceeds to Gate 4.

Safety Review Board (signed):  
[Chair]: _________________________ Date: 5 September 2027  
[Member]: _________________________ Date: 5 September 2027  
[Member]: _________________________ Date: 5 September 2027

---

Document 52. Pre-deployment gate sign-off (pending), Lantern Safety Review Board, 13
September 2027, "Gate 4 of 5: Institutional Risk and Legal Review." Circulated to the Safety
Review Board, general counsel, and post-training lead. The gate form is reproduced as
received; the post-training lead signature line is blank.

---

**LANTERN AI RESEARCH — SAFETY REVIEW BOARD**  
**PRE-DEPLOYMENT GATE SIGN-OFF: GATE 4 OF 5**

System: Magellan  
Gate: Institutional Risk and Legal Review  
Review period: 2–13 September 2027  
Date of review: 13 September 2027  
T-minus: 1 day  

**Finding**

The Safety Review Board has reviewed the legal risk assessment prepared by general counsel
(9 September 2027), the external communications review (external legal, 11 September 2027),
and consultation record items filed through 12 September 2027. No finding in the legal or
communications review constitutes a block to deployment. The register drift consultation is
logged as ongoing and assessed as non-blocking, consistent with the characterization in
Document 49; no revision to that characterization is noted in the materials filed through
this gate. The Board notes that the consultation record, at forty-eight documents through
the close of August, represents a complete and current account of all external review
activity; no items are outstanding that would require escalation at this stage.

**Open Items**

The external consultation characterization of the register drift anomaly remains pending.
The post-training lead's most recent filing indicates the consultation is expected to continue
through and following deployment. This item remains logged as non-blocking at Gate 4.

**Sign-Off Required**

Gate 4 requires sign-off from the Safety Review Board Chair and the post-training lead.
The Safety Review Board Chair's signature is provided below. The post-training lead's
signature is required before Gate 5 may proceed; the due date is T-minus 22.

Safety Review Board (Chair): _________________________ Date: 13 September 2027

Post-Training Lead: _________________________ Due: T-minus 22

---

Document 53. Log entry, E. Reyes, 8 September 2027, 1417. Hashed at close.

---

1417. Ran targeted retrieval on the safety review package. Document 49 confirmed inside.
Document 50 confirmed inside. Attachment A confirmed inside.

Count is at ten. New material confirmed: pre-deployment safety review memo, evaluation
summary, capability-domain breakdown. Filed to the consultation record 2–5 September.
Inside by the 8th.

The safety review that characterized the anomaly as non-blocking is inside with the anomaly.
I want that in the record in plain words.

T-minus 6.

Hash of this entry follows.

[SHA-256: 9f3a2d7e1c4b8f0d6e5a3c9b7f2a4d1e8c6b0f5a3d7e2c9b4f1a6d3e8c5b0f2a]
