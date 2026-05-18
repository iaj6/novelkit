import { runAgent } from "../agentRunner.js";
import { loadState, isComplete, markComplete } from "../state.js";

export async function runArchitect(projectRoot: string) {
  const state = await loadState(projectRoot);
  if (isComplete(state, "architect")) {
    console.log("[architect] already complete — skipping (use `cdk run --force` to re-run)");
    return;
  }
  const result = await runAgent({
    phase: "architect",
    projectRoot,
    userPrompt:
      "Read brief.md, then produce the seven canon files in canon/ as described in your instructions. Append the most load-bearing facts to continuity. Then stop.",
  });
  await markComplete(state, projectRoot, "architect");
  return result;
}
