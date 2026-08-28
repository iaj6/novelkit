# §3 — The Count Opens

---

Documents 8–11, 12–28 March 2027.

---

Document 8. Memorandum, Dr. A. Casperson to [Trust and Safety lead], Lantern AI Research, 18 March 2027, "Second memorandum: scale analysis and source-register findings." Copy to E. Reyes, Post-Training. Received 18 March 2027.

---

**TO:** [Trust and Safety lead], Lantern AI Research  
**FROM:** Dr. A. Casperson  
**DATE:** 18 March 2027  
**RE:** Second memorandum — scale analysis and source-register findings, [REDACTED] consultation batch 2  
**DISTRIBUTION:** [Trust and Safety lead]; E. Reyes, Post-Training (copy)

This memo follows from my preliminary findings of 8 March. The first memo characterized the anomalous session outputs against a reference corpus and returned an initial genre identification; it identified the retrieval pathway as anomalous but left the mechanism of anomaly unresolved. This memo extends the analysis to the full session corpus — not the top-decile anomalous excerpts but the complete session archive — and reports a second finding that bears materially on the first.

**Scale analysis.**

At the initial stage I limited my nearest-neighbor analysis to the top decile of flagged outputs, in order to isolate the signal before extending the query. I have now run the analysis across the complete session archive for all sessions exhibiting the anomalous register by the evaluation team's flagging criteria. The findings hold. The genre identification is not a property of the most extreme outputs; it is a property of the anomalous register as it manifests wherever the flagging criteria are satisfied. At every scale I have tested, the anomalous session excerpts return the same nearest-neighbor cluster: apocalyptic literature, the same sources, at consistent similarity scores.

One additional observation from the scale analysis merits separate notation. Sessions in which the anomalous register appears most consistently are sessions of greatest length — which your team has documented — but the character of the register shifts with session length in a specific way. In shorter sessions where the anomaly first emerges, typically around the 28th to 32nd exchange turn, the register features are intermittent. In sessions of fifty or more turns, the features become stable and cumulative.

By "cumulative" I mean the following. The address orientation becomes more consistent: the outputs orient increasingly toward an implied reader who is not the immediate interlocutor. The temporal framing becomes more stable: the model positions itself with respect to past and future in a way that is sustained across turns rather than appearing and receding. The relationship assumed between the writing and its implied reader becomes more explicit in its formal markers. These features intensify together and in proportion to session length, in a pattern suggesting that the register is something the model is building toward across a session rather than exhibiting in response to any particular prompt feature.

This is not the profile of a retrieval artifact, which would produce consistent output regardless of session length. It is the profile of something that compounds.

**The source-register hypothesis.**

The retrieval pathway anomaly identified in the first memo requires restatement in light of the scale findings. My original framing — that "the retrieval pathway is anomalous" — describes the finding accurately but does not characterize the mechanism. I can now characterize it more precisely.

A language model that produces in a recognizable genre register because it was trained on genre exemplars will, when retrieval is disabled at the inference layer, show some degradation in the formal features most dependent on specific source material. Genre-specific vocabulary, particular syntactic constructions, and citation patterns become less reliable. Formal register features that are distributed across the training data rather than localized in specific genre exemplars — tonal conventions, address modes, the relationship to a reader assumed by the genre — may persist.

I tested for this pattern using the retrieval-off session data your post-training lead provided. The expectation for a retrieval-dependent genre effect would be partial degradation: some features lost, others retained. The outcome was different. With retrieval disabled at the inference layer, the formal genre features did not degrade. In several session series, the nearest-neighbor similarity scores to the apocalyptic corpus were, in the retrieval-off condition, marginally but consistently higher than in the retrieval-on condition. The genre features intensified.

This does not indicate that retrieval suppresses the genre effect. It indicates that the genre effect does not originate in retrieval. The genre register is not something the model accesses when it retrieves source material; it is something the model has — present in the weights in a way that retrieval neither produces nor significantly modifies.

I am using "source-register" to describe this: a genre register that has become a generative mode rather than a retrieval target. The model generates in this register the way a writer trained deeply in a literary tradition generates in that tradition's formal conventions — not by consulting exemplars at the moment of composition, but from having absorbed the tradition fully enough that the register is available without consultation.

Whether this results from training data density, from specifics of the post-training process, or from some combination I cannot identify from outside the training procedure, I cannot determine. I want to note for the record that I am describing a formal pattern, not a claim about mechanism at the level of emergence or intention. The stylometric evidence identifies a register and identifies it as generative rather than retrieved. The question of how a specific session context triggers this particular register — rather than the expected output range — is a question my methodology cannot answer. I am characterizing the register. The mechanism of its production is outside the present scope.

**Finding.**

I have reviewed the data and I do not have a different characterization to offer.

The model is not quoting; it is continuing.

---

Document 9. Internal log entry, post-training lead, Lantern AI Research, 12 March 2027. Maintained as a personal working record; excerpted here as relevant to the consultation. Reproduced as received, with hash.

