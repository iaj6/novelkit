import * as fs from "node:fs/promises";
import * as path from "node:path";
import { runAgent } from "../agentRunner.js";
import { resolveManuscript } from "../manuscript.js";
import { readFindings } from "../findings.js";
import { RevisionPlanSchema, REVISION_PLAN_PATH, validateItem } from "../revise/schema.js";
import { missingPassages } from "../revise/postconditions.js";
import * as c from "../ansi.js";

const COLD_READ_DIR = "logs/cold-read";

/**
 * Produce a revision plan from the book's own diagnoses. Writes
 * logs/revision-plan.json with every item `approved: false` — planning is
 * deliberately inert until a human flips the flag.
 */
export async function runRevisePlan(projectRoot: string): Promise<void> {
  const chapters = await resolveManuscript(projectRoot);
  if (chapters.length === 0) {
    console.log("[revise-plan] no drafted chapters found — nothing to revise.");
    return;
  }

  const findings = await readFindings(projectRoot);
  const coldReadFiles = await fs
    .readdir(path.join(projectRoot, COLD_READ_DIR))
    .then((f) => f.filter((n) => n.endsWith(".json") || n.endsWith(".md")).sort())
    .catch(() => [] as string[]);

  if (!findings && coldReadFiles.length === 0) {
    console.log(
      "[revise-plan] no logs/findings.json and no cold-read reports — run `cdk review` or `cdk coldread` first."
    );
    return;
  }

  const sources = [
    findings ? `logs/findings.json (${findings.findings.length} findings)` : null,
    coldReadFiles.length ? `${COLD_READ_DIR}/ (${coldReadFiles.length} files)` : null,
  ].filter(Boolean);

  console.log(
    `[revise-plan] ${chapters.length} chapters · sources: ${sources.join(", ")}`
  );

  const chapterList = chapters.map((ch) => `  ${ch.relPath}`).join("\n");

  await runAgent({
    phase: "revise-plan",
    projectRoot,
    userPrompt: [
      "Produce a revision plan for this manuscript, following your system prompt.",
      "",
      `The effective manuscript is ${chapters.length} chapters — read them at these paths,`,
      "which already resolve any prior repairs:",
      chapterList,
      "",
      "Diagnoses to work from — every plan item must trace to at least one of these:",
      findings ? "  logs/findings.json" : "",
      ...coldReadFiles.map((f) => `  ${COLD_READ_DIR}/${f}`),
      "",
      `Write the plan to ${REVISION_PLAN_PATH} via write_file as JSON matching the schema in`,
      'your system prompt. Every item must have "approved": false — you are proposing, not deciding.',
      "Stop once the file is written.",
    ]
      .filter((l) => l !== "")
      .join("\n"),
  });

  // Validate what the planner wrote rather than trusting it: a malformed plan
  // discovered at apply time would be discovered while holding the manuscript open.
  const planPath = path.join(projectRoot, REVISION_PLAN_PATH);
  const raw = await fs.readFile(planPath, "utf-8").catch(() => null);
  if (raw === null) {
    console.log(`[revise-plan] ${c.yellow("no plan was written")} to ${REVISION_PLAN_PATH}.`);
    return;
  }
  const parsed = RevisionPlanSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`)
      .join("; ");
    console.log(`[revise-plan] ${c.yellow("plan does not match the schema")}: ${detail}`);
    return;
  }

  const problems = parsed.data.items.flatMap(validateItem);
  for (const p of problems) console.log(`[revise-plan] ${c.yellow("invalid item")}: ${p}`);

  // Verify the planner actually quoted verbatim. Observed on the first live run: it
  // paraphrased a protected passage ("Address on Dorobanților visit pending" for
  // "…not yet visited"), which is caught at apply time — but only after a human has
  // read and approved the plan, and it presents as a silent skip. Reporting it here
  // makes it fixable while the plan is still being reviewed.
  const unverified = parsed.data.items.flatMap((item) =>
    missingPassages(item.protected_passages, chapters).map((p) => ({ item: item.id, p }))
  );
  if (unverified.length > 0) {
    console.log(
      `[revise-plan] ${c.yellow(`${unverified.length} protected passage(s) do not match the manuscript verbatim`)} —`
    );
    console.log(
      c.dim("  these items will be SKIPPED at apply time; fix the quotes or drop the passages.")
    );
    for (const { item, p } of unverified) {
      console.log(`  ${item} · ${p.chapter}: "${p.text.slice(0, 70)}${p.text.length > 70 ? "…" : ""}"`);
    }
  }

  const byClass = parsed.data.items.reduce<Record<string, number>>((acc, i) => {
    acc[i.class] = (acc[i.class] ?? 0) + 1;
    return acc;
  }, {});
  console.log(
    `[revise-plan] ${c.green("wrote")} ${REVISION_PLAN_PATH} — ${parsed.data.items.length} item(s) ${JSON.stringify(byClass)}`
  );
  console.log(
    c.dim(
      `[revise-plan] nothing is applied yet. Review the plan, set "approved": true on the items you want, then run \`cdk revise <dir> --apply\`.`
    )
  );
}
