# The Second Run

The wall thermometer in the receiver hut showed minus seventeen.

She had been awake since approximately 0200. The hab's air exchange ran in its regular twelve-minute cycle — a sound she had stopped consciously hearing in the first week of the winter — and she had lain in the bunk listening to it complete two full cycles before she gave up on the distinction between awake and asleep. She had not gone back to the hut at 0200. There was nothing useful to do there at that hour that could not wait until morning; the tape was where it was, the run was done, and sitting in a cold hut examining a printout she had already read three times was not a productive use of her remaining capacity. She had stayed in the bunk until 0630, when the sleeping bag's lining had gone from lukewarm to cool and the distinction between lying in it and not lying in it had become academic.

The walkway between the hab and the receiver hut was colder than it had been last night.

She felt it in the first pace past the hab hatch, before she had rounded the corner of the umbilical conduit: a quality of the air, a heaviness consistent with overnight pressure drop. Not dramatic. Enough that she noted it and kept moving. She had been reading Antarctic air for fifteen winters and she did not need to check the barometer to know what she was walking into.

The hut thermometer: minus seventeen. Three degrees below the minimum she had been holding.

She had left the space heater on its minimum-draw setting when she left last night — the generator's lowest stable configuration, not a shutdown. She had thought of this as a floor. It had been a floor of minus seventeen.

She wrote the reading in the hut log. Then she pulled the housing temperature sensor record. The tape housing's auto-sensor logged temperature at thirty-minute intervals; she read through the night's column from the bottom up. The lowest entry was 0347: minus seventeen, matching the hut.

The housing and the hut had reached the same temperature at the same time. She stood with the log open and worked out what this meant. The housing's small heating element — the element designed to maintain the tape at a stable temperature independently of the hut's space heater — had been running on minimum draw as well. She had not checked, in September, whether the housing heating element shared the minimum-draw circuit with the space heater. It did. The equipment notes had not flagged this. Or she had read the note and not flagged it as relevant, because in September she had not yet had a reason to care what the housing temperature did at generator minimum.

She wrote in the instrument log: *Housing heating element shares min-draw circuit with space heater. At generator minimum setting, housing temperature tracks hut temperature. Note for future.*

Then she set the heater to standard operating level and stood in her coat and watched the warm-up indicator cycle. Seven minutes on the wall clock — that was what the hut needed to come up from minus seventeen to working temperature; she had timed it before at similar overnight lows. Then she went to the reel housing.

---

The reel she needed to inspect was not the signal section. She would not handle the signal segment except under full protocol conditions — instrument setup running, every action entered in the log. What she needed was the monitoring record immediately before the signal: fifteen minutes of routine scan data wound on last, sitting at the reel's outermost circumference. The layer most exposed to whatever the housing had reached at 0347.

She set the reel in the aluminum inspection mount at the left end of the work bench and got the ten-power loupe from the instrument repair kit. The loupe's handle had worn smooth on one side from thirty years of use. She had bought it in Madison in 1961 for a field geology course, and she had carried it to field sites on four continents, and she had not anticipated in 1961 that she would spend three decades putting it to magnetic tape.

She unreeled the outer section slowly through the liner gloves — six inches, a foot, eighteen inches of tape running between thumb and forefinger, held taut. She put the glass to the base film first: the non-recording side, the clear plastic substrate. No delamination, nothing to note. She turned the tape and examined the oxide surface.

At the tape's outer margin — the edge that had sat at the reel's maximum circumference, where the mechanical stress of winding was highest and the housing temperature fluctuations reached first — the binder's surface texture had changed. Not visible at reading distance. Under ten-power magnification the oxide layer showed a variation at the edge: a faint roughening, a stress pattern in the binder that she recognized from the cold-degradation literature. It ran along the edge in a band two to three millimeters wide. She measured the affected length against the loupe's field and against the millimeter rule she kept in the repair kit for exactly this kind of estimate: approximately one inch, maybe a fraction more.

The primary recording track lay centered on the tape, well away from the margin. The stressed region had not reached it.

She ran the glass along the tape's length a second time, more slowly. The stress pattern did not change on second examination; it was what it was. She put the loupe down on the bench.

The problem with edge stress was that it progressed. At proper archive temperatures, in a controlled storage environment, binder stress at the reel edge could remain contained over months or years — she knew the literature, the studies that described stable edge stress not advancing into the recording area. Those studies had been done in laboratory conditions on tapes with controlled environmental histories. Her tape had spent eight months in a receiver hut, logged one housing temperature dip during Run 1 the night before, and had now spent four hours at minus seventeen. She did not know the rate at which the stressed region would advance toward the primary recording track. She would know more after the next run. She would know more after the run after that. She did not know this in a way she could calculate now, and calculating it now was not an option she had.

She rewound the section and returned the reel to the housing and wrote in the inspection log: *Outer layer (monitoring record, pre-signal section). Binder stress at tape edge, visible under 10x magnification. Extent approximately 1 inch; confined to outer 2–3mm; does not reach primary recording track at current state. Does not affect playback at current state. Monitor.*

She let *at current state* appear twice. It was the accurate formulation.

---

The space heater and the signal analyzer drew from the same generator circuit. She had known this since September; it had been in the equipment documentation as a theoretical load consideration. It had become a practical constraint when the voltage regulator began faulting during Run 1. She could not treat the combined draws as simply additive and check them against the generator's rated output. She had to leave margin for the regulator's fault threshold, which the brownout during Run 1 had demonstrated was a real number and not a specification abstraction.

She did the arithmetic at the instrument log's right margin in pencil.

