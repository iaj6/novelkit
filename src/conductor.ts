import { runArchitect } from "./phases/architect.js";
import { runPlotter } from "./phases/plotter.js";
import { runThreads } from "./phases/threads.js";
import { runDrafter } from "./phases/drafter.js";
import { runEditor } from "./phases/editor.js";
import { runEditorContinuity } from "./phases/editor-continuity.js";
import { runEditorPacing } from "./phases/editor-pacing.js";
import { runEditorVoice } from "./phases/editor-voice.js";
import { runReader } from "./phases/reader.js";
import { runRepairFactNormalize } from "./phases/repair-fact-normalize.js";
import { readCostSummary, formatCostSummary } from "./runlog.js";

export type PhaseName =
  | "architect"
  | "plotter"
  | "threads"
  | "drafter"
  | "editor"
  | "editor-continuity"
  | "editor-pacing"
  | "editor-voice"
  | "reader"
  | "repair-fact-normalize";

/** Phases that `cdk run` iterates through. `editor` here expands into all three sub-passes. Repair phases are opt-in via `cdk repair`. */
export const RUN_ALL_PHASES: PhaseName[] = [
  "architect",
  "plotter",
  "threads",
  "drafter",
  "editor",
  "reader",
];

/** Every phase name `cdk phase ...` accepts. */
export const ALL_PHASE_NAMES: PhaseName[] = [
  ...RUN_ALL_PHASES,
  "editor-continuity",
  "editor-pacing",
  "editor-voice",
  "repair-fact-normalize",
];

export async function runPhase(phase: PhaseName, projectRoot: string) {
  switch (phase) {
    case "architect":
      return runArchitect(projectRoot);
    case "plotter":
      return runPlotter(projectRoot);
    case "threads":
      return runThreads(projectRoot);
    case "drafter":
      return runDrafter(projectRoot);
    case "editor":
      return runEditor(projectRoot);
    case "editor-continuity":
      return runEditorContinuity(projectRoot);
    case "editor-pacing":
      return runEditorPacing(projectRoot);
    case "editor-voice":
      return runEditorVoice(projectRoot);
    case "reader":
      return runReader(projectRoot);
    case "repair-fact-normalize":
      return runRepairFactNormalize(projectRoot);
  }
}

export async function runAll(projectRoot: string) {
  for (const p of RUN_ALL_PHASES) {
    await runPhase(p, projectRoot);
  }
  const summary = await readCostSummary(projectRoot);
  console.log("\n=== run summary ===");
  console.log(formatCostSummary(summary));
}
