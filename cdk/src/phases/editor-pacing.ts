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

  // The per-chapter pacing review that used to run here has been REMOVED on measurement.
  //
  // It cost $72.88 across ~328 lifetime calls and had a measured null against the only external
  // instrument available: chapters it cut appear in blind cold-read panels' weakest lists at 53.1%
  // versus 57.9% for chapters it left alone — i.e. no detectable improvement, and it removed
  // over-articulation at only 1.19x a random-deletion baseline.
  //
  // The macro assessment above is KEPT deliberately. It is the inverse case: $2.73 lifetime, prose-
  // blind by construction, and the only pipeline-internal judgment that survives contact with
  // independent data (its named sag ranges track where blind readers stop, chi2=6.62, p~0.010 —
  // though see docs/editor-ablation.md, which records that the diagnosis fails a stricter
  // per-book test against a positional constant at the sample size currently available).
  //
  // Restoring the per-chapter pass means reinstating this loop; nothing else changed, and the
  // `editor-pacing:<chapterId>` state keys it used are simply no longer written.
}