Option one: run the heater at full capacity and load-shed it during each protocol run — heater off for the run's duration, the tape held at hut temperature, not housing temperature. This preserved the instrument run's quality but introduced thermal cycling around each run: heater on, heater off, heater on. Option two: run the heater at reduced capacity continuously, bringing the analyzer to full draw only during runs. This held the hut at a lower temperature overall, but constant. For the binder, she had read enough degradation studies to be confident of the following: thermal cycling was worse than a held lower temperature. Cycling, not cold alone, was what drove the stress. Constant was what she was managing for.

The number that balanced the two draws was 70 percent of the heater's rated capacity.

At 70 percent heater capacity running continuously, the combined load stayed below the regulator's fault threshold with enough clearance that she was willing to trust it. Full analyzer draw during a protocol run would not push the system past the threshold. The hut would hold three to four degrees below the minimum she had been maintaining. Not target temperature. Above last night's minus seventeen. Stable.

She wrote: *Heater 70% continuous. Full instrument draw during runs only. Combined draw within fault threshold.*

She drew a line under it and did not look at it again.

---

Protocol Run 2 started at 09:47.

Same calibration sequence as Run 1, same filter bank configuration, same tape transport threading procedure. The protocol was designed to be exactly reproduced between runs; variation between runs was supposed to come from the signal and the tape, not from the procedure. She needed those things to be separable.

Before starting the transport she checked the power gauge: 78 percent, the generator's morning baseline, stable after the overnight maintenance cycle. She initialed the log entry and started the run.

The generator held.

The display moved through the calibration sweep — frequency references locking in their sequence, the spectral baseline settling across the monitoring band. At ten minutes she recorded the intermediate log notation: no deviation, frequency references stable. At eleven minutes the calibration segment ended and the signal section began. She sat in the work chair with the hut at minus fourteen and watched the display. The oversuit was adequate at minus fourteen; her breath came out in small clouds when she moved but she was not moving. She had learned, in the protocol's early years, that the correct procedure during a run was to observe and not touch anything. The instrument made its measurements. The log recorded them. Her function was to be present and attentive and to leave the sequence alone.

At 10:04 the run completed. She took the printout from the output tray.

The timing parameters matched. The frequency stability measurements matched. The internal structure metrics — the measurements hardest to produce by any mechanism she had studied and hardest to explain by any source she had catalogued — matched the Run 1 record. The signal was on the tape. The binder stress visible under the magnifying glass had not yet produced measurable dropout in the primary recording track.

She wrote: *Run 2: signal intact. Visual binder stress present at reel edge. Does not affect playback at current state. Monitor.*

---

The power gauge: 71 percent.

Seven points from a clean run, without brownout, without warm-up cycle penalty. Run 1 had cost fourteen points, but Run 1 had included the regulator trip and the subsequent double warm-up. Seven percent was the clean-run cost. She wrote it in the estimate column next to last night's figure.

She crossed out the 7 she had written for remaining instrument runs. She wrote 6. Beside it: *Edge stress noted. Handle with minimum unreeling.*

---

She picked up the Run 1 printout from the work surface — face-up, where she had left it the night before — and held it under the desk lamp with the Run 2 printout beside it. She checked the Run 1 chart stock in better light than she had had at midnight. The ink was sharp on both sheets. The paper had not contracted visibly or cracked along its edges — thermal contraction of paper stock was a real concern at extreme temperatures, and minus seventeen was below what she preferred, though within the stock's specified range. The column values were legible in the direct lamplight, the line structure clean.

What the cold had done to the tape's oxide binder it had not done to the paper at the same rate. Paper, at these temperatures, was the more stable medium.

Still: the paper was in the receiver hut. The receiver hut was where the thermometer had shown minus seventeen at 0600.

She went to the equipment building and found the gray thermal blanket on the second supply shelf — flat-folded, in its original creases, untouched since she had catalogued it in September. Standard Antarctic emergency stock, never used. She brought it to the main hab and opened the equipment cabinet against the interior wall: the cabinet that drew from the hab's base heating circuit, away from any exterior surface, the warmest enclosed space in the station.

She spread the blanket along the bottom shelf, laid both printouts face-up inside the fold, and closed the cabinet door.

---

At 10:41 she adjusted the heater one notch above the 70 percent mark — a correction for the morning air still lagging behind the overnight low, not a change to the heating protocol she had established — and recorded the hut temperature in the log: minus fourteen. She wrote the Run 2 completion entry, closed the log, and went back across the walkway to the hab.

The umbilical conduit ran along the ceiling overhead, smelling of diesel exhaust and cold engine oil. She did not count the paces.

In the galley she put the kettle on. While it heated she ate something from the supply shelf — crackers, a tin she opened without closely reading the label — and stood at the bench. She spent the afternoon on maintenance paperwork: the monthly consumables log, the fuel accounting entries she had let slide for three days, the equipment hours log for the analyzer and the generator. These were real tasks. They had to be in the station record, and she had been neglecting them.

She poured the water into the green-enameled mug and drank the coffee standing. It went colder than it should. The corridor hatch seal was cracked along its lower edge — she had noted it in April, the maintenance log had the entry — and the cold bled through the gap at whatever temperature it was outside, which was somewhere below minus thirty and had been since the team left.

She rinsed the mug and set it on the drying rack.

She did not go back to the receiver hut that afternoon. The tape was where it was; the printouts were in the cabinet; the heater was running at 70 percent in a hut she was no longer in. Six runs in the instrument margin. Edge stress at the reel's outermost layer, not yet in the primary recording track.

Two true things. Not in conflict. The same fact at two points in time, and she was somewhere between them.

The galley's overhead light hummed at its usual frequency. Through the small window above the bench, the polar dark was total and unvarying in the way that it would be through August.
