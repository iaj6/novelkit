import { runEditorContinuity } from "./editor-continuity.js";
import { runEditorCompression } from "./editor-compression.js";
import { runEditorPacing } from "./editor-pacing.js";
import { runEditorVoice } from "./editor-voice.js";

export async function runEditor(projectRoot: string) {
  // Order: continuity (fix facts) → compression (cut over-explanation) → pacing (assess rhythm of resulting chapter) → voice (polish register last).
  await runEditorContinuity(projectRoot);
  await runEditorCompression(projectRoot);
  await runEditorPacing(projectRoot);
  await runEditorVoice(projectRoot);
}
