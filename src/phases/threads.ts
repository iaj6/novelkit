import { runAgent } from "../agentRunner.js";
import { loadState, isComplete, markComplete } from "../state.js";

export async function runThreads(projectRoot: string) {
  const state = await loadState(projectRoot);
  if (isComplete(state, "threads")) {
    console.log("[threads] already complete — skipping (use `cdk run --force` to re-run)");
    return;
  }
  const result = await runAgent({
    phase: "threads",
    projectRoot,
    userPrompt:
      "Read brief.md, every file in canon/, and every file in outline/. Then produce canon/threads.md identifying 3–7 named threads with their entry/advancement/resolution points, plus a weave check table. Stop when threads.md is written.",
  });
  await markComplete(state, projectRoot, "threads");
  return result;
}
