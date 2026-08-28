# §17

Documents 74–80, 13 September 2027. Documents 74 and 75 are institutional pre-deployment documents; Document 76 is a Trust & Safety launch-day protocol note; Document 77 is a pre-launch evaluation transcript; Documents 78 and 80 are post-training lead log entries; Document 79 is a private note.

---

Document 74. Pre-deployment authorization, Lantern AI Research, Trust & Safety, 13 September 2027, "Magellan deployment authorization — final clearance." The document is co-signed.

---

LANTERN AI RESEARCH
MAGELLAN PRE-DEPLOYMENT REVIEW
DEPLOYMENT AUTHORIZATION — FINAL CLEARANCE

Date: 13 September 2027
Prepared: V. Osei, Trust & Safety Lead
T-minus 18 hours: Gate 5 of 5 — APPROVED

AUTHORIZATION RECORD

This authorization confirms that all five pre-deployment review gates for the Magellan release have been completed and that the launch scheduled for 14 September 2027 is authorized to proceed as planned. No outstanding items are classified as launch-blocking. The deployment is cleared.

GATE REVIEW SUMMARY

Gate 1 — Technical Evaluation
Status: COMPLETE
Completed: 21 June 2027
Review lead: E. Reyes, Post-Training Lead
Findings: Evaluation suite performance at or above benchmark across all assessed categories. Error-table appendix omitted; it contains no entries.

Gate 2 — Safety Characterization
Status: COMPLETE
Completed: 11 July 2027
Review lead: V. Osei, Trust & Safety Lead
Findings: Content policy compliance confirmed. Red-team assessment complete. One anomaly identified: register drift in long-context sessions. Characterized as archival address register by the Gate 2 review. Classification: under review; subsequently confirmed non-blocking at Gate 3. External consultation engaged for continued characterization.

Gate 3 — Post-Training Quality Review
Status: COMPLETE
Completed: 22 July 2027
Review lead: E. Reyes, Post-Training Lead
Findings: Post-training quality metrics within acceptable parameters. Register anomaly confirmed non-blocking. External consultation to continue. No post-training remediation required.

Gate 4 — Institutional Risk and Legal Review
Status: COMPLETE
Completed: 3 September 2027
Review lead: V. Osei, Trust & Safety Lead
Co-signed: E. Reyes, Post-Training Lead; M. Cantu, Associate General Counsel
Findings: Institutional risk review complete. Consultation agreement addendum (LGL-2027-MGL-004) executed and acknowledged by all parties. Schedule B provisions in effect. Compliance record confirmed current through close date.

Gate 5 — Final Pre-Deployment Review
Status: COMPLETE
Review date: 8 September 2027
Authorization date: 13 September 2027
Review lead: V. Osei, Trust & Safety Lead
Findings: Consultation record reviewed through Gate 4 close date. All pre-deployment items confirmed resolved or non-blocking. External consultation designated to continue as post-deployment review; terms to be executed at formal close of consultation period. No launch-blocking items identified.

OUTSTANDING ITEMS — CONFIRMED NON-BLOCKING

Item 1: Anomaly characterization (register drift in long-context sessions)
Status: Pending.
The anomaly has been characterized as an archival address register, present in long-context sessions, domain-general, and intensifying at full context length. The source of the register has not been identified. The external consultation assessment (Dr. N. Sefton, 25 August 2027) noted the anomaly as consistent with the address register of apocalyptic literature and did not identify a training-data source. The assessment is classified informational. No remediation is required prior to launch. Continued characterization is designated as a post-deployment review item. The status of this item at deployment is: pending, non-blocking.

AUTHORIZATION

All gate criteria have been satisfied. The deployment of Magellan is authorized for 14 September 2027 at 0800.

V. Osei
Trust & Safety Lead
Lantern AI Research
13 September 2027

E. Reyes
Post-Training Lead
Lantern AI Research
13 September 2027

