import * as fs from "node:fs/promises";
import * as path from "node:path";
import { runAgent } from "../agentRunner.js";
import { loadState, isComplete, markComplete } from "../state.js";
import { readEvents } from "../world/store.js";
import { project } from "../world/project.js";
import { findContradictions, worldStoreStats } from "../world/audit.js";
import { appendFindings } from "../findings.js";

export async function runContinuityFactAudit(projectRoot: string) {
  const draftDir = path.join(projectRoot, "draft");
  const chapters = (await fs.readdir(draftDir).catch(() => [] as string[]))
    .filter((f) => f.endsWith(".md"))
    .sort();

  if (chapters.length === 0) {
    console.log("[continuity-fact-audit] no drafts found — skipping.");
    return;
  }

  const state = await loadState(projectRoot);
  const key = "continuity-fact-audit";
  if (isComplete(state, key)) {
    console.log(
      "[continuity-fact-audit] already complete — skipping (use `cdk phase continuity-fact-audit` to re-run, or `cdk run --force` to clear state)"
    );
    return;
  }

  console.log(
    `[continuity-fact-audit] auditing ${chapters.length} chapter${chapters.length === 1 ? "" : "s"} for cross-chapter fact contradictions…`
  );

  await runAgent({
    phase: "continuity-fact-audit",
    projectRoot,
    userPrompt: [
      `Audit the complete ${chapters.length}-chapter manuscript for cross-chapter contradictions about specific named facts (physical descriptions, dates, ages, places, attributes, possessions, named events).`,
      "Start by reading canon/continuity.md, logs/continuity.md, canon/characters.md, canon/world.md, canon/glossary.md, and logs/story-arc.md. Then read chapters selectively — focus on entities mentioned in multiple chapters.",
      `Chapters available in draft/: ${chapters.join(", ")}`,
      "When you find a verifiable contradiction, prepare a finding per your system prompt's structure (category: 'continuity-fact', strict auto_repair_safe criteria, repair_params shape matching repair-fact-normalize).",
      "When you have all findings, call `append_findings` once with the full array. Use `append_findings`, NOT `write_findings` — the Reader's findings may already be in findings.json and must be preserved.",
      "If the manuscript is consistent, call `append_findings` with an empty array (or skip the call entirely). Zero findings is a valid outcome.",
      "Stop after the findings are written.",
    ].join(" "),
  });

  // M5 AUGMENT: deterministic find_contradictions over the world store, appended
  // ALONGSIDE the LLM re-read's findings (which remain authoritative). Pure +
  // precision-perfect (per the M3.5 probe); adds nothing when the store is empty.
  const tables = project((await readEvents(projectRoot)).events);
  const det = findContradictions(tables);
  if (det.length > 0) {
    await appendFindings(projectRoot, det);
    console.log(
      `[continuity-fact-audit] find_contradictions: ${det.length} deterministic contradiction${det.length === 1 ? "" : "s"} appended`
    );
  }
  const stats = worldStoreStats(tables);
  console.log(
    `[continuity-fact-audit] world store: ${stats.liveFacts} facts, clean-slot ${(stats.cleanSlotRate * 100).toFixed(0)}%, ${stats.offVocabAttributes} off-vocab attr, ${stats.unresolvedEntityRefs} unresolved-entity ref(s)`
  );

  await markComplete(state, projectRoot, key);
}
