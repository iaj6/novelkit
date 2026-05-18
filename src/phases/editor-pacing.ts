import * as fs from "node:fs/promises";
import * as path from "node:path";
import { runAgent } from "../agentRunner.js";
import { loadState, isComplete, markComplete } from "../state.js";

export async function runEditorPacing(projectRoot: string) {
  const draftDir = path.join(projectRoot, "draft");
  const chapters = (await fs.readdir(draftDir).catch(() => [] as string[]))
    .filter((f) => f.endsWith(".md"))
    .sort();

  if (chapters.length === 0) {
    console.log("[editor-pacing] no drafts found — skipping.");
    return;
  }

  const state = await loadState(projectRoot);
  const notesFile = path.join(projectRoot, "logs/editor-pacing.md");
  await fs.mkdir(path.dirname(notesFile), { recursive: true });

  const macroKey = "editor-pacing:macro";
  if (!isComplete(state, macroKey)) {
    await fs.writeFile(notesFile, `# Editor — Pacing Pass\n`, "utf-8");
    console.log("[editor-pacing] running macro arc assessment…");
    await runAgent({
      phase: "editor-pacing",
      projectRoot,
      userPrompt: [
        "Run the macro arc assessment.",
        "Read brief.md, canon/threads.md, canon/themes.md, outline/00-chapter-map.md, and logs/story-arc.md.",
        "Do NOT read individual chapter drafts in this pass.",
        "Append your assessment to logs/editor-pacing.md by calling append_to_file with a section titled '## Macro arc assessment' (~300–600 words). Cover midbook sag, arc shape, climax/coda balance, repeated beats across chapters, and any structural concerns.",
        "Stop after the macro assessment is written.",
      ].join(" "),
    });
    await markComplete(state, projectRoot, macroKey);
  } else {
    console.log("[editor-pacing] macro arc assessment already complete — skipping");
  }

  for (let i = 0; i < chapters.length; i++) {
    const chapterFile = chapters[i];
    const chapterId = chapterFile.replace(/\.md$/, "");
    const key = `editor-pacing:${chapterId}`;
    if (isComplete(state, key)) {
      console.log(`[editor-pacing] ${chapterFile} already complete — skipping`);
      continue;
    }
    console.log(`[editor-pacing] reviewing ${chapterFile} (${i + 1}/${chapters.length})…`);
    await runAgent({
      phase: "editor-pacing",
      projectRoot,
      userPrompt: [
        `Per-chapter pacing review for draft/${chapterFile} (chapter ${i + 1} of ${chapters.length}).`,
        "Read logs/editor-pacing.md (the macro arc assessment is at the top), canon/threads.md, logs/story-arc.md, and the chapter itself.",
        "Apply small fixes via write_file (cut a redundant beat, tighten a sequence). Document larger issues via append_to_file('logs/editor-pacing.md', '## " +
          chapterFile +
          "\\n\\n<your note>\\n').",
        "If the chapter is clean, stop without writing.",
      ].join(" "),
    });
    await markComplete(state, projectRoot, key);
  }
}
