import * as fs from "node:fs/promises";
import * as path from "node:path";
import { runAgent } from "../agentRunner.js";
import { loadConfig } from "../config.js";
import { loadState, isComplete, markComplete } from "../state.js";
import { resolveManuscript, REVISION_DIR } from "../manuscript.js";
import {
  RevisionPlanSchema,
  REVISION_PLAN_PATH,
  approvedItems,
  validateItem,
  type RevisionItem,
} from "../revise/schema.js";
import {
  snapshotChapters,
  rollback,
  missingPassages,
  checkPostconditions,
  invariantBaseline,
  describeFailure,
} from "../revise/postconditions.js";
import * as c from "../ansi.js";

const REVISION_LOG = "logs/revision-log.md";

async function appendLog(projectRoot: string, lines: string[]): Promise<void> {
  const file = path.join(projectRoot, REVISION_LOG);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const exists = await fs.access(file).then(() => true).catch(() => false);
  const header = exists
    ? ""
    : "# Revision Log\n\nEvery applied revision item, in order, with its post-condition result.\n";
  // Append rather than rewrite: this log is the only human-readable record of what
  // was changed and why, and truncating it would destroy prior passes.
  await fs.appendFile(file, `${header}\n${lines.join("\n")}\n`, "utf-8");
}

function itemPrompt(item: RevisionItem, chapterPaths: Map<string, string>): string {
  const protectedList = item.protected_passages.length
    ? item.protected_passages
        .map((p) => `  - in ${p.chapter}: "${p.text}"${p.why ? ` (${p.why})` : ""}`)
        .join("\n")
    : "  (none declared)";

  const targets = item.chapters
    .map((id) => `  ${id} → read ${chapterPaths.get(id) ?? `draft/${id}.md`}`)
    .join("\n");

  return [
    `Revision item ${item.id}: ${item.title}`,
    `Rationale: ${item.rationale}`,
    `Answers findings: ${item.source_findings.join(", ")}`,
    "",
    "Chapters in scope (do not touch any other chapter):",
    targets,
    "",
    `What to do: ${item.instruction}`,
    `Done when: ${item.acceptance}`,
    "",
    "Passages that MUST survive verbatim — these are checked mechanically after you",
    "finish, and the whole item is rolled back if any is lost:",
    protectedList,
    "",
    `Write each revised chapter to ${REVISION_DIR}/<chapter-id>.md via write_file.`,
    "Leave draft/ untouched. Change only what this item calls for — you are answering one",
    "diagnosis, not giving the chapter a general polish.",
  ].join("\n");
}

export async function runReviseApply(
  projectRoot: string,
  opts: { approveAll?: boolean } = {}
): Promise<void> {
  const planPath = path.join(projectRoot, REVISION_PLAN_PATH);
  const raw = await fs.readFile(planPath, "utf-8").catch(() => null);
  if (raw === null) {
    console.log(`[revise-apply] no ${REVISION_PLAN_PATH} — run \`cdk revise <dir>\` first.`);
    return;
  }
  const parsed = RevisionPlanSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    console.log(`[revise-apply] ${REVISION_PLAN_PATH} does not match the schema; refusing to apply.`);
    return;
  }

  const plan = parsed.data;
  const items = opts.approveAll ? plan.items : approvedItems(plan);
  if (items.length === 0) {
    console.log(
      `[revise-apply] no approved items. Set "approved": true in ${REVISION_PLAN_PATH}, or pass --approve-all.`
    );
    return;
  }

  const problems = items.flatMap(validateItem);
  if (problems.length > 0) {
    // Refuse the whole run rather than applying the valid subset: a plan with a
    // mis-declared blast radius is a plan the operator did not actually approve.
    for (const p of problems) console.log(`[revise-apply] ${c.yellow("invalid item")}: ${p}`);
    console.log("[revise-apply] refusing to apply — fix the plan first.");
    return;
  }

  const config = await loadConfig(projectRoot);
  // Applied items are recorded so re-running --apply after editing the plan does not
  // revise an already-revised chapter on top of itself. Iterating on a plan is the
  // normal workflow, so this is the common path, not an edge case.
  const state = await loadState(projectRoot);
  console.log(
    `[revise-apply] ${items.length} item(s)${opts.approveAll ? c.yellow(" (--approve-all: gate skipped)") : ""}`
  );

  let applied = 0;
  let rolledBack = 0;

  for (const [i, item] of items.entries()) {
    const stateKey = `revise:${item.id}`;
    if (isComplete(state, stateKey)) {
      console.log(`[revise-apply] ${item.id} already applied — skipping`);
      continue;
    }
    const chapters = await resolveManuscript(projectRoot);
    const chapterPaths = new Map(chapters.map((ch) => [ch.id, ch.relPath]));

    const unknown = item.chapters.filter((id) => !chapterPaths.has(id));
    if (unknown.length > 0) {
      console.log(`[revise-apply] ${item.id}: unknown chapter(s) ${unknown.join(", ")} — skipping`);
      continue;
    }

    // Pre-flight: a protected passage that is already absent makes the guard vacuous,
    // and a vacuous guard is worse than none because it reports as a pass.
    const alreadyMissing = missingPassages(item.protected_passages, chapters);
    if (alreadyMissing.length > 0) {
      console.log(
        `[revise-apply] ${item.id}: ${alreadyMissing.length} protected passage(s) not found in the current text — skipping`
      );
      for (const p of alreadyMissing) console.log(`    ${c.dim(`${p.chapter}: "${p.text.slice(0, 60)}"`)}`);
      continue;
    }

    console.log(`[revise-apply] (${i + 1}/${items.length}) ${item.id} — ${item.title}`);
    // Re-measured per item so each is judged only against the damage it caused,
    // including damage left by an earlier item in this same run.
    const baseline = await invariantBaseline(projectRoot, config.invariants);
    const snapshots = await snapshotChapters(projectRoot, item.chapters);

    await runAgent({
      phase: "revise-chapter",
      projectRoot,
      userPrompt: itemPrompt(item, chapterPaths),
    });

    const failures = await checkPostconditions(projectRoot, item, config.invariants, baseline);
    if (failures.length > 0) {
      await rollback(snapshots);
      rolledBack++;
      console.log(`[revise-apply] ${c.yellow("rolled back")} ${item.id}:`);
      for (const f of failures) console.log(`    ${describeFailure(f)}`);
      await appendLog(projectRoot, [
        `## ${item.id} — ROLLED BACK`,
        `**${item.title}**`,
        ...failures.map((f) => `- ${describeFailure(f)}`),
        "",
      ]);
      continue;
    }

    applied++;
    await markComplete(state, projectRoot, stateKey);
    console.log(`[revise-apply] ${c.green("applied")} ${item.id}`);
    await appendLog(projectRoot, [
      `## ${item.id} — applied`,
      `**${item.title}**`,
      `- findings: ${item.source_findings.join(", ")}`,
      `- chapters: ${item.chapters.join(", ")}`,
      `- ${item.rationale}`,
      "",
    ]);
  }

  console.log(
    `[revise-apply] done — ${c.green(`${applied} applied`)}, ${rolledBack} rolled back, ` +
      `${items.length - applied - rolledBack} skipped`
  );
}
