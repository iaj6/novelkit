import * as fs from "node:fs/promises";
import * as path from "node:path";
import { z } from "zod";
import { runAgent } from "../agentRunner.js";
import { readFindings, filterByMinSeverity, type Severity } from "../findings.js";

const REPAIR_LOG = "logs/repair-log.md";

const FactNormalizeParamsSchema = z.object({
  canon_source: z.string(),
  edits: z
    .array(
      z.object({
        file: z.string(),
        wrong_text: z.string(),
        correct_text: z.string(),
      })
    )
    .min(1),
});

export async function runRepairFactNormalize(
  projectRoot: string,
  minSeverity: Severity = "critical"
) {
  const findingsFile = await readFindings(projectRoot);
  if (!findingsFile) {
    console.log(
      "[repair-fact-normalize] no logs/findings.json — run `cdk review` first."
    );
    return;
  }

  const eligible = filterByMinSeverity(findingsFile.findings, minSeverity).filter(
    (f) =>
      f.category === "continuity-fact" &&
      f.auto_repair_safe &&
      f.repair_agent === "repair-fact-normalize"
  );

  if (eligible.length === 0) {
    console.log(
      `[repair-fact-normalize] no eligible continuity-fact findings at min severity=${minSeverity}.`
    );
    return;
  }

  await fs.mkdir(path.join(projectRoot, "revision-1"), { recursive: true });
  const logFile = path.join(projectRoot, REPAIR_LOG);
  const logExists = await fs
    .access(logFile)
    .then(() => true)
    .catch(() => false);
  if (!logExists) {
    await fs.writeFile(
      logFile,
      "# Repair Log\n\nEvery applied repair, in order, with before/after evidence.\n",
      "utf-8"
    );
  }

  console.log(
    `[repair-fact-normalize] ${eligible.length} eligible finding${eligible.length === 1 ? "" : "s"} at severity≥${minSeverity}`
  );

  for (const finding of eligible) {
    const params = FactNormalizeParamsSchema.safeParse(finding.repair_params);
    if (!params.success) {
      console.log(
        `[repair-fact-normalize] ${finding.id}: invalid repair_params — skipping. ${params.error.message}`
      );
      continue;
    }

    console.log(
      `[repair-fact-normalize] applying ${finding.id}: ${finding.title} (${params.data.edits.length} edit${params.data.edits.length === 1 ? "" : "s"})`
    );

    const editLines = params.data.edits
      .map((e, i) => `  ${i + 1}. In ${e.file}: replace "${e.wrong_text}" with "${e.correct_text}"`)
      .join("\n");

    await runAgent({
      phase: "repair-fact-normalize",
      projectRoot,
      userPrompt: [
        `Apply finding ${finding.id}: ${finding.title}`,
        `Canon source: ${params.data.canon_source}`,
        `Edits to apply:`,
        editLines,
        ``,
        `For each edit, follow the procedure in your system prompt: prefer revision-1/<basename>.md if it exists, else read the file at the path given; verify verbatim match; apply only the named substitution; write the result to revision-1/<basename>.md; log the change to logs/repair-log.md.`,
        `Stop after all edits in this finding are processed.`,
      ].join("\n"),
    });
  }
}