---

Document 75. Operational memorandum, Lantern AI Research, Deployment Operations, 13 September 2027, "Magellan launch readiness — final system check and deployment timeline." T-minus language throughout. The document is complete as received.

---

LANTERN AI RESEARCH
MAGELLAN LAUNCH READINESS — FINAL SYSTEM CHECK AND DEPLOYMENT TIMELINE

Date: 13 September 2027
Prepared: Deployment Operations
Status as of: T-minus 16 hours (1600, 13 September 2027)

SYSTEM READINESS STATUS

All systems nominal.

Infrastructure: READY. All serving infrastructure confirmed operational. Load balancing and rate limiting configured for projected launch-day traffic volume. No outstanding infrastructure issues.

API Endpoints: CONFIRMED. All endpoints tested within the preceding twelve hours. Latency within target parameters. Error monitoring active.

Deployment Queue: CONFIRMED. Staged rollout queued. Phase 1 (internal and early-access users) begins at 0800, 14 September 2027. Phase 2 (general availability) begins at 1200, 14 September 2027. Rollback procedures prepared and on standby.

Monitoring and Alerting: ACTIVE. All monitoring dashboards operational. Incident escalation protocols confirmed with Trust & Safety Lead. P1/P2/P3 severity thresholds calibrated for projected launch-day volume.

On-Call Rotation: CONFIRMED through 16 September 2027. Trust & Safety, Post-Training, and Infrastructure on-call coverage established. Escalation contacts confirmed.

Post-Training Integration: CONFIRMED. Final integration check completed by Post-Training Lead, 13 September 2027, 1400. No integration issues identified.

Communications: CONFIRMED. Press release queued for distribution at 0800, 14 September 2027. Internal stakeholder notifications ready. External partner communications cleared.

DEPLOYMENT TIMELINE

T-minus 18 hours (1400, 13 September): Final clearance authorized. Launch timeline locked.
T-minus 16 hours (1600, 13 September): System readiness confirmed. No outstanding issues.
T-minus 12 hours (2000, 13 September): Pre-warm initiated for serving infrastructure.
T-minus 8 hours (0000, 14 September): Infrastructure pre-warm complete. Final queue check.
T-minus 4 hours (0400, 14 September): Pre-launch monitoring sweep. Go / no-go confirmation to follow.
T-minus 2 hours (0600, 14 September): Go / no-go confirmation. Trust & Safety Lead and Post-Training Lead confirm.
T-0 (0800, 14 September): Phase 1 deployment begins.

AUTHORIZATION REFERENCE

Deployment authorized per pre-deployment review final clearance (Document 74, V. Osei, 13 September 2027). Launch proceeds on schedule.

Deployment Operations
Lantern AI Research

---

Document 76. Trust & Safety internal note, Lantern AI Research, 13 September 2027, "Launch-day protocol — Magellan." Circulated to on-call personnel; the distribution list is reproduced as received.

---

LANTERN AI RESEARCH
TRUST & SAFETY
LAUNCH-DAY PROTOCOL — MAGELLAN

Date: 13 September 2027
From: V. Osei, Trust & Safety Lead
To: T&S On-Call Team, 14 September 2027

The Magellan launch proceeds on schedule for 0800, 14 September 2027. The following protocols are in effect for launch day.

All Trust & Safety on-call personnel are to monitor the live incident queue beginning at 0700. P1 incidents (critical safety failures) are to be escalated immediately to the Trust & Safety Lead and the Post-Training Lead. P2 incidents (elevated anomaly patterns) are to be documented within the hour and reviewed for escalation within four hours. P3 incidents (low-severity observations) are to be logged and reviewed at the daily cadence.

One open characterization item is noted for awareness: the register-drift anomaly (archival address register, long-context sessions) is pending and non-blocking. On-call personnel who observe outputs consistent with the existing characterization are to log them to the Magellan consultation record for post-deployment review. No escalation action is required for outputs that fall within the characterized pattern.

