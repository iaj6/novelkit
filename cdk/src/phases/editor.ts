import { runEditorContinuity } from "./editor-continuity.js";
import { runEditorCompression } from "./editor-compression.js";
import { runEditorPacing } from "./editor-pacing.js";

export async function runEditor(projectRoot: string) {
  // Order: continuity (fix facts) → compression (cut over-explanation) → pacing (macro arc assessment only).
  //
  // editor-voice is NOT in the default expansion. It remains available as an opt-in phase
  // (`cdk phase editor-voice`) and is still registered in ALL_PHASE_NAMES, so restoring it is a
  // one-line change here. It was removed on measurement, not taste: across 327 lifetime calls it
  // changed a median 0.31% of a chapter's words (p90 1.8%) for $81.07, left 172 mutations with no
  // changelog record, and has never had an effect measured by any instrument that could have said no.
  // See docs/editor-ablation.md for the pre-registered revert condition.
  await runEditorContinuity(projectRoot);
  await runEditorCompression(projectRoot);
  await runEditorPacing(projectRoot);
}
