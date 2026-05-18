import { runEditorContinuity } from "./editor-continuity.js";
import { runEditorPacing } from "./editor-pacing.js";
import { runEditorVoice } from "./editor-voice.js";

export async function runEditor(projectRoot: string) {
  await runEditorContinuity(projectRoot);
  await runEditorPacing(projectRoot);
  await runEditorVoice(projectRoot);
}
