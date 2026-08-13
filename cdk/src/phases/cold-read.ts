import * as fs from "node:fs/promises";
import * as path from "node:path";
import { runAgent } from "../agentRunner.js";
import { loadState, isComplete, markComplete } from "../state.js";
import { loadConfig } from "../config.js";
import { resolveLenses, type Lens } from "../coldread/lenses.js";
import { resolveManuscript, type ManuscriptChapter } from "../manuscript.js";
import { ColdReadSchema, type ColdRead } from "../coldread/schema.js";
import { verifyPanel, type VerificationReport } from "../coldread/verify.js";
import { COLD_READ_ALLOW_PREFIXES } from "../tools.js";
import * as c from "../ansi.js";

const OUT_DIR = "logs/cold-read";
/** The auditor re-checks reviewer claims against the text, so it sees reports AND the book. */
const AUDIT_ALLOW_PREFIXES = [OUT_DIR, ...COLD_READ_ALLOW_PREFIXES];

async function writeJsonAtomic(projectRoot: string, rel: string, data: unknown): Promise<void> {
  const abs = path.join(projectRoot, rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  const tmp = `${abs}.tmp.${process.pid}.${Date.now()}`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + "\n", "utf-8");
  await fs.rename(tmp, abs);
}

/** Read back the reviews the lenses wrote via write_cold_read. */
async function loadReviews(projectRoot: string, lenses: Lens[]): Promise<ColdRead[]> {
  const out: ColdRead[] = [];
  for (const lens of lenses) {
    const abs = path.join(projectRoot, OUT_DIR, `${lens.id}.json`);
    const text = await fs.readFile(abs, "utf-8").catch(() => null);
    if (text === null) {
      console.log(`[cold-read] ${c.yellow("warning")}: no review file for lens '${lens.id}' — excluded`);
      continue;
    }
    const parsed = ColdReadSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      console.log(`[cold-read] ${c.yellow("warning")}: ${lens.id}.json failed schema validation — excluded`);
      continue;
    }
    out.push(parsed.data);
  }
  return out;
}

function lensPrompt(lens: Lens, chapters: ManuscriptChapter[]): string {
  const list = chapters.map((ch) => `  ${ch.relPath}`).join("\n");
  return [
    `YOUR LENS — ${lens.label}.`,
    lens.promptSection,
    "",
    `THE MANUSCRIPT — ${chapters.length} chapters. Read every one, in this order:`,
    list,
    "",
    "These paths are already resolved to the current version of each chapter; read exactly them.",
    "You have no access to anything else in the project. There is no author brief, outline, or",
    "prior review available to you, and that is deliberate — you are judging the artifact, not",
    "its intentions.",
    "",
    `When you are done, call write_cold_read exactly once with lens set to "${lens.id}".`,
    "Every quote you cite is checked mechanically against the manuscript afterwards, and every",
    "chapter you cite in strongest/weakest is checked for existence. Quote short, quote exactly,",
    "and attribute to the right chapter.",
    "",
    "Cite chapters by ID — the filename without its directory or .md extension",
    `(e.g. "${chapters[0].id}"), not the full path you read from. Where a strength or`,
    "weakness spans several chapters, list them all rather than picking one.",
    "",
    "Give 3-5 entries each for strongest and weakest. If a third weakness does not come",
    "readily, go looking: check whether the book contradicts itself, whether anything is",
    "implausible for its setting or period, and whether any editorial artifact was left in",
    "the finished prose. Report what you find even if it seems small.",
  ].join("\n");
}

function verificationDigest(report: VerificationReport): string {
  const lines = report.per_lens.map((t) => {
    const bad = t.badChapterRefs.length ? `, bad chapter refs: ${t.badChapterRefs.join("/")}` : "";
    return `  ${t.lens}: exact=${t.exact} near=${t.near} misattributed=${t.misattributed} absent=${t.absent}${bad}`;
  });
  const h = report.panel_health;
  return [
    `Quote verification (deterministic, computed in code — not by an agent):`,
    ...lines,
    report.problems.length
      ? `Problem quotes: ${report.problems.length} (see ${OUT_DIR}/verification.json)`
      : "Every quote verified exact.",
    "",
    `Panel health — scores ${h.scores.min}-${h.scores.max} (mean ${h.scores.mean}, spread ${h.scores.spread}); ` +
      `finish ${JSON.stringify(h.finish)}; ${h.claims.weakest} weaknesses across ${h.lenses} lenses.`,
    h.flags.length
      ? `Panel warnings: ${h.flags.map((f) => `(${f})`).join(" ")}`
      : "No panel warnings.",
  ].join("\n");
}

