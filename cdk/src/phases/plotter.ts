import { runAgent } from "../agentRunner.js";
import { loadState, isComplete, markComplete } from "../state.js";

export async function runPlotter(projectRoot: string) {
  const state = await loadState(projectRoot);
  if (isComplete(state, "plotter")) {
    console.log("[plotter] already complete — skipping (use `cdk run --force` to re-run)");
    return;
  }
  const result = await runAgent({
    phase: "plotter",
    projectRoot,
    userPrompt:
      "Read brief.md and every file in canon/. Then write outline/00-chapter-map.md followed by one outline file per chapter (NN-<title>.md). Stop when every chapter in the map has an outline file.",
  });
  await markComplete(state, projectRoot, "plotter");
  return result;
}