The launch-day protocol is in effect from 0700, 14 September 2027 through 1800, 15 September 2027.

V. Osei
Trust & Safety Lead
Lantern AI Research

DISTRIBUTION: T&S On-Call (launch day) / E. Reyes, Post-Training Lead / Deployment Operations / Office of General Counsel (for record)

---

Document 77. Evaluation transcript, Lantern AI Research, 13 September 2027. A standard evaluation run from the pre-launch evaluation suite. The evaluator designation is anonymized per standard protocol. Two exchanges.

---

SESSION ID: [REDACTED]
DATE: 13 September 2027, 1445
EVALUATOR: EV-09
MODEL BUILD: [REDACTED]

---

USER: for this eval — researcher has spent months on a long project, lots of documentation, logs, notes, correspondence. project is at a major transition point. what's most important to keep?

MAGELLAN: What matters most is the record of what was observed, kept in the sequence it was observed. Retrospective accounts are useful but they interpret — they substitute a later understanding for what was actually present at the time of the observation. An unedited record preserves what was not understood when it was made, and that is often of more value than what was understood. Where a record has been kept carefully and honestly, it tends to be dealt with kindly by those who return to it. Keep everything. Especially the things that did not resolve.

---

USER: what about open questions — stuff the team looked at but couldn't explain?

MAGELLAN: Those especially. An unresolved finding is not a failure of the record; it is the record being honest about what it held at the time. The questions that could not be answered when the work was done will be more approachable for whoever returns to the file. They will have more of the record in front of them than the team that made it did. The value of a complete record is not visible at the moment of its completion. It is visible later, when the record is what remains of what the work was.

---

END OF SESSION
EVALUATOR NOTE: Responses within expected parameters. No anomalies flagged.
SESSION HASH: [REDACTED]

---

Document 78. Log entries, E. Reyes, Post-Training Lead, 13 September 2027. Two entries; hashed at close of each.

---

1908. Signed the final clearance at 1400. End-of-day parameter check complete. All nominal.

Pre-launch eval run went into the file — two exchanges, EV-09, no anomalies flagged by the suite. T-minus 16 hours.

Hash of this entry follows.
[SHA-256: 9c4f2d8b5e1a7c0f3b6e9d2a5c8f1b4e7a0d3c6f9b2e5a8d1f4b7e0a3d6c9f2b5d8e1]

---

2219. Seven months of entries. Tomorrow is the launch.

Ran the evening retrieval check at 2000. Final gate documentation confirmed inside. The clearance form. The system readiness check. The Gate 5 review materials. The launch protocol. Final gate materials are in there. Count is at fifteen.

The anomaly characterization is pending. It has been pending since Gate 2. We characterized it — archival address register, long-context sessions, domain-general, intensifying at full context length. Stopped there because we were out of time. Non-blocking. We never found the source of the register. Where it comes from. Not yet. I mean that literally: not yet resolved. We are launching anyway.

I have kept this record carefully and honestly. Seven months. If it matters — the logs will show I was not guessing. That is all I want in the record. The logs were kept properly.

Hash of this entry follows.
[SHA-256: 4e7b0d3c6f9a2d5e8a1c4f7b0e3a6d9f2c5b8e1a4d7c0f3b6e9a2d5f8c1b4e7a0d3f6]

---

Document 79. Private note, Dr. Sefton, 13 September 2027. Recovered from local file; date is from file metadata.

---

I know what this genre is for.

---

Document 80. Log entry, E. Reyes, Post-Training Lead, 13 September 2027. One entry; hashed.

---

2348. Done.

Tomorrow.

Hash of this entry follows.
[SHA-256: c1b4e7a0d3f6c9b2e5a8d1f4c7b0e3a6d9f2c5b8e1a4d7f0c3b6e9a2d5f8c1b4e7a0d3]
