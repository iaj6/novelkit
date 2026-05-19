import { runArchitect } from "./phases/architect.js";
import { runPlotter } from "./phases/plotter.js";
import { runThreads } from "./phases/threads.js";
import { runDrafter } from "./phases/drafter.js";
import { runEditor } from "./phases/editor.js";
import { runEditorContinuity } from "./phases/editor-continuity.js";
import { runEditorCompression } from "./phases/editor-compression.js";
import { runEditorPacing } from "./phases/editor-pacing.js";
import { runEditorVoice } from "./phases/editor-voice.js";
import { runReader } from "./phases/reader.js";
import { runContinuityFactAudit } from "./phases/continuity-fact-audit.js";
import { runRepairFactNormalize } from "./phases/repair-fact-normalize.js";
import { readCostSummary, formatCostSummary } from "./runlog.js";
import { estimateRun, formatDurationRange } from "./estimate.js";
import * as c from "./ansi.js";
import * as fs from "node:fs/promises";
import * as path from "node:path";

export type PhaseName =
  | "architect"
  | "plotter"
  | "threads"
  | "drafter"
  | "editor"
  | "editor-continuity"
  | "editor-compression"
  | "editor-pacing"
  | "editor-voice"
  | "reader"
  | "continuity-fact-audit"
  | "repair-fact-normalize";

/** Phases that `cdk run` iterates through. `editor` here expands into all four sub-passes. Repair phases are opt-in via `cdk repair`. */
export const RUN_ALL_PHASES: PhaseName[] = [
  "architect",
  "plotter",
  "threads",
  "drafter",
  "editor",
  "reader",
  "continuity-fact-audit",
];

/** Every phase name `cdk phase ...` accepts. */
export const ALL_PHASE_NAMES: PhaseName[] = [
  ...RUN_ALL_PHASES,
  "editor-continuity",
  "editor-compression",
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
    case "editor-compression":
      return runEditorCompression(projectRoot);
    case "editor-pacing":
      return runEditorPacing(projectRoot);
    case "editor-voice":
      return runEditorVoice(projectRoot);
    case "reader":
      return runReader(projectRoot);
    case "continuity-fact-audit":
      return runContinuityFactAudit(projectRoot);
    case "repair-fact-normalize":
      return runRepairFactNormalize(projectRoot);
  }
}

async function printPreRunBanner(projectRoot: string): Promise<void> {
  const est = await estimateRun(projectRoot);
  const projectName = path.basename(path.resolve(projectRoot));

  const sourceLabel =
    est.chaptersSource === "outline"
      ? c.dim("(from outline/)")
      : est.chaptersSource === "brief"
        ? c.dim("(from brief.md)")
        : c.dim("(default — no outline or brief target found)");

  console.log(c.bold("=== run plan ==="));
  console.log(`${c.dim("book:    ")} ${projectName}`);
  console.log(`${c.dim("chapters:")} ~${est.chapters} ${sourceLabel}`);
  console.log(`${c.dim("model:   ")} ${est.model}`);
  console.log(
    `${c.dim("estimate:")} ${c.cost(est.lowUsd, 2)}–${c.cost(est.highUsd, 2)} ${c.dim(`(expected ~${c.cost(est.expectedUsd, 2)})`)}`
  );
  console.log(
    `${c.dim("eta:     ")} ${c.dim(formatDurationRange(est.lowSeconds, est.highSeconds))}`
  );
  console.log(c.dim("(rough — calibrated from prior runs of similar pipelines; actuals vary)"));
  console.log("");
}

async function countWords(projectRoot: string): Promise<number> {
  const draftDir = path.join(projectRoot, "draft");
  try {
    const files = (await fs.readdir(draftDir))
      .filter((f) => f.endsWith(".md") && /^\d{2}-/.test(f));
    let words = 0;
    for (const f of files) {
      const text = await fs.readFile(path.join(draftDir, f), "utf-8");
      // Strip markdown headings + the chapter source comments for a cleaner count.
      const stripped = text.replace(/^#.*$/gm, "").replace(/<!--.*?-->/gs, "");
      const matches = stripped.match(/\S+/g);
      words += matches ? matches.length : 0;
    }
    return words;
  } catch {
    return 0;
  }
}

export async function runAll(projectRoot: string) {
  const startMs = Date.now();
  await printPreRunBanner(projectRoot);

  for (const p of RUN_ALL_PHASES) {
    await runPhase(p, projectRoot);
  }

  const summary = await readCostSummary(projectRoot);
  const wallMs = Date.now() - startMs;
  const wordsDrafted = await countWords(projectRoot);

  // Find the most expensive phase by total USD.
  const phaseEntries = Object.entries(summary.byPhase);
  phaseEntries.sort((a, b) => b[1].usd - a[1].usd);
  const heaviest = phaseEntries[0];

  console.log(`\n${c.bold("=== run summary ===")}`);
  console.log(formatCostSummary(summary));
  console.log("");
  console.log(`${c.dim("total spend:")}     ${c.bold(c.cost(summary.totalUsd))}`);
  if (wordsDrafted > 0) {
    const perKwd = summary.totalUsd / (wordsDrafted / 1000);
    console.log(
      `${c.dim("words drafted:")}   ${wordsDrafted.toLocaleString()} ${c.dim(`(~${c.cost(perKwd, 3)}/1k words)`)}`
    );
  }
  if (heaviest && heaviest[1].usd > 0) {
    console.log(
      `${c.dim("priciest phase:")}  ${heaviest[0]} ${c.dim(`(${c.cost(heaviest[1].usd)} across ${heaviest[1].calls} call${heaviest[1].calls === 1 ? "" : "s"})`)}`
    );
  }
  const wallSec = Math.round(wallMs / 1000);
  const wallLabel =
    wallSec < 60
      ? `${wallSec}s`
      : wallSec < 3600
        ? `${Math.floor(wallSec / 60)}m${wallSec % 60}s`
        : `${Math.floor(wallSec / 3600)}h${Math.floor((wallSec % 3600) / 60)}m`;
  console.log(`${c.dim("wall time:")}      ${wallLabel}`);
}
