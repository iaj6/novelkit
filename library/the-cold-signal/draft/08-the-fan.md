# The Fan

The receiver hut at 0712 had the quality it always had before the diagnostic checks began: the chart recorder's stylus marking slow time across its roll, the MicroVAX's drive heads cycling in their patient rhythm, the green trace of the spectrum display running flat at this hour. Elena had learned not to read the absence of signal as stillness. The instruments were always busy. The universe was quiet.

She was entering the morning status into the maintenance log when she heard the fan.

It was not stopped. It was not laboring in any way she could name. It was running at a pitch a half-tone below its ordinary register — not a sound she had a word for, but one her body registered before her mind caught up to it. She held the pen and listened for the sound to come again.

It came again.

She set the pen down and pulled up the diagnostic menu on the terminal.

*Fan speed: 60% nominal.*

She looked at this for a moment. Sixty percent was not shutdown. Sixty percent was the fan running wrong — the speed at which a cooling system begins to fall behind rather than fail, the beginning of a condition rather than the condition itself. Below sixty the system would trigger a warning alarm. At sixty it was merely wrong, in the way a fever of thirty-nine degrees is wrong: stable, measurable, moving in the wrong direction.

She went to the temperature gauge.

The CPU temperature read 41 degrees Celsius. The high-alarm threshold was 52. Within specification, but the number was not static. She watched it for three minutes, counting her breaths, keeping the watch still against the desk edge. The gauge moved from 41 to 43. She did the arithmetic: a rise of two degrees in three minutes. These rates accelerated; that was the nature of them. She had somewhere between thirty-five and forty minutes before the thermal cutoff engaged.

The cutoff would protect the processor. It would also spin the drive down. If the shutdown happened cleanly, the data would survive in whatever state the cache held it. If the drive was mid-sector at the wrong moment, that sector might not be recoverable. She had three copies of the signal: the MicroVAX primary, the 9-track tape in the fireproof box two meters to her left, the paper chart recorder output folded in the tray. Two of the copies were not on the drive she was looking at. This was the correct way to think about it.

She thought about the primary copy on the drive and not about the other two.

She went to get the spare fan.

---

She did not have time to dress properly so she dressed quickly: jacket off the hook by the door, boots pulled on without lacing. The thermometer outside read minus thirty-eight. She took the orange guide rope in her right hand and moved.

The rope was cold enough at this temperature that holding it without a glove was an error she would pay for at the fingertips; she made it an error of sixty meters and did not let go. The main hut door seal gave its familiar soft resistance and she was inside. She unzipped her jacket without removing it and went to the back hallway.

The equipment locker was two metal racks, floor to ceiling, sorted by the last full team before they rotated out in March. Connectors and cables on the left. Power supplies and voltage converters, middle shelf. Small cooling components — fan assemblies, thermal paste, heat-sink clips — third shelf from the bottom.

She needed a 12-volt brushless fan for the MicroVAX II chassis, 80-millimeter frame. The spare-parts manifest was taped to the inside of the locker door. She found the entry in the time it took to read four lines.

She reached for the bin. Then she noticed — the bin still closed, its contents not yet visible — that she had already been hoping the part was there. Not the methodical confidence of a person who had checked the manifest and confirmed a match: the manifest listed a fan of the correct voltage but she had not yet verified the frame size. She had been hoping before she had anything to hope on. She registered this and opened the bin. 80-millimeter, brushless, 12-volt. She checked the lot number against the manifest.

It was there.

She latched the locker and went back.

---

The MicroVAX II chassis opened from the right side panel. Elena powered down the monitoring subroutines — spectrum logging, bandpass diagnostics, the scheduler — and left the disk drive active. If the data file was held open by any process writing to it, a sudden drive power loss would be worse than the thermal cutoff. She checked the process list. The file was cached and not being written to. She left the drive and the cache intact.

She removed the panel.

The fan was in the lower rear of the chassis, cable-loomed to the main board power connector. She touched the blade with one finger. It did not move. Seized: not failed electrically — the motor was still drawing current, which was why the diagnostic had read sixty percent rather than zero — but the bearing race was worn, the blade physically stuck. The motor was running. The fan was not.

Four mounting screws, small-head flathead. She had the driver from the tool drawer. She removed each screw and held it between her lips while she worked the next — a lab habit from places where a dropped screw meant a lost screw — and when she had all four she set them on the desk edge in a row. The cable disconnect was a press-tab style. She pressed the tab, pulled the connector clear, set the old fan aside.

The new fan: same connector, same screw pattern. She seated it in the mount and drew each screw down finger-tight before torquing, not because any protocol specified this sequence but because she had been doing it this way for twenty years and it was faster than the alternative. Cable reconnect, tab seated, the small click of seating. Side panel back.

She powered the monitoring subroutines up and returned to the diagnostic menu.

*Fan speed: 97% nominal.*

The temperature gauge read 47 — it had climbed while she worked, from 43 to 47, but 47 was not 52 and the thermal cutoff had not triggered. She watched the gauge for two minutes. It moved from 47 to 45, then to 44. The fan noise in the chassis had returned to its ordinary register, the pitch she had been hearing for eight days without attending to it. She attended to it now: the sound of something running correctly.

The repair had taken thirty-eight minutes.

---

