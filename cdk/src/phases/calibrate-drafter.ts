import * as fs from "node:fs/promises";
import * as path from "node:path";
import { runAgent } from "../agentRunner.js";
import { loadState, isComplete, markComplete } from "../state.js";
import { loadConfig } from "../config.js";

const GUIDANCE_PATH = "canon/agent-guidance/drafter.md";
const CALIBRATION_DIR = "logs/calibration";

async function fileExists(p: string): Promise<boolean> {
  return fs.access(p).then(() => true).catch(() => false);
}

async function snapshotOriginalGuidance(projectRoot: string): Promise<void> {
  const guidance = path.join(projectRoot, GUIDANCE_PATH);
  const snapshot = path.join(projectRoot, CALIBRATION_DIR, "iter-0-guidance.md");
  if (!(await fileExists(guidance))) return;
  if (await fileExists(snapshot)) return; // don't overwrite an existing snapshot on resume
  await fs.mkdir(path.dirname(snapshot), { recursive: true });
  const content = await fs.readFile(guidance, "utf-8");
  await fs.writeFile(snapshot, content, "utf-8");
}

async function readGradeDecision(projectRoot: string, iter: number): Promise<"ACCEPT" | "REVISE" | null> {
  const file = path.join(projectRoot, CALIBRATION_DIR, `iter-${iter}-grade.md`);
  let text: string;
  try {
    text = await fs.readFile(file, "utf-8");
  } catch {
    return null;
  }
  // The grade report's last meaningful line should be "Decision: ACCEPT" or "Decision: REVISE".
  const match = text.match(/^Decision:\s*(ACCEPT|REVISE)\s*$/im);
  return (match?.[1] as "ACCEPT" | "REVISE" | undefined) ?? null;
}

export async function runCalibrateDrafter(projectRoot: string) {
  const config = await loadConfig(projectRoot);
  if (!config.calibration.enabled) {
    console.log("[calibrate-drafter] disabled in config — skipping");
    return;
  }

  // Preconditions: drafter guidance must exist, and there must be a chapter 1 outline.
  const guidancePath = path.join(projectRoot, GUIDANCE_PATH);
  if (!(await fileExists(guidancePath))) {
    console.log(
      `[calibrate-drafter] no ${GUIDANCE_PATH} — skipping (legacy project or architect didn't run yet)`
    );
    return;
  }

  const outlineDir = path.join(projectRoot, "outline");
  const outlineFiles = await fs.readdir(outlineDir).catch(() => [] as string[]);
  const ch1 = outlineFiles
    .filter((f) => f.endsWith(".md") && /^01-/.test(f))
    .sort()[0];
  if (!ch1) {
    console.log("[calibrate-drafter] no outline/01-*.md found — skipping (run plotter first)");
    return;
  }

  const state = await loadState(projectRoot);
  const completedKey = "calibrate-drafter:complete";
  if (isComplete(state, completedKey)) {
    console.log("[calibrate-drafter] already complete — skipping");
    return;
  }

  await snapshotOriginalGuidance(projectRoot);

  const maxIter = Math.max(1, config.calibration.max_iterations);
  console.log(
    `[calibrate-drafter] calibrating drafter guidance against brief — max ${maxIter} iteration${maxIter === 1 ? "" : "s"}`
  );

  let decision: "ACCEPT" | "REVISE" | null = null;
  for (let iter = 1; iter <= maxIter; iter++) {
    const sampleKey = `calibrate-drafter:iter-${iter}-sample`;
    const gradeKey = `calibrate-drafter:iter-${iter}-grade`;

    console.log(`[calibrate-drafter] iteration ${iter}/${maxIter}: writing sample`);
    if (!isComplete(state, sampleKey)) {
      await runAgent({
        phase: "calibrate-sample",
        projectRoot,
        userPrompt: [
          `Calibration iteration ${iter}. Produce a ~400-word sample of chapter 1's opening prose, demonstrating the current canon/agent-guidance/drafter.md applied to the actual outline/${ch1} beats.`,
          `Write the sample to logs/calibration/iter-${iter}-sample.md via write_file.`,
          `Do NOT write to draft/. Do NOT update logs or canon. The sample is calibration only.`,
          `Stop after the sample is written.`,
        ].join(" "),
      });
      await markComplete(state, projectRoot, sampleKey);
    }

    console.log(`[calibrate-drafter] iteration ${iter}/${maxIter}: grading sample`);
    if (!isComplete(state, gradeKey)) {
      await runAgent({
        phase: "calibrate-grade",
        projectRoot,
        userPrompt: [
          `Calibration iteration ${iter}. Grade logs/calibration/iter-${iter}-sample.md against the brief's audience/exemplar anchors and the current canon/agent-guidance/drafter.md.`,
          `Write your grade report to logs/calibration/iter-${iter}-grade.md via write_file. The report MUST end with a line of the form "Decision: ACCEPT" or "Decision: REVISE".`,
          `If your decision is REVISE, ALSO overwrite canon/agent-guidance/drafter.md with the revised content via write_file. Tighten only what the sample drifted on; keep what was working.`,
          `Stop after the grade (and optional revision) is written.`,
        ].join(" "),
      });
      await markComplete(state, projectRoot, gradeKey);
    }

    decision = await readGradeDecision(projectRoot, iter);
    if (decision === "ACCEPT") {
      console.log(`[calibrate-drafter] iteration ${iter}: ACCEPT — calibration converged`);
      break;
    }
    if (decision === "REVISE" && iter < maxIter) {
      console.log(`[calibrate-drafter] iteration ${iter}: REVISE — re-sampling under revised guidance`);
      continue;
    }
    if (decision === "REVISE" && iter === maxIter) {
      console.log(`[calibrate-drafter] iteration ${iter}: REVISE — max iterations reached, proceeding anyway`);
      break;
    }
    if (decision === null) {
      console.log(
        `[calibrate-drafter] iteration ${iter}: grade report had no parseable Decision line — proceeding without further iteration`
      );
      break;
    }
  }

  await markComplete(state, projectRoot, completedKey);
}
