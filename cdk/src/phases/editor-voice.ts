import * as fs from "node:fs/promises";
import * as path from "node:path";
import { runAgent } from "../agentRunner.js";
import { loadState, isComplete, markComplete } from "../state.js";

export async function runEditorVoice(projectRoot: string) {
  const draftDir = path.join(projectRoot, "draft");
  const chapters = (await fs.readdir(draftDir).catch(() => [] as string[]))
    .filter((f) => f.endsWith(".md"))
    .sort();

  if (chapters.length === 0) {
    console.log("[editor-voice] no drafts found — skipping.");
    return;
  }

  const state = await loadState(projectRoot);
  const notesFile = path.join(projectRoot, "logs/editor-voice.md");
  await fs.mkdir(path.dirname(notesFile), { recursive: true });

  const anyChapterDone = chapters.some((c) =>
    isComplete(state, `editor-voice:${c.replace(/\.md$/, "")}`)
  );
  if (!anyChapterDone) {
    await fs.writeFile(
      notesFile,
      `# Editor — Voice Pass\n\nNotes from per-chapter review. Chapters with no entry below had no voice issues.\n`,
      "utf-8"
    );
  }

  for (let i = 0; i < chapters.length; i++) {
    const chapterFile = chapters[i];
    const chapterId = chapterFile.replace(/\.md$/, "");
    const key = `editor-voice:${chapterId}`;
    if (isComplete(state, key)) {
      console.log(`[editor-voice] ${chapterFile} already complete — skipping`);
      continue;
    }
    console.log(`[editor-voice] reviewing ${chapterFile} (${i + 1}/${chapters.length})…`);
    await runAgent({
      phase: "editor-voice",
      projectRoot,
      userPrompt: [
        `Voice review for draft/${chapterFile} (chapter ${i + 1} of ${chapters.length}).`,
        "Read canon/style.md, canon/characters.md, and the chapter itself. Do not read other chapters.",
        "Apply small voice fixes (a word, a clause, a line of dialogue) via write_file. Document unfixable problems via append_to_file('logs/editor-voice.md', '## " +
          chapterFile +
          "\\n\\n<your note>\\n').",
        "If the chapter is clean, stop without writing.",
      ].join(" "),
    });
    await markComplete(state, projectRoot, key);
  }
}
