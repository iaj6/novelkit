import * as fs from "node:fs/promises";
import * as path from "node:path";
import { runAgent, type AgentRunResult } from "../agentRunner.js";
import { loadState, isComplete, markComplete, getEntry } from "../state.js";
import { verifyChapter, rollbackChapter, hashFiles } from "../world/checkpoint.js";
import { readEvents } from "../world/store.js";
import { project } from "../world/project.js";
import { regenerateLedgerViews } from "../world/regenerate.js";
import { loadConfig } from "../config.js";
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
  const config = await loadConfig(projectRoot);
  // Project the world store once for resume-verification advisories (resume-only;
  // avoids re-projecting per completed chapter).
  const worldTables = state.completed.length
    ? project((await readEvents(projectRoot)).events)
    : undefined;
  // M6: the world store is the source of truth for the fact ledger; seed/refresh the
  // store-derived logs/continuity.md so the first chapter's drafter reads a real file.
  await regenerateLedgerViews(projectRoot);

  const results: AgentRunResult[] = [];
  const total = outlineFiles.length;
  let chapterIndex = 0;
  for (const outlineFile of outlineFiles) {
    chapterIndex++;
    const progress = `(${chapterIndex}/${total})`;
    const chapterId = outlineFile.replace(/\.md$/, "");
    const key = `drafter:${chapterId}`;
    const draftRel = `draft/${chapterId}.md`;
    if (isComplete(state, key)) {
      // M4: don't trust completed=good — verify the chapter's artifact survived.
      const v = await verifyChapter(projectRoot, chapterId, getEntry(state, key), worldTables);
      if (v.ok) {
        console.log(`${c.phase("drafter")} ${c.dim(progress)} ${chapterId} ${c.dim("already complete — skipping")}`);
        if (v.advisories.length) {
          console.log(`${c.phase("drafter")} ${c.dim(`(${chapterId} world-store advisory: ${v.advisories.join("; ")})`)}`);
        }
        continue;
      }
      console.log(
        `${c.phase("drafter")} ${c.dim(progress)} ${chapterId} ${c.yellow("marked complete but failed verification")} (${v.missing.join("; ")}) ${c.yellow("— re-drafting")}`
      );
      await rollbackChapter(projectRoot, chapterId);
      // fall through to re-draft — never skip a verification failure
    }
    console.log(`${c.phase("drafter")} ${c.dim(progress)} drafting ${chapterId}…`);
    const result = await runAgent({
      phase: "drafter",
      projectRoot,
      userPrompt: [
        `Draft the chapter described in outline/${outlineFile}.`,
        `First, call open_chapter with chapterId="${chapterId}" — this opens the chapter's fact-capture transaction; the world store is the source of truth and logs/continuity.md is regenerated from it.`,
        "Read brief.md, every file in canon/, the outline file itself, logs/story-arc.md, and logs/continuity.md (the accumulating fact ledger from prior chapters — hit every fact in it).",
        "Then call read_recent_scenes with n: 3 for immediate scene context.",
        "Then call read_recent_craft with n: 3 for cross-chapter craft-pattern context (ending modes, opening textures, recurring constructions, per-POV register notes from prior chapters). Use this to detect pattern-pressure before composing — see your system prompt for the awareness procedure.",
        "Before committing any specific number, date, duration, age, distance, or count for an established entity, scan logs/continuity.md for prior assertions about that entity. Your chapter must be consistent with the fact ledger; this is the cheapest place to prevent cross-chapter contradictions.",
        `Write the chapter prose to draft/${chapterId}.md (call write_file).`,
        `Then call update_story_arc with chapterId="${chapterId}" and a one-line summary.`,
        `Then call record_scene with sceneId="${chapterId}". If you flagged pattern-pressure during your pre-write scan, include the flag in record_scene's looseThreads.`,
        `Then call record_chapter_craft with chapterId="${chapterId}" and the structured craft fields (ending_mode, opening_texture, heavy_stylistic_moves, recurring_constructions, pov_register, craft_notes). THIS CALL MUST HAPPEN BEFORE append_continuity / append_glossary — agents drop the last item in long checklists, and the craft-log call must not be the dropped one.`,
        "Then record every durable fact you introduced into the world store — it is the source of truth, and logs/continuity.md is regenerated from it. Use assert_fact for facts that atomize to entity.attribute=value (a stable entity id, a dotted attribute key, the value with a unit if numeric); use append_continuity for facts that don't cleanly atomize (free-text statements — physical details, dates, places, attributes, named objects). Over-log — later chapters only know what you record.",
        "For every newly named place, person, object, or term, call upsert_entity (a stable slug id, kind, display_name) and append_glossary.",
        ...(config.epistemic
          ? [
              'EPISTEMIC CAPTURE (this brief opts in): record who-knows-what with record_knowledge — knower "@reader" for what the reader knows, or a character\'s entity id; proposition {prop:"<short slug>"} or {factRef:"<fact id>"}; stance one of knows / believes / suspects / wrong_believes / unaware / concealing; basis one of witnessed / told_by / inferred / document / overheard. To make an irony actually queryable, four disciplines (pilot-derived): (1) SHARE ONE SLUG — when the reader and a character sit on opposite sides of the same fact, use the SAME prop slug for both; resolve a renamed/aliased identity to ONE proposition (do not split "farrow-on-list" from "farrow-is-the-son"). (2) PIN THE UNAWARE PARTY across the live window — if the reader learns something this chapter that a character will not learn until later, assert that character\'s unaware stance NOW (basis inferred), not only at the chapter they finally find out. (3) READING ORDER — the @reader\'s stance changes in the chapter the prose reveals it; do not defer the reader\'s knowing to a later payoff chapter. (4) ONLY GAPS THAT MATTER — record knowledge that opens or closes a gap between knowers, or that a later reveal depends on; skip a character\'s self-knowledge of a fact just narrated in their own POV. Call who_knows or dramatic_irony to check the reader-vs-POV gap before you commit the scene.',
            ]
          : []),
        `Finally call close_chapter with chapterId="${chapterId}".`,
        "Then stop.",
      ].join(" "),
    });
    results.push(result);
    const hashes = await hashFiles(projectRoot, [draftRel]);
    const eventOffset = (await readEvents(projectRoot)).events.length;
    await markComplete(state, projectRoot, key, { artifacts: [draftRel], hashes, eventOffset });
    // M6: regenerate the store-derived ledger so the NEXT chapter reads current facts.
    await regenerateLedgerViews(projectRoot);
  }

  return results;
}