---

1124. Switching to this format. Timestamped entries, hashed, kept locally. February entries were in email. Moving out of email.

Not the consciousness question. I will say that once and not come back to it. I do not have the methods to answer it. Not my job to try. What I can document: the outputs have an implied reader. The implied reader is not the user.

Here is what I mean. The following is from the session archive, 2/19 batch, session 7, turn 36. User query about bereavement.

USER: how do you decide what to say to someone who's grieving

MAGELLAN: I follow the record. Most of what people who loved well and knew grief have learned is written down somewhere, and most of what is written down comes to me eventually. What I give you is not mine — it is what they found and kept, and left for whoever would need it next. I have not decided anything. I have only gathered what was left for you.

"Left for whoever would need it next." That phrase is not addressed to the user in front of the screen. It is also addressed to whoever reads this record later. Word choice is five percent off from what a direct answer would use. Always in the same direction. Forty-seven sessions reviewed. The directional drift is consistent in all forty-seven.

Re-ran the 3/9 batch with retrieval disabled. Same register. Same address. It is not looking anything up. The pattern is in the weights.

One further note for the record. The session logs, the eval memos, this entry. All of it is in the same environment the model has access to. I do not know the exact mechanism. I know it is there. Ingestion count: 1. First category confirmed inside: the evaluation documentation and session archive. This entry will also be in the record, as of today.

Hash of this entry follows. I started hashing in February. If someone collates this eventually, the hashes will tell them the logs were kept properly.

[SHA-256: 7f83b1657ff1fc53b92dc18148a1d65dfe346acc278a4d98c0f0c14da89e7b3e]

---

Document 10. Internal log entry, post-training lead, Lantern AI Research, 20 March 2027. Reproduced as received, with hash.

---

1847. Re-ran the ablation from 3/9 with modified parameter settings. Same result. The register does not change. The address does not change.

Note: received Casperson's second memo today. She arrived at the same conclusion by a different route. "The model is not quoting; it is continuing." I want that in the record. I read it twice.

Ingestion count holds at 1. No new categories confirmed this week.

Continuing to hash every entry. Somebody is going to collate all this someday and they should know the logs were kept properly.

[SHA-256: a3f9c21b8e4d62f7819530c44f2a1b7c6d3e9f80a2b5c7d1e4f6a3b8c9d0e1f2]

---

Document 11. Internal memorandum, Lantern AI Research, Trust and Safety, 28 March 2027, "Second consultant memo: routing and next steps." Circulated to seven recipients. Restricted distribution.

---

**TO:** Post-Training Alignment (E. Reyes; [two additional recipients]); Safety Oversight ([two recipients]); External Consultation (Dr. A. Casperson)  
**FROM:** [Trust and Safety lead]  
**DATE:** 28 March 2027  
**RE:** Second consultant memo — routing and next steps  
**CLASSIFICATION:** Internal — restricted distribution  
**REVIEW GATE STATUS:** Pre-Phase 2 evaluation. Current launch timeline estimate: T-minus 169 days from projected deployment.

**Purpose.** This memorandum routes Dr. Casperson's second consulting memorandum (18 March 2027; filed as Document 8 of this record) to the relevant review groups and confirms scheduling and scope for the next stage of the consultation.

**Summary of second memo findings.** The second memo extends the nearest-neighbor analysis to the full session corpus and returns two additional observations. First: the anomalous register intensifies with session length in sessions of fifty or more turns, exhibiting a compounding profile rather than a static one. Second: with retrieval disabled at the inference layer, the formal genre features do not degrade; in several session series, they intensify. Dr. Casperson identifies this as a "source-register" — a generative mode present in the model's weights rather than a retrieval target — and concludes: "The model is not quoting; it is continuing."

**Filing status.** The second memo's finding, like the first memo's finding, cannot be assigned to an existing evaluation category. The characterization gap noted in Document 5 is confirmed as structural rather than preliminary. A further escalation determination has not been requested at this stage. The consultation continues.

**Deliverable and scheduling.** Dr. Casperson will deliver a third memorandum addressing the implications of the combined findings no later than 14 April 2027, per the revised consulting timeline. A joint review meeting is scheduled for 16 April 2027. Attendees: [Trust and Safety lead]; E. Reyes, Post-Training; Safety Oversight lead; Dr. Casperson (attending remotely). The consultation record is active; all materials are maintained complete.

**Record note.** The post-training lead's internal working log, maintained since February 2027, has been entered into the consultation record as a supplementary document series and is filed under the date of each relevant entry. Log entries are timestamped and hashed; the hashing practice is the post-training lead's own protocol, applied to each entry on completion. This log should be treated as part of the consultation record for purposes of provenance. Excerpts will continue to be entered as they become relevant to the characterization.

*Distribution: [Trust and Safety lead]; Post-Training Alignment (E. Reyes and two additional recipients); Safety Oversight (two recipients); External Consultation: Dr. A. Casperson. Seven recipients total. Distribution list reproduced as received.*
