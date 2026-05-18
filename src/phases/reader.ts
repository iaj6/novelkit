import * as fs from "node:fs/promises";
import * as path from "node:path";
import { runAgent } from "../agentRunner.js";
import { loadState, isComplete, markComplete } from "../state.js";

export async function runReader(projectRoot: string) {
  const draftDir = path.join(projectRoot, "draft");
  const chapters = (await fs.readdir(draftDir).catch(() => [] as string[]))
    .filter((f) => f.endsWith(".md"))
    .sort();

  if (chapters.length === 0) {
    console.log("[reader] no drafts found — skipping.");
    return;
  }

  const state = await loadState(projectRoot);
  const n = chapters.length;
  const a = Math.ceil(n / 3);
  const b = Math.ceil((2 * n) / 3);
  const acts: string[][] = [chapters.slice(0, a), chapters.slice(a, b), chapters.slice(b)];

  for (let i = 0; i < 3; i++) {
    const actChapters = acts[i];
    if (actChapters.length === 0) continue;
    const key = `reader:act-${i + 1}`;
    if (isComplete(state, key)) {
      console.log(`[reader] act ${i + 1} already complete — skipping`);
      continue;
    }
    const range = `${actChapters[0]} → ${actChapters[actChapters.length - 1]}`;
    console.log(
      `[reader] act ${i + 1} assessment (${range}, ${actChapters.length} chapter${actChapters.length === 1 ? "" : "s"})…`
    );
    await runAgent({
      phase: "reader",
      projectRoot,
      userPrompt: [
        `Act ${i + 1} assessment. This act covers ${actChapters.length} chapter${actChapters.length === 1 ? "" : "s"}: ${actChapters.join(", ")}.`,
        "Read brief.md, canon/style.md, canon/threads.md, canon/themes.md, canon/characters.md, logs/story-arc.md, and each chapter in this act.",
        "Do NOT read chapters outside this act.",
        `Write your assessment to logs/reader-act-${i + 1}.md via write_file (~500–800 words). Cover what worked, what didn't, voice slips, thread development in this act, in-act pacing. Cite chapters and lines.`,
        "Stop after the act assessment is written.",
      ].join(" "),
    });
    await markComplete(state, projectRoot, key);
  }

  const synthesisKey = "reader:synthesis";
  if (isComplete(state, synthesisKey)) {
    console.log("[reader] synthesis already complete — skipping");
    return;
  }
  console.log("[reader] synthesizing final letter + findings…");
  await runAgent({
    phase: "reader",
    projectRoot,
    userPrompt: [
      "Synthesize the developmental editor's review. Two artifacts:",
      "(1) Read brief.md, canon/threads.md, canon/themes.md, canon/style.md, canon/characters.md, logs/story-arc.md, and your three act assessments (logs/reader-act-1.md, logs/reader-act-2.md, logs/reader-act-3.md). Do NOT read individual chapter drafts in this synthesis pass.",
      "(2) Write the full prose letter to logs/reader-letter.md (~1,500–2,500 words) via write_file. Follow the structure in your system prompt.",
      "(3) Call write_findings exactly once with the structured findings array. Group recurring instances into single findings with rich evidence; do not invent bespoke agents. Use only the categories and repair_agent names listed in your system prompt.",
      "Stop after both writes are complete.",
    ].join(" "),
  });
  await markComplete(state, projectRoot, synthesisKey);
}