export async function runColdRead(
  projectRoot: string,
  opts: { lenses?: string[] } = {}
): Promise<void> {
  const config = await loadConfig(projectRoot);
  const lenses = resolveLenses(config.coldRead?.lenses, opts.lenses);
  const chapters = await resolveManuscript(projectRoot);

  if (chapters.length === 0) {
    console.log("[cold-read] no drafted chapters found — nothing to review.");
    return;
  }

  const overrides = chapters.filter((ch) => ch.relPath.startsWith("revision-1/")).length;
  console.log(
    `[cold-read] ${chapters.length} chapters` +
      (overrides ? ` (${overrides} from revision-1/)` : "") +
      ` · panel: ${lenses.map((l) => l.id).join(", ")}`
  );

  const state = await loadState(projectRoot);

  // 1. The panel. Each lens is an independent call with no shared context and no
  //    read access beyond the manuscript.
  for (const [i, lens] of lenses.entries()) {
    const key = `cold-read:${lens.id}`;
    if (isComplete(state, key)) {
      console.log(`[cold-read] (${i + 1}/${lenses.length}) ${lens.id} already complete — skipping`);
      continue;
    }
    console.log(`[cold-read] (${i + 1}/${lenses.length}) ${lens.label}…`);
    await runAgent({
      phase: "cold-read",
      projectRoot,
      userPrompt: lensPrompt(lens, chapters),
      toolProfile: "cold-read",
      readAllowPrefixes: COLD_READ_ALLOW_PREFIXES,
    });
    await markComplete(state, projectRoot, key);
  }

  // 2. Verification. Deterministic on purpose: when this was an agent it checked the
  //    easy field and missed that the panel's load-bearing claims were unverified.
  const reviews = await loadReviews(projectRoot, lenses);
  if (reviews.length === 0) {
    console.log("[cold-read] no valid reviews were produced — stopping before synthesis.");
    return;
  }
  const report = verifyPanel(reviews, chapters, new Date().toISOString());
  await writeJsonAtomic(projectRoot, `${OUT_DIR}/verification.json`, report);
  console.log(
    `[cold-read] verified ${report.panel_health.quotes.total} quotes: ` +
      `${c.green(`${report.totals.exact} exact`)}, ${report.totals.near} near, ` +
      `${report.totals.misattributed} misattributed, ${report.totals.absent} absent`
  );
  const health = report.panel_health;
  console.log(
    `[cold-read] panel health: scores ${health.scores.min}-${health.scores.max} ` +
      `(spread ${health.scores.spread}), ${health.claims.weakest} weaknesses across ${health.lenses} lenses`
  );
  // Book-independent warnings about the PANEL, so a degraded run is visible without
  // anyone knowing what defects this particular manuscript happens to contain.
  for (const f of health.flags) console.log(`[cold-read] ${c.yellow("panel warning")}: ${f}`);

  const digest = verificationDigest(report);
  const reviewFiles = reviews.map((r) => `${OUT_DIR}/${r.lens}.json`).join(", ");

  // A one-lens run is degenerate: there is nothing to agree. Observed on the first
  // live run, the synthesis still reached for consensus language ("all four criteria
  // aligned, which is more meaningful than a single score") over a single reviewer
  // applying four labels to their own experience. Say so explicitly rather than
  // relying on the synthesizer to notice.
  const singleLensCaveat =
    reviews.length === 1
      ? [
          "",
          "CRITICAL: this run has exactly ONE reviewer. There is no consensus to report and no",
          "disagreement to interpret. Do not describe one reader's multiple criteria as independent",
          "corroboration, and do not use the words consensus, converged, or agreement. Present this",
          "as a single review, and state its single-lens limitation in the opening section rather",
          "than in a closing footnote.",
        ].join("\n")
      : "";

  // 3. Synthesis — reports only, deliberately without the manuscript.
  const synthKey = "cold-read:synthesis";
  if (!isComplete(state, synthKey)) {
    console.log("[cold-read] synthesizing panel verdict…");
    await runAgent({
      phase: "cold-read-synthesis",
      projectRoot,
      userPrompt: [
        `${reviews.length} independent reviewers read the manuscript, each blind to the author's`,
        `intentions and to each other. Read their reviews: ${reviewFiles},`,
        `and the verification report ${OUT_DIR}/verification.json.`,
        "",
        digest,
        singleLensCaveat,
        "",
        `Write the synthesis to ${OUT_DIR}/panel.md via write_file, following the structure in`,
        "your system prompt. Discount claims from any lens whose quotes came back absent.",
        "Stop once the file is written.",
      ].join("\n"),
      readAllowPrefixes: [OUT_DIR],
    });
    await markComplete(state, projectRoot, synthKey);
  }

  // 4. Panel audit — the stage that pays for itself. It reviews the REVIEWERS, and it
  //    gets the manuscript so it can check their claims instead of trusting them.
  const auditKey = "cold-read:audit";
  if (!isComplete(state, auditKey)) {
    console.log("[cold-read] auditing the panel…");
    await runAgent({
      phase: "cold-read-audit",
      projectRoot,
      userPrompt: [
        `Audit the panel, not the book. Reviews: ${reviewFiles}.`,
        `Verification: ${OUT_DIR}/verification.json. Synthesis: ${OUT_DIR}/panel.md.`,
        `You also have the manuscript (${chapters.length} chapters under draft/ and revision-1/)`,
        "— use it. Check the reviewers' claims yourself rather than taking their word.",
        "",
        digest,
        "",
        `Write your audit to ${OUT_DIR}/audit.md via write_file, following the structure in your`,
        "system prompt. Stop once the file is written.",
      ].join("\n"),
      readAllowPrefixes: AUDIT_ALLOW_PREFIXES,
    });
    await markComplete(state, projectRoot, auditKey);
  }

  console.log(`[cold-read] ${c.green("done")} — reports in ${OUT_DIR}/`);
}