She ran the file integrity utility from the command prompt. The cursor blinked for twelve seconds. The output printed: file structure intact, all sectors accounted for, checksum matching the logged value from Day 1. She checked the backup flags in the session record. The 9-track write had occurred on Day 1 and had not been touched since, its checksum still the original. She opened the signal data file in the review application and advanced the timestamp to 21:14:07.

The trace appeared on the display. The signal. Its shape. Forty-seven seconds of it, unchanged.

She let out a breath.

She stood at the desk with her hands flat on the surface, and then she paid attention to what she was doing, and then she paid attention to what the last thirty-eight minutes had been.

---

She had done this category of repair before: the urgent problem, the data at risk, the kind of care that is not hurry but is calibrated to the size of the window. She was familiar with its texture. She had fixed instrument problems in this hut and in other huts, in other countries, under conditions that were sometimes worse. The category was not new.

What was new was what she had felt while her hands were inside the machine.

She had not wanted the data to disappear. She examined this now with the same precision she gave any observation, because it was an observation and not yet an interpretation. She had not wanted it to disappear. Not because it would complicate her options — the options had been holding for eight days, and losing the primary copy would have changed their geometry without eliminating them. Not because she was afraid of being found to have lost it: no one was going to audit this drive before the LC-130 arrived, and she was the only person who knew there was anything on it worth auditing. The reason she had felt what she felt in the thirty-eight minutes — the flat purposeful relief of hearing the fan come back to speed, of watching the temperature gauge begin its slow return — was simpler than any of that, and it did not reduce further.

She had not wanted the data to disappear because she had not wanted the data to disappear. That was the entire structure of the feeling.

She stood with this.

The signal did not belong to her. She had known this since the first morning, since she had copied it three times in sequence and held the tape in both hands to label it. Whatever the signal required, her own preferences were not the deciding instrument. She was its custodian. She had been its custodian in good faith for eight days: verifying, documenting, preserving, checking integrity. This was not different from any other data she had ever been responsible for. The difference was in what it was, not in what the responsibility required of her.

But she had had her hands inside the chassis this morning. The drive had been accessible. The data was on a medium that responded to physical contact. She had not considered it.

She searched back through the thirty-eight minutes and found no moment at which the option had presented itself to her — not as a temptation, not as a calculation she had suppressed, not as a thought requiring dismissal. She had been removing screws and seating connectors and watching the temperature gauge and the option had not arisen. She searched further back: the cache hut on Day 6, with the inventory half done. Day 3, verification complete, four hours before the next scheduled call. The first night, making the copies one after the other in sequence.

The option had not arisen in any of those. What had been in her field log was the notation of a live possibility, kept alive because the protocol of honest deliberation required holding it until she understood it. She had understood it this morning. What she understood was that she had never been going to do it. The option had eliminated itself on the night she made the first copy. Everything after that had been the time it took to see what had already happened.

---

She went to the main hut.

The field log was on the radio room desk where she had left it the night before, the Day 7 entry still the last full page. She turned back to the earlier portion of the log, to the page she had written on Day 4: the three numbered lines and the blank fourth.

*1. Transmit.*  
*2. Preserve for orderly publication.*  
*3. Destroy.*  
*4.*

She uncapped her pen and drew a single line through *Destroy.* Not scored into the paper; just a line, a mark in the record, the pen stroke she gave any cancelled item. She wrote in the margin beside it: *Not an option. Has not been.*

She looked at this for a moment, then added below it, as a separate entry: *This was decided on night one.*

She read what she had written. It was accurate. The fan had not made the decision; the fan had been the occasion for seeing a decision that was already eight days old. Two options remained on the page. The fourth line, still blank.

The wall clock read 0839.

---

She went to the radio room chair and picked up the handset. The schedule window had opened at 0800; she had missed it by thirty-nine minutes. Varga would not have worried yet — missed windows had explanations, and he did not worry on principle — but the missed window was in his log, which meant it was in the record.

"Halvorsen to South Pole, do you copy."

The frequency opened immediately. He had been monitoring it.

"South Pole reads you, Halvorsen. Copy."

"Sorry for the window," she said. "I was dealing with a hardware fault."

A pause — short, not his characteristic two beats. Something quicker.

"Anything serious?"

"Fan replacement on the MicroVAX," she said. "It's resolved."

"Good." A longer pause now, three beats. "That's good."

She heard something in the second pause that was not weather status, not the ordinary welfare question. It was the sound of a person deciding what to ask next and then not asking it. She knew this sound. She had been making it herself for eight days, in the other direction, across the same frequency.

"All nominal now," she said.

"All right." A shorter pause. "Out."

She returned the handset to the bracket and sat for a moment.

She had told him the truth. There had been a hardware fault; it had been on the MicroVAX; it had been resolved by a fan replacement. Each statement was accurate. She had given him the most operationally specific account of her work she had offered in eight days of daily calls, and it was, of everything she might have said, the least.

She noted this without pursuing it further. The Day 8 entry in the field log would read: *Fan failure, MicroVAX II — bearing race seized, 60% nominal. Replaced from spare stock, equipment locker. System nominal, data integrity verified, 0801. Varga call, 0839.* She picked up the pen and wrote it. She closed the log.

In the receiver hut, sixty meters along the orange rope, the new fan was running at 97% of nominal. The temperature gauge would be reading 41 by now, or 40. The trace at 21:14:07 would be on the disk the same as it had been an hour ago and three days ago and eight days ago — forty-seven seconds of it, unchanged, the checksum matching the value logged on the night it arrived.

She left the log closed on the desk.
