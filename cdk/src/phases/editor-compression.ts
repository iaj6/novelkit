import * as fs from "node:fs/promises";
import * as path from "node:path";
import { runAgent } from "../agentRunner.js";
import { loadState, isComplete, markComplete } from "../state.js";

export async function runEditorCompression(projectRoot: string) {
  const draftDir = path.join(projectRoot, "draft");
  const chapters = (await fs.readdir(draftDir).catch(() => [] as string[]))
    .filter((f) => f.endsWith(".md"))
    .sort();

  if (chapters.length === 0) {
    console.log("[editor-compression] no drafts found — skipping.");
    return;
  }

  const state = await loadState(projectRoot);
  const notesFile = path.join(projectRoot, "logs/editor-compression.md");
  await fs.mkdir(path.dirname(notesFile), { recursive: true });

  const anyChapterDone = chapters.some((c) =>
    isComplete(state, `editor-compression:${c.replace(/\.md$/, "")}`)
  );
  if (!anyChapterDone) {
    await fs.writeFile(
      notesFile,
      `# Editor — Compression Pass\n\nPer-chapter changelog. Every cut grouped by kill-list category.\n`,
      "utf-8"
    );
  }

  for (let i = 0; i < chapters.length; i++) {
    const chapterFile = chapters[i];
    const chapterId = chapterFile.replace(/\.md$/, "");
    const key = `editor-compression:${chapterId}`;
    if (isComplete(state, key)) {
      console.log(`[editor-compression] ${chapterFile} already complete — skipping`);
      continue;
    }
    console.log(`[editor-compression] reviewing ${chapterFile} (${i + 1}/${chapters.length})…`);
    await runAgent({
      phase: "editor-compression",
      projectRoot,
      userPrompt: [
        `Compression review for draft/${chapterFile} (chapter ${i + 1} of ${chapters.length}).`,
        "Read canon/style.md and the chapter itself. Do not read other chapters.",
        "Apply only the cuts on your kill list (sentence-after-the-sentence, meta-commentary on cognition, post-scene subtext naming, emotional structural analysis, thesis restatement, dialogue glosses, redundant transitions). NO ADDITIONS, no improvements, no vocabulary swaps.",
        "If you applied any cuts, write the corrected chapter via write_file.",
        "Then call append_to_file('logs/editor-compression.md', '## " +
          chapterId +
          "\\n\\n<your changelog grouped by kill-list category>\\n'). If you made no cuts, the changelog entry is '(clean — no cuts.)'.",
        "Stop after this one chapter.",
      ].join(" "),
    });
    await markComplete(state, projectRoot, key);
  }
}
