import * as fs from "node:fs/promises";
import * as path from "node:path";
import { runAgent } from "../agentRunner.js";
import { loadState, isComplete, markComplete } from "../state.js";

export async function runEditorContinuity(projectRoot: string) {
  const draftDir = path.join(projectRoot, "draft");
  const chapters = (await fs.readdir(draftDir).catch(() => [] as string[]))
    .filter((f) => f.endsWith(".md"))
    .sort();

  if (chapters.length === 0) {
    console.log("[editor-continuity] no drafts found — skipping.");
    return;
  }

  const state = await loadState(projectRoot);
  const notesFile = path.join(projectRoot, "logs/editor-continuity.md");
  await fs.mkdir(path.dirname(notesFile), { recursive: true });

  // Initialize the notes file on first run only (when no per-chapter passes have completed yet).
  const anyChapterDone = chapters.some((c) =>
    isComplete(state, `editor-continuity:${c.replace(/\.md$/, "")}`)
  );
  if (!anyChapterDone) {
    await fs.writeFile(
      notesFile,
      `# Editor — Continuity Pass\n\nNotes from per-chapter review. Chapters with no entry below had no continuity issues.\n`,
      "utf-8"
    );
  }

  for (let i = 0; i < chapters.length; i++) {
    const chapterFile = chapters[i];
    const chapterId = chapterFile.replace(/\.md$/, "");
    const key = `editor-continuity:${chapterId}`;
    if (isComplete(state, key)) {
      console.log(`[editor-continuity] ${chapterFile} already complete — skipping`);
      continue;
    }
    const prev = i > 0 ? chapters[i - 1] : null;
    console.log(`[editor-continuity] reviewing ${chapterFile} (${i + 1}/${chapters.length})…`);
    await runAgent({
      phase: "editor-continuity",
      projectRoot,
      userPrompt: [
        `Review draft/${chapterFile} (chapter ${i + 1} of ${chapters.length}) for continuity issues only.`,
        `Read canon/continuity.md, logs/continuity.md, logs/story-arc.md,`,
        prev ? `the previous chapter draft/${prev} for adjacency context,` : "",
        `and the chapter itself: draft/${chapterFile}.`,
        `If a small continuity break exists, fix it via write_file. If a larger conflict exists, document it via append_to_file('logs/editor-continuity.md', ...). If the chapter is clean, stop without writing.`,
      ]
        .filter(Boolean)
        .join(" "),
    });
    await markComplete(state, projectRoot, key);
  }
}
