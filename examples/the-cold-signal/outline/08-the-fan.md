# Chapter 8 — The Fan

**One-line summary:** The MicroVAX overheats; Elena repairs it under real pressure; the crisis reveals she does not want the data to disappear — which is information about herself that settles one of the three options.

**POV:** Elena Hartmann  
**Tense:** Third-person limited past  
**Setting:** Receiver hut (primary). Midpoint of the story. Day 8.  
**Target words:** ~2,800

---

## Goal
Elena's goal in this chapter is technical: diagnose and repair a hardware fault before it destroys the primary copy of the signal. The goal is practical and urgent. She does not have time, in the forty minutes of the crisis, to think about anything else.

## Obstacle
The fault is real and not immediately obvious — the MicroVAX is running the cooling fan at the wrong speed, which means the CPU temperature is climbing steadily. She has to identify the fault, find the spare part in the station supplies, and replace the component before the thermal cutoff triggers — or, worse, before the drive fails without triggering. She has done this kind of repair before. Not in these stakes.

---

## Action Beats

- **The morning before the fault.** Elena is in the receiver hut doing routine monitoring. She notices the MicroVAX fan sounds different — not stopped, not obviously failing, but at a pitch she hasn't heard before. She checks the fan speed in the diagnostic menu. It is running at 60% of nominal. This is not right.

- **She checks the temperature.** The CPU temperature gauge reads elevated — within spec, but climbing. She watches it for three minutes. It is climbing. She has perhaps forty minutes before the thermal cutoff engages and the system shuts down. If the system shuts down, the drive spins down safely. If the drive is unlucky, it doesn't. And in any event, when the system comes back up, she will need to verify the data integrity. The primary copy might survive. It might not.

- **She goes to get the spare parts.** To the main hut equipment locker — a sorted bin of small electronics spares, properly organized by the last full team. She needs a 12V 80mm fan, brushless, for the MicroVAX II chassis. She finds it. It is there. She notes, without exactly thinking it, that she was relieved before she opened the bin — that she was already hoping.

- **The repair.** She returns to the receiver hut. She does not have forty minutes to be careful so she is careful faster. She powers down the non-critical processes on the MicroVAX — keeps the disk drive active, keeps the data file open so it doesn't de-cache to disk mid-write — and opens the chassis. The old fan is seized. She replaces it with the new one, reconnects the cable, closes the chassis, brings the processes back up. It takes thirty-eight minutes.

- **The verification after.** She runs a file integrity check on the signal recording. It comes back clean. The file is intact. She checks the backup flags. She opens the file in the review application and advances to the 21:14:07 timestamp. The data is there. She lets out a breath.

- **She notices what happened.** She is standing in the receiver hut with her hands on the desk after the repair, and she notices, clearly, what she felt in the forty minutes of the crisis: she did not want the data to disappear. Not because she was afraid it would be found missing. Not because it complicated her options. She did not want it to disappear because she did not want it to disappear. This is new information.

- **She thinks it through.** What does it mean that she is protective of the data? She sits with this for a while. The signal does not belong to her — she knows this, has known it from the beginning. But she is, unmistakably, its custodian. She has been its custodian in good faith: verifying it, documenting it, preserving it. She has not destroyed it. She could have: the chassis was open, the drive was accessible, she had her hands inside the machine. She did not. She was never going to.

- **She crosses option 3 off the list.** Back at the main hut desk, she opens her field log to the page with the three options. She draws a single line through *Destroy.* She writes beside it: *Not an option. Has not been.* She considers this for a moment, then writes below it: *This was decided on night one.*

- **The 0800 call (placed late in the chapter, after the crisis).** She calls Varga slightly past 0800 — she was in the middle of the repair. She says: *Sorry, I was dealing with a hardware fault.* He says: *Anything serious?* She says: *Fan replacement on the MicroVAX. It's resolved.* He says: *Good.* A pause. *That's good.* She hears something in his pause that is not just weather status. She says: *All nominal now.* He says: *All right. Out.* She registers that she told him the truth — a hardware fault, resolved — and that the truth was a kind of screen.

---

## Outcome / Turn
Option 3 — destroy — is formally eliminated. Elena has drawn a line through it in her log. She knows, now that she writes it, that it was eliminated on the first night, when she made the copies. The equipment crisis was not the cause; it was the occasion for clarity. Two options remain, plus the blank fourth line.

## New Question Raised
If she is not going to destroy the data, and she has not yet transmitted it, what is she doing? Is she working toward publication? Or is there a fourth option she still cannot name?

---

## Continuity Notes
- MicroVAX fan fails and is replaced on Day 8; system survives with data intact; this is a physical event that exists in the station maintenance log
- Elena draws a line through option 3 in her field log and writes: *Not an option. Has not been. This was decided on night one.* — treat as actual log text
- The primary copy of the signal is confirmed intact after the fan crisis
- Elena tells Varga about the fan repair — this is the most technically specific thing she has shared with him about station events since Day 1; it is also a true thing that functions as misdirection
- Midpoint of the story: one option eliminated; two remain plus option 4
