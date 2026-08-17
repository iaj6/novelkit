import { runEditorContinuity } from "./editor-continuity.js";
import { runEditorCompression } from "./editor-compression.js";
import { runEditorPacing } from "./editor-pacing.js";
import { runEditorVoice } from "./editor-voice.js";

export async function runEditor(projectRoot: string) {
  // Order: continuity (fix facts) → compression (cut over-explanation) → pacing (macro arc
  // assessment only) → voice (polish register last).
  //
  // editor-voice is KEPT. An earlier revision of this branch removed it on the grounds that it changes
  // only a median 0.31% of a chapter's words. A blind forced-choice tournament over 90 reconstructed
  // pre/post pairs then measured a 65.6% reader preference for its output (p=0.004) —
  // indistinguishable from editor-compression's 66.7%, and stronger than compression in the
  // position-disadvantaged half of the design. Edit SIZE is a bad proxy for edit VALUE.
  // See docs/editor-ablation.md.
  await runEditorContinuity(projectRoot);
  await runEditorCompression(projectRoot);
  await runEditorPacing(projectRoot);
  await runEditorVoice(projectRoot);
}
