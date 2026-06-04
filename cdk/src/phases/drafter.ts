import * as fs from "node:fs/promises";
import * as path from "node:path";
import { runAgent, type AgentRunResult } from "../agentRunner.js";
import { loadState, isComplete, markComplete } from "../state.js";
import * as c from "../ansi.js";

export async function runDrafter(projectRoot: string): Promise<AgentRunResult[]> {
  const outlineDir = path.join(projectRoot, "outline");
  let outlineFiles: string[] = [];
  try {
    outlineFiles = (await fs.readdir(outlineDir))
      .filter((f) => f.endsWith(".md") && /^\d{2}-/.test(f) && f !== "00-chapter-map.md")
      .sort();
  } catch {
    console.log(`${c.phase("drafter")} ${c.yellow("outline/ not found")} — skipping. Run the plotter first.`);
    return [];
  }

  if (outlineFiles.length === 0) {
    console.log(`${c.phase("drafter")} ${c.yellow("no chapter outline files in outline/")} — skipping.`);
    return [];
  }

  await fs.mkdir(path.join(projectRoot, "draft"), { recursive: true });
  const state = await loadState(projectRoot);

  const results: AgentRunResult[] = [];
  const total = outlineFiles.length;
  let chapterIndex = 0;
  for (const outlineFile of outlineFiles) {
    chapterIndex++;
    const progress = `(${chapterIndex}/${total})`;
    const chapterId = outlineFile.replace(/\.md$/, "");
    const key = `drafter:${chapterId}`;
    if (isComplete(state, key)) {
      console.log(`${c.phase("drafter")} ${c.dim(progress)} ${chapterId} ${c.dim("already complete — skipping")}`);
      continue;
    }
    console.log(`${c.phase("drafter")} ${c.dim(progress)} drafting ${chapterId}…`);
    const result = await runAgent({
      phase: "drafter",
      projectRoot,
      userPrompt: [
        `Draft the chapter described in outline/${outlineFile}.`,
        `First, call open_chapter with chapterId="${chapterId}" — this opens the world-store transaction for shadow capture (the markdown logs below remain authoritative).`,
        "Read brief.md, every file in canon/, the outline file itself, logs/story-arc.md, and logs/continuity.md (the accumulating fact ledger from prior chapters — hit every fact in it).",
        "Then call read_recent_scenes with n: 3 for immediate scene context.",
        "Then call read_recent_craft with n: 3 for cross-chapter craft-pattern context (ending modes, opening textures, recurring constructions, per-POV register notes from prior chapters). Use this to detect pattern-pressure before composing — see your system prompt for the awareness procedure.",
        "Before committing any specific number, date, duration, age, distance, or count for an established entity, scan logs/continuity.md for prior assertions about that entity. Your chapter must be consistent with the fact ledger; this is the cheapest place to prevent cross-chapter contradictions.",
        `Write the chapter prose to draft/${chapterId}.md (call write_file).`,
        `Then call update_story_arc with chapterId="${chapterId}" and a one-line summary.`,
        `Then call record_scene with sceneId="${chapterId}". If you flagged pattern-pressure during your pre-write scan, include the flag in record_scene's looseThreads.`,
        `Then call record_chapter_craft with chapterId="${chapterId}" and the structured craft fields (ending_mode, opening_texture, heavy_stylistic_moves, recurring_constructions, pov_register, craft_notes). THIS CALL MUST HAPPEN BEFORE append_continuity / append_glossary — agents drop the last item in long checklists, and the craft-log call must not be the dropped one.`,
        "Then call append_continuity for every specific named fact you introduced (physical details, dates, places, characters' attributes, named objects) — over-log; later chapters will only know what is logged. Call append_glossary for every newly named place, person, object, or term.",
        "Then mirror into the world store (ADDITIVE — do not skip the markdown calls above): for each fact you logged, also call assert_fact with a stable entity id, a dotted attribute key, and the value (with a unit if numeric); for each newly named entity, also call upsert_entity with a stable slug id, kind, and display_name.",
        `Finally call close_chapter with chapterId="${chapterId}".`,
        "Then stop.",
      ].join(" "),
    });
    results.push(result);
    await markComplete(state, projectRoot, key);
  }

  return results;
}
