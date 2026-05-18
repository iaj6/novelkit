import * as fs from "node:fs/promises";
import * as path from "node:path";
import { runAgent, type AgentRunResult } from "../agentRunner.js";
import { loadState, isComplete, markComplete } from "../state.js";

export async function runDrafter(projectRoot: string): Promise<AgentRunResult[]> {
  const outlineDir = path.join(projectRoot, "outline");
  let outlineFiles: string[] = [];
  try {
    outlineFiles = (await fs.readdir(outlineDir))
      .filter((f) => f.endsWith(".md") && /^\d{2}-/.test(f) && f !== "00-chapter-map.md")
      .sort();
  } catch {
    console.log("[drafter] outline/ not found — skipping. Run the plotter first.");
    return [];
  }

  if (outlineFiles.length === 0) {
    console.log("[drafter] no chapter outline files found in outline/ — skipping.");
    return [];
  }

  await fs.mkdir(path.join(projectRoot, "draft"), { recursive: true });
  const state = await loadState(projectRoot);

  const results: AgentRunResult[] = [];
  for (const outlineFile of outlineFiles) {
    const chapterId = outlineFile.replace(/\.md$/, "");
    const key = `drafter:${chapterId}`;
    if (isComplete(state, key)) {
      console.log(`[drafter] ${chapterId} already complete — skipping`);
      continue;
    }
    console.log(`[drafter] drafting ${chapterId}…`);
    const result = await runAgent({
      phase: "drafter",
      projectRoot,
      userPrompt: [
        `Draft the chapter described in outline/${outlineFile}.`,
        "Read brief.md, every file in canon/, the outline file itself, logs/story-arc.md, and logs/continuity.md (the accumulating fact ledger from prior chapters — hit every fact in it).",
        "Then call read_recent_scenes with n: 3 for immediate scene context.",
        `Write the chapter prose to draft/${chapterId}.md (call write_file).`,
        `Then call update_story_arc with chapterId="${chapterId}" and a one-line summary.`,
        `Then call record_scene with sceneId="${chapterId}".`,
        "Then call append_continuity for every specific named fact you introduced (physical details, dates, places, characters' attributes, named objects) — over-log; later chapters will only know what is logged. Call append_glossary for every newly named place, person, object, or term.",
        "Then stop.",
      ].join(" "),
    });
    results.push(result);
    await markComplete(state, projectRoot, key);
  }

  return results;
}
